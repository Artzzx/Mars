"""
resolver.py
InheritanceResolver — walks the 5-layer inheritance chain and returns a
complete BuildKnowledgeProfile from any level of data availability.

Resolution order:
  0. UniversalBaseline
  1. DamageTypeProfile
  2. ClassProfile
  3. MasteryProfile
  4. BuildOverride (optional — only when consensus data exists)
  5. Graph propagation pass
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from .nodes import (
    BuildOverride,
    ClassProfile,
    DamageTypeProfile,
    MasteryProfile,
    UniversalBaseline,
)

if TYPE_CHECKING:
    from ..config import PipelineConfig
    from ..domain.models import AffixDefinition, AffixWeight, BuildKnowledgeProfile, ConsensusWeight
    from ..graph.affix_graph import AffixRelationshipGraph

logger = logging.getLogger(__name__)

# Specificity score per resolved layer
_LAYER_SPECIFICITY = {
    "baseline": 0.0,
    "damage_type": 0.2,
    "class": 0.4,
    "mastery": 0.7,
    "specific": 1.0,
}

# Weight → category boundary
_CATEGORY_BOUNDARIES = [
    (75.0, "essential"),
    (55.0, "strong"),
    (35.0, "useful"),
    (0.0, "filler"),
]


def _weight_to_category(weight: float) -> str:
    for threshold, category in _CATEGORY_BOUNDARIES:
        if weight >= threshold:
            return category
    return "filler"


class InheritanceResolver:
    """
    Resolves the full inheritance chain for a single build.

    Requires:
    - game_constants: parsed game-constants.json
    - affix_index: dict[int, AffixDefinition] keyed by affix_id
    - graph: AffixRelationshipGraph
    - config: PipelineConfig
    """

    def __init__(
        self,
        game_constants: dict,
        affix_index: "dict[int, AffixDefinition]",
        graph: "AffixRelationshipGraph",
        config: "PipelineConfig",
    ) -> None:
        self._constants = game_constants
        self._affix_index = affix_index
        self._graph = graph
        self._config = config

        # Build a name-key → affix_id lookup for the baseline resolver.
        # Maps snake_case name keys to the most likely affix ID via substring match.
        self._name_to_id: dict[str, int] = {}
        self._build_name_to_id_index()

    def _build_name_to_id_index(self) -> None:
        """Build name-key → affix_id lookup for universal baseline affixes."""
        keyword_map = {
            "added_health": ["added health", "health"],
            "added_vitality": ["vitality", "added vitality"],
            "movement_speed": ["movement speed", "move speed"],
        }
        for key, keywords in keyword_map.items():
            for affix_def in self._affix_index.values():
                name_lower = affix_def.name.lower()
                if any(kw in name_lower for kw in keywords):
                    self._name_to_id[key] = affix_def.affix_id
                    break

    def resolve(
        self,
        mastery: str,
        damage_type: str,
        build_slug: str,
        consensus_weights_by_phase: "dict[str, list[ConsensusWeight]] | None" = None,
        source_count: int = 0,
    ) -> "BuildKnowledgeProfile":
        """
        Walk the full inheritance chain and return a BuildKnowledgeProfile.

        consensus_weights_by_phase: phase → list[ConsensusWeight], or None if no data.
        """
        from ..domain.models import AffixWeight, BuildKnowledgeProfile

        base_class = self._constants.get("mastery_to_class", {}).get(mastery, "")

        # ── Layer 0: Universal Baseline ──────────────────────────────────────
        baseline = UniversalBaseline(self._name_to_id, self._config.universal_baseline_weights)
        weights = baseline.resolve()
        data_source_layer = "baseline"
        specificity_score = _LAYER_SPECIFICITY["baseline"]

        # ── Layer 1: Damage Type Profile ─────────────────────────────────────
        dt_profiles = self._constants.get("damage_type_profiles", {})
        if damage_type and damage_type in dt_profiles:
            dt_node = DamageTypeProfile(damage_type, dt_profiles[damage_type])
            weights = dt_node.merge_into(weights)
            data_source_layer = "damage_type"
            specificity_score = _LAYER_SPECIFICITY["damage_type"]

        # ── Layer 2: Class Profile ────────────────────────────────────────────
        class_hierarchy = self._constants.get("class_hierarchy", {})
        if base_class and base_class in class_hierarchy:
            class_node = ClassProfile(base_class, class_hierarchy[base_class])
            weights = class_node.merge_into(weights)
            data_source_layer = "class"
            specificity_score = _LAYER_SPECIFICITY["class"]

        # ── Layer 3: Mastery Profile ──────────────────────────────────────────
        primary_ids = dt_profiles.get(damage_type, {}).get("primaryAffixIds", []) if damage_type else []
        mastery_node = MasteryProfile(mastery, primary_ids)
        mastery_weights = mastery_node.resolve()
        if mastery_weights:
            weights = mastery_node.merge_into(weights)
            data_source_layer = "mastery"
            specificity_score = _LAYER_SPECIFICITY["mastery"]

        # ── Layer 4: Build Override (data-backed) ─────────────────────────────
        if consensus_weights_by_phase:
            # Flatten all consensus weights into a single affix_id → max_weight dict
            consensus_flat: dict[int, float] = {}
            for phase_weights in consensus_weights_by_phase.values():
                for cw in phase_weights:
                    consensus_flat[cw.affix_id] = max(
                        consensus_flat.get(cw.affix_id, 0.0), cw.weight
                    )
            if consensus_flat:
                override = BuildOverride(consensus_flat)
                weights = override.merge_into(weights)
                data_source_layer = "specific"
                specificity_score = _LAYER_SPECIFICITY["specific"]

        # ── Layer 5: Graph Propagation ────────────────────────────────────────
        build_context = {
            "mastery": mastery,
            "damage_type": damage_type,
            "base_class": base_class,
            # Additional context keys may be added as source data evolves
        }
        weights = self._graph.propagate_weights(
            weights,
            build_context,
            synergy_trigger=self._config.synergy_trigger_weight,
            synergy_boost_per_strength=self._config.synergy_boost_per_strength,
        )

        # ── Filter threshold affixes ──────────────────────────────────────────
        threshold_ids = set(self._constants.get("threshold_affix_ids", []))
        weights = {k: v for k, v in weights.items() if k not in threshold_ids}

        # ── Build phase-stratified output ─────────────────────────────────────
        phases_out: dict[str, list[AffixWeight]] = {
            "starter": [],
            "endgame": [],
            "aspirational": [],
        }

        if consensus_weights_by_phase:
            # Use per-phase consensus data where available
            for phase_name, phase_list in phases_out.items():
                cw_list = consensus_weights_by_phase.get(phase_name, [])
                seen_ids: set[int] = set()
                for cw in sorted(cw_list, key=lambda x: x.weight, reverse=True):
                    if cw.affix_id in threshold_ids:
                        continue
                    phase_list.append(AffixWeight(
                        id=cw.affix_id,
                        weight=round(cw.weight, 2),
                        category=cw.category,
                        min_tier=cw.min_tier or 1,
                        consensus_spread=round(cw.consensus_spread, 4),
                        confidence=round(cw.confidence, 4),
                    ))
                    seen_ids.add(cw.affix_id)
        else:
            # Pure inheritance — put all affixes in all phases with same weight
            sorted_affixes = sorted(
                ((aid, w) for aid, w in weights.items() if w > 0),
                key=lambda x: x[1],
                reverse=True,
            )
            for affix_id, weight in sorted_affixes:
                entry = AffixWeight(
                    id=affix_id,
                    weight=round(weight, 2),
                    category=_weight_to_category(weight),
                    min_tier=1,
                    consensus_spread=0.0,
                    confidence=0.5,  # moderate confidence for pure inheritance
                )
                for phase_list in phases_out.values():
                    phase_list.append(entry)

        # ── Confidence string ─────────────────────────────────────────────────
        if source_count == 0:
            confidence_str = "low"
        elif specificity_score >= _LAYER_SPECIFICITY["specific"] and source_count >= 3:
            confidence_str = "high"
        elif source_count >= 2:
            confidence_str = "medium"
        else:
            confidence_str = "low"

        logger.debug(
            "Resolved %s: layer=%s, specificity=%.2f, sources=%d",
            build_slug, data_source_layer, specificity_score, source_count,
        )

        return BuildKnowledgeProfile(
            build_slug=build_slug,
            mastery=mastery,
            damage_type=damage_type,
            specificity_score=round(specificity_score, 4),
            source_count=source_count,
            confidence=confidence_str,
            data_source_layer=data_source_layer,
            phases=phases_out,
        )
