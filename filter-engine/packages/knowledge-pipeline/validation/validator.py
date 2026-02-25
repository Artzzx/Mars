"""
validator.py
SourceValidator — the quality gate. Every source passes through before any
weight extraction.

Hard rejection rules (any one triggers full discard):
  1. Fewer than 15 unique affix IDs
  2. Contains affix IDs not found in the affix mapping
  3. No phase differentiation in the data
  4. Checksum matches an already-processed source (duplicate)

Multi-mastery sources are NOT hard rejected — they receive scope dilution.

Soft scoring dimensions (0–1):
  - specificity      : 1.0 for single mastery, 1/n for multi-mastery
  - affix_coverage   : fraction of affix IDs that resolved successfully
  - phase_coverage   : number of non-empty phases / 3
  - recency          : 1.0 (default — no patch metadata enforcement yet)
  - consensus_alignment : filled later by pipeline, default 1.0
"""

from __future__ import annotations

import logging

from ..domain.models import RawSource, SourceQualityScore
from ..ingestion.base import SourceScope, SourceIngester

logger = logging.getLogger(__name__)

# Weight of each quality dimension for overall score computation
_QUALITY_WEIGHTS = {
    "specificity": 0.30,
    "affix_coverage": 0.25,
    "phase_coverage": 0.20,
    "recency": 0.15,
    "consensus_alignment": 0.10,
}


def _extract_all_affix_ids(source: RawSource) -> set[int]:
    """Extract all unique affix IDs referenced in a source's phase data."""
    ids: set[int] = set()

    for phase_data in source.phases.values():
        # PlannerIngester format: {"affixes": [{"affix_id": N, "tier": M}]}
        for entry in phase_data.get("affixes", []):
            if isinstance(entry, dict) and "affix_id" in entry:
                ids.add(int(entry["affix_id"]))

        # FilterIngester format: {"strictness_affixes": {"strict": [N, ...]}}
        for affix_list in phase_data.get("strictness_affixes", {}).values():
            ids.update(int(aid) for aid in affix_list if isinstance(aid, (int, str)))

    return ids


def _has_phase_differentiation(source: RawSource) -> bool:
    """
    Returns True if the source contains data in more than one phase,
    OR if the source type is 'filter' (filters apply to all phases uniformly,
    so they inherently differentiate via strictness levels).
    """
    if source.source_type == "filter":
        # Filters with strictness levels count as differentiated
        for phase_data in source.phases.values():
            if phase_data.get("strictness_affixes"):
                return True
        return False

    # Planners: check that at least 2 phases have non-empty affix lists
    phases_with_data = sum(
        1 for phase_data in source.phases.values()
        if phase_data.get("affixes")
    )
    return phases_with_data >= 2


