"""
extraction/filter_extractor.py
FilterWeightExtractor — derives category calibration and rule structure signals
from community filter XML sources.

Strictness survival → category:
  Uber Strict  → essential
  Very Strict  → strong
  Strict       → useful
  Relaxed only → filler

Filter data informs CATEGORY CALIBRATION, not absolute weights.
The weight values here are used only to rank affixes relative to each other,
not as ground truth weight values (that's the planner's job).
"""

from __future__ import annotations

import logging

from ..config import PipelineConfig
from ..domain.models import ExtractedWeight, RawSource
from .base import WeightExtractor
from .resolver import AffixResolver

logger = logging.getLogger(__name__)

# Strictness → (category, weight_signal)
_STRICTNESS_SIGNALS: dict[str, tuple[str, float]] = {
    "uber_strict": ("essential", 95.0),
    "very_strict": ("strong", 75.0),
    "strict": ("useful", 50.0),
    "relaxed": ("filler", 25.0),
    "show_all": ("filler", 10.0),
}

_ALL_PHASES = ("starter", "endgame", "aspirational")


class FilterWeightExtractor(WeightExtractor):
    """
    Extracts category calibration signals from community filter sources.

    Returns ExtractedWeight instances with derivation_method="strictness_survival".
    These are weighted lower in the ConsensusEngine than planner-derived weights.
    """

    def __init__(self, config: PipelineConfig) -> None:
        self._config = config

    def extract(self, source: RawSource, resolver: AffixResolver) -> list[ExtractedWeight]:
        if source.source_type != "filter":
            return []

        results: list[ExtractedWeight] = []

        # Filters apply uniformly across phases — use first phase's data
        # (all phases have the same strictness_affixes in FilterIngester)
        reference_phase = source.phases.get("endgame") or source.phases.get("starter") or {}
        strictness_affixes = reference_phase.get("strictness_affixes", {})

        if not strictness_affixes:
            logger.debug("No strictness_affixes in %s", source.source_id)
            return []

        # For each affix, find the highest strictness it survives
        affix_best_strictness: dict[int, str] = {}
        strictness_order = ["uber_strict", "very_strict", "strict", "relaxed", "show_all"]

        for strictness in strictness_order:
            for affix_id_raw in strictness_affixes.get(strictness, []):
                try:
                    affix_id = int(affix_id_raw)
                except (ValueError, TypeError):
                    continue

                if resolver.is_threshold(affix_id):
                    continue
                if resolver.resolve_id(affix_id) is None:
                    logger.debug(
                        "Skipping unknown affix_id %d in filter %s",
                        affix_id, source.source_id,
                    )
                    continue

                # Only record the highest (earliest in order) strictness survived
                if affix_id not in affix_best_strictness:
                    affix_best_strictness[affix_id] = strictness

        # Emit one ExtractedWeight per (affix_id, phase) for all phases
        for affix_id, best_strictness in affix_best_strictness.items():
            category, weight_signal = _STRICTNESS_SIGNALS.get(
                best_strictness, ("filler", 25.0)
            )
            for phase_name in _ALL_PHASES:
                results.append(ExtractedWeight(
                    affix_id=affix_id,
                    phase=phase_name,
                    weight=weight_signal,
                    min_tier=None,  # filter data doesn't inform min_tier
                    category=category,
                    derivation_method="strictness_survival",
                    source_id=source.source_id,
                ))

        logger.debug(
            "FilterWeightExtractor: %d weights from %s",
            len(results), source.source_id,
        )
        return results

    def extract_rule_structure_signals(self, source: RawSource) -> dict:
        """
        Capture patterns in how experienced filter authors structure rules.
        Returns a metadata dict for pipeline reporting (not used in weight computation).
        """
        reference_phase = source.phases.get("endgame") or source.phases.get("starter") or {}
        strictness_affixes = reference_phase.get("strictness_affixes", {})

        return {
            "source_id": source.source_id,
            "essential_count": len(strictness_affixes.get("uber_strict", [])),
            "strong_count": len(strictness_affixes.get("very_strict", [])),
            "useful_count": len(strictness_affixes.get("strict", [])),
            "filler_count": len(strictness_affixes.get("relaxed", [])),
            "strictness_levels_present": [
                lvl for lvl in ["uber_strict", "very_strict", "strict", "relaxed", "show_all"]
                if strictness_affixes.get(lvl)
            ],
        }
