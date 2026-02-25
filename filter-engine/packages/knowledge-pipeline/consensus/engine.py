"""
consensus/engine.py
ConsensusEngine — merges all ExtractedWeight instances for a single build
into ConsensusWeight instances using quality-weighted averaging.

Algorithm:
  1. Group by (affix_id, phase)
  2. Outlier detection: > 2 std dev from mean
      - low-quality outlier → exclude
      - high-quality outlier → keep, raise consensus_spread
  3. Weighted average: Σ(weight_i × quality_i) / Σ(quality_i)
  4. Low-confidence clamping: if source_count < MIN_SOURCES_FOR_OVERRIDE,
     clamp toward inherited baseline rather than allowing wild overrides
  5. Compute consensus_spread = normalized std-dev
  6. Compute confidence from spread + source count + quality avg
"""

from __future__ import annotations

import logging
import math
import statistics
from collections import defaultdict

from ..config import PipelineConfig
from ..domain.models import ConsensusWeight, ExtractedWeight

logger = logging.getLogger(__name__)


def _weighted_average(weights: list[float], qualities: list[float]) -> float:
    """Compute quality-weighted average of weights."""
    total_quality = sum(qualities)
    if total_quality == 0:
        return sum(weights) / len(weights) if weights else 0.0
    return sum(w * q for w, q in zip(weights, qualities)) / total_quality


def _compute_confidence(
    spread: float,
    source_count: int,
    quality_avg: float,
    config: PipelineConfig,
) -> float:
    """
    Confidence is a function of:
    - Low spread → higher confidence
    - More sources → higher confidence
    - Higher quality → higher confidence
    """
    source_factor = min(1.0, source_count / 5.0)  # asymptotes toward 1 at 5+ sources
    spread_factor = max(0.0, 1.0 - spread)        # 0 spread = max confidence
    confidence = (quality_avg * 0.4 + spread_factor * 0.4 + source_factor * 0.2)
    return round(min(1.0, confidence), 4)


class ConsensusEngine:
    """
    Merges extracted weights from all accepted sources for a single build.
    """

    def __init__(self, config: PipelineConfig) -> None:
        self._config = config

    def merge(
        self,
        weights: list[ExtractedWeight],
        quality_scores: dict[str, float],  # source_id → overall quality
        baseline_weights: dict[int, float] | None = None,
    ) -> list[ConsensusWeight]:
        """
        Merge a list of ExtractedWeight instances (all sources, all phases) into
        ConsensusWeight instances.

        quality_scores: {source_id: overall_quality_float}
        baseline_weights: inheritance baseline per affix_id (used for low-confidence clamping)
        """
        # Group: (affix_id, phase) → list of (weight, quality, min_tier, category, source_id)
        groups: dict[tuple[int, str], list[tuple[float, float, int | None, str, str]]] = (
            defaultdict(list)
        )
        for ew in weights:
            quality = quality_scores.get(ew.source_id, 0.5)
            groups[(ew.affix_id, ew.phase)].append(
                (ew.weight, quality, ew.min_tier, ew.category, ew.source_id)
            )

        results: list[ConsensusWeight] = []

        for (affix_id, phase), entries in groups.items():
            raw_weights = [e[0] for e in entries]
            raw_qualities = [e[1] for e in entries]
            min_tiers = [e[2] for e in entries if e[2] is not None]
            categories = [e[3] for e in entries]

            # ── Outlier detection ─────────────────────────────────────────────
            if len(raw_weights) >= 3:
                mean = statistics.mean(raw_weights)
                stdev = statistics.stdev(raw_weights)
                std_threshold = self._config.outlier_std_dev_threshold
                filtered_weights = []
                filtered_qualities = []
                outlier_kept = False

                for w, q, *_ in zip(raw_weights, raw_qualities, *zip(*entries[0:1])):
                    if abs(w - mean) > std_threshold * stdev:
                        if q < self._config.supplementary_quality_threshold:
                            logger.debug(
                                "Excluding low-quality outlier: affix=%d phase=%s w=%.1f q=%.2f",
                                affix_id, phase, w, q,
                            )
                            continue
                        else:
                            outlier_kept = True
                    filtered_weights.append(w)
                    filtered_qualities.append(q)

                if not filtered_weights:
                    filtered_weights = raw_weights
                    filtered_qualities = raw_qualities
            else:
                filtered_weights = raw_weights
                filtered_qualities = raw_qualities
                outlier_kept = False

            # ── Weighted average ──────────────────────────────────────────────
            consensus_w = _weighted_average(filtered_weights, filtered_qualities)
            source_count = len(filtered_weights)
            quality_avg = (
                sum(filtered_qualities) / source_count if source_count > 0 else 0.0
            )

            # ── Low-confidence clamping ───────────────────────────────────────
            if (
                source_count < self._config.min_sources_for_override
                and baseline_weights is not None
            ):
                baseline = baseline_weights.get(affix_id, 0.0)
                if baseline > 0:
                    # Clamp toward baseline: 50% blend
                    clamp_factor = 0.5
                    consensus_w = consensus_w * (1 - clamp_factor) + baseline * clamp_factor
                    logger.debug(
                        "Clamping affix %d/%s toward baseline (sources=%d): "
                        "%.1f → %.1f",
                        affix_id, phase, source_count,
                        _weighted_average(filtered_weights, filtered_qualities),
                        consensus_w,
                    )

            # ── Spread and confidence ─────────────────────────────────────────
            if len(filtered_weights) >= 2:
                stdev = statistics.stdev(filtered_weights)
                # Normalize spread to 0–1 (100-point scale)
                spread = min(1.0, stdev / 50.0)
            else:
                spread = 0.0

            if outlier_kept:
                spread = min(1.0, spread + 0.1)  # penalize retained outliers

            confidence = _compute_confidence(spread, source_count, quality_avg, self._config)

            # ── Category and min_tier ─────────────────────────────────────────
            # Prefer planner-derived category if available
            planner_categories = [
                c for ew, c in zip(weights, categories)
                if True  # placeholder
            ]
            # Vote for category: most common
            if categories:
                category_votes: dict[str, int] = defaultdict(int)
                for cat in categories:
                    category_votes[cat] += 1
                final_category = max(category_votes, key=lambda k: category_votes[k])
            else:
                final_category = self._config.tier_to_category(int(consensus_w // 15))

            min_tier = min(min_tiers) if min_tiers else None

            results.append(ConsensusWeight(
                affix_id=affix_id,
                phase=phase,
                weight=round(consensus_w, 2),
                category=final_category,
                min_tier=min_tier,
                consensus_spread=round(spread, 4),
                confidence=confidence,
                source_count=source_count,
            ))

        return results
