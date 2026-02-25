"""
extraction/planner.py
PlannerWeightExtractor — derives weight and min_tier from planner tier data.

Tier → weight translation:
  Tier 7   → 90–100  (essential)
  Tier 5–6 → 65–85   (strong)
  Tier 3–4 → 40–60   (useful)
  Tier 1–2 → 15–35   (filler)

Asymmetric phase persistence multiplier (applied AFTER tier translation):
  BiS/Aspirational only → × 1.0  (ceiling — high importance, rare drop)
  Starter only          → × 0.8  (phases out early)
  All phases present    → × 1.0  (universally important)
  Middle phases only    → × 0.85
"""

from __future__ import annotations

import logging

from ..config import PipelineConfig
from ..domain.models import ExtractedWeight, RawSource
from .base import WeightExtractor
from .resolver import AffixResolver

logger = logging.getLogger(__name__)

_ALL_PHASES = ("starter", "endgame", "aspirational")


def _determine_phase_pattern(phases_present: set[str]) -> str:
    """Classify which phase persistence pattern applies."""
    has_starter = "starter" in phases_present
    has_mid = "endgame" in phases_present
    has_bis = "aspirational" in phases_present

    if has_starter and has_mid and has_bis:
        return "all_phases"
    if has_bis and not has_starter and not has_mid:
        return "bis_only"
    if has_starter and not has_mid and not has_bis:
        return "starter_only"
    return "middle_only"


class PlannerWeightExtractor(WeightExtractor):
    """
    Extracts weight and min_tier from Maxroll planner JSON sources.

    This extractor is the primary source for absolute weights.
    """

    def __init__(self, config: PipelineConfig) -> None:
        self._config = config

    def extract(self, source: RawSource, resolver: AffixResolver) -> list[ExtractedWeight]:
        if source.source_type != "planner":
            return []

        # Collect all (affix_id, tier) pairs per phase
        affix_phases: dict[int, dict[str, int]] = {}  # affix_id → {phase: tier}

        for phase_name in _ALL_PHASES:
            phase_data = source.phases.get(phase_name, {})
            for entry in phase_data.get("affixes", []):
                affix_id = entry.get("affix_id")
                tier = entry.get("tier")
                if affix_id is None or tier is None:
                    continue
                affix_id = int(affix_id)
                tier = int(tier)

                if resolver.is_threshold(affix_id):
                    continue
                if resolver.resolve_id(affix_id) is None:
                    logger.debug(
                        "Skipping unknown affix_id %d in %s", affix_id, source.source_id
                    )
                    continue

                if affix_id not in affix_phases:
                    affix_phases[affix_id] = {}
                affix_phases[affix_id][phase_name] = max(
                    affix_phases[affix_id].get(phase_name, 0), tier
                )

        # For each affix, compute weight per phase + apply phase multiplier
        results: list[ExtractedWeight] = []

        for affix_id, phase_tiers in affix_phases.items():
            phases_present = set(phase_tiers.keys())
            pattern = _determine_phase_pattern(phases_present)
            multiplier = self._config.phase_multipliers.get(pattern, 1.0)

            for phase_name, tier in phase_tiers.items():
                base_weight = self._config.tier_midpoint(tier)
                weight = min(100.0, base_weight * multiplier)
                category = self._config.tier_to_category(tier)
                min_tier = tier  # the minimum tier worth including

                results.append(ExtractedWeight(
                    affix_id=affix_id,
                    phase=phase_name,
                    weight=round(weight, 2),
                    min_tier=min_tier,
                    category=category,
                    derivation_method="tier_translation",
                    source_id=source.source_id,
                ))

        logger.debug(
            "PlannerWeightExtractor: %d weights from %s",
            len(results), source.source_id,
        )
        return results