class SourceValidator:
    """Validates a RawSource and produces a SourceQualityScore."""

    def __init__(
        self,
        known_affix_ids: set[int],
        config_quality_weights: dict[str, float] | None = None,
        min_unique_affixes: int = 15,
        supplementary_threshold: float = 0.4,
    ) -> None:
        self._known_ids = known_affix_ids
        self._quality_weights = config_quality_weights or _QUALITY_WEIGHTS
        self._min_unique = min_unique_affixes
        self._supplementary_threshold = supplementary_threshold

    def validate(
        self,
        source: RawSource,
        known_checksums: set[str],
    ) -> tuple[bool, SourceQualityScore | None, str]:
        """
        Validate a source.

        Returns:
            (accepted: bool, quality_score | None, rejection_reason: str)

        If accepted is False, quality_score is None and reason explains why.
        """
        all_ids = _extract_all_affix_ids(source)
        unique_count = len(all_ids)

        # ── Hard rejection 1: too sparse ──────────────────────────────────────
        if unique_count < self._min_unique:
            reason = (
                f"Too few unique affix IDs: {unique_count} < {self._min_unique}"
            )
            logger.info("[REJECT] %s — %s", source.source_id, reason)
            return False, None, reason

        # ── Hard rejection 2: unknown affix IDs ───────────────────────────────
        unknown_ids = all_ids - self._known_ids
        if unknown_ids:
            reason = (
                f"Contains {len(unknown_ids)} unknown affix ID(s): "
                f"{sorted(unknown_ids)[:5]}{'...' if len(unknown_ids) > 5 else ''}"
            )
            logger.info("[REJECT] %s — %s", source.source_id, reason)
            return False, None, reason

        # ── Hard rejection 3: no phase differentiation ────────────────────────
        if not _has_phase_differentiation(source):
            reason = "No phase differentiation — cannot derive progression signals"
            logger.info("[REJECT] %s — %s", source.source_id, reason)
            return False, None, reason

        # ── Hard rejection 4: duplicate (checksum match) ──────────────────────
        if source.checksum in known_checksums:
            reason = "Duplicate source detected (checksum match)"
            logger.info("[REJECT] %s — %s", source.source_id, reason)
            return False, None, reason

        # ── Soft scoring ──────────────────────────────────────────────────────
        scope = SourceIngester._determine_scope(source.covered_masteries)
        specificity = self._compute_specificity(scope, source.covered_masteries)
        affix_coverage = self._compute_affix_coverage(all_ids, source)
        phase_coverage = self._compute_phase_coverage(source)
        recency = 1.0  # default — patch validation not enforced yet
        consensus_alignment = 1.0  # filled later after all sources are processed

        overall = self._compute_overall(
            specificity, affix_coverage, phase_coverage, recency, consensus_alignment
        )
        is_supplementary = overall < self._supplementary_threshold

        score = SourceQualityScore(
            source_id=source.source_id,
            specificity=round(specificity, 4),
            affix_coverage=round(affix_coverage, 4),
            phase_coverage=round(phase_coverage, 4),
            recency=round(recency, 4),
            consensus_alignment=round(consensus_alignment, 4),
            overall=round(overall, 4),
            is_supplementary=is_supplementary,
        )

        logger.debug(
            "[ACCEPT] %s — overall=%.2f, specificity=%.2f, affix_cov=%.2f, phase_cov=%.2f",
            source.source_id, overall, specificity, affix_coverage, phase_coverage,
        )
        return True, score, ""

    # ── Scoring helpers ───────────────────────────────────────────────────────

    def _compute_specificity(self, scope: SourceScope, covered_masteries: list[str]) -> float:
        if scope == SourceScope.SPECIFIC:
            return 1.0
        if not covered_masteries:
            return 0.1
        return min(1.0, 1.0 / len(covered_masteries))

    def _compute_affix_coverage(self, all_ids: set[int], source: RawSource) -> float:
        """
        Fraction of affix IDs in this source that exist in the known mapping.
        (All unknown IDs already caused hard rejection, so this is effectively 1.0
        if we reach here. However, we score based on how many affixes were found
        vs. how many a typical source of this type would have.)
        """
        if not all_ids:
            return 0.0
        known_present = len(all_ids & self._known_ids)
        return known_present / len(all_ids)

    def _compute_phase_coverage(self, source: RawSource) -> float:
        """Fraction of 3 phases that contain data."""
        phases_with_data = 0
        for phase_data in source.phases.values():
            if phase_data.get("affixes"):
                phases_with_data += 1
            elif phase_data.get("strictness_affixes"):
                # Filter sources have strictness data instead
                any_affixes = any(
                    bool(ids) for ids in phase_data["strictness_affixes"].values()
                )
                if any_affixes:
                    phases_with_data += 1
        return min(1.0, phases_with_data / 3.0)

    def _compute_overall(
        self,
        specificity: float,
        affix_coverage: float,
        phase_coverage: float,
        recency: float,
        consensus_alignment: float,
    ) -> float:
        scores = {
            "specificity": specificity,
            "affix_coverage": affix_coverage,
            "phase_coverage": phase_coverage,
            "recency": recency,
            "consensus_alignment": consensus_alignment,
        }
        total_weight = sum(self._quality_weights.values())
        weighted_sum = sum(
            scores[dim] * self._quality_weights.get(dim, 0.0)
            for dim in scores
        )
        return weighted_sum / total_weight if total_weight > 0 else 0.0
