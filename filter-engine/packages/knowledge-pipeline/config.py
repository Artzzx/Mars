"""
config.py
PipelineConfig dataclass and all pipeline constants.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class PipelineConfig:
    # ── Paths (relative to the filter-engine directory) ─────────────────────
    mappings_dir: Path = field(default_factory=lambda: Path("data/mappings"))
    sources_dir: Path = field(default_factory=lambda: Path("data/sources"))
    weights_dir: Path = field(default_factory=lambda: Path("data/weights"))
    game_constants_file: Path = field(
        default_factory=lambda: Path("data/mappings/game-constants.json")
    )
    affixes_file: Path = field(
        default_factory=lambda: Path("data/mappings/affixes.json")
    )

    # ── Hard rejection thresholds ────────────────────────────────────────────
    min_unique_affixes: int = 15
    min_sources_for_override: int = 3

    # ── Quality scoring ──────────────────────────────────────────────────────
    supplementary_quality_threshold: float = 0.4
    low_confidence_specificity_threshold: float = 0.5
    low_confidence_source_count: int = 3

    # Quality dimension weights for overall score
    quality_weights: dict[str, float] = field(default_factory=lambda: {
        "specificity": 0.30,
        "affix_coverage": 0.25,
        "phase_coverage": 0.20,
        "recency": 0.15,
        "consensus_alignment": 0.10,
    })

    # ── Fuzzy matching ───────────────────────────────────────────────────────
    fuzzy_match_threshold: float = 0.85

    # ── Tier → weight translation ────────────────────────────────────────────
    # Maps tier number → (min_weight, max_weight); midpoint used for extraction
    tier_weight_ranges: dict[int, tuple[int, int]] = field(default_factory=lambda: {
        7: (90, 100),
        6: (65, 85),
        5: (65, 85),
        4: (40, 60),
        3: (40, 60),
        2: (15, 35),
        1: (15, 35),
    })

    # ── Phase persistence multipliers ────────────────────────────────────────
    phase_multipliers: dict[str, float] = field(default_factory=lambda: {
        "bis_only": 1.0,
        "starter_only": 0.8,
        "all_phases": 1.0,
        "middle_only": 0.85,
    })

    # ── Graph propagation ────────────────────────────────────────────────────
    synergy_boost_per_strength: float = 15.0   # boost = edge.strength * 15
    synergy_trigger_weight: float = 60.0        # only propagate if weight > 60

    # ── Consensus engine ─────────────────────────────────────────────────────
    outlier_std_dev_threshold: float = 2.0
    high_confidence_threshold: float = 0.75
    medium_confidence_threshold: float = 0.50

    # ── Output metadata ──────────────────────────────────────────────────────
    patch_version: str = "1.3.5"
    output_version: str = "1.0.0"

    # ── CLI flags ────────────────────────────────────────────────────────────
    force: bool = False
    dry_run: bool = False
    only_build: str | None = None

    # ── Inheritance baseline weights (hand-authored) ─────────────────────────
    # Affix IDs → weights for the universal baseline.
    # Populated from game knowledge, not scraped data.
    # Key universal affixes: health (ID varies — looked up at runtime by name),
    # endurance (threshold — excluded from weight system), movement speed.
    # These are intentionally sparse — inheritance only provides the floor.
    universal_baseline_weights: dict[str, float] = field(default_factory=lambda: {
        "added_health": 70.0,
        "added_vitality": 65.0,
        "movement_speed": 60.0,
    })

    def tier_midpoint(self, tier: int) -> float:
        """Return the midpoint weight for a given tier."""
        lo, hi = self.tier_weight_ranges.get(tier, (15, 35))
        return (lo + hi) / 2.0

    def tier_to_category(self, tier: int) -> str:
        """Map a tier number to an affix category string."""
        if tier >= 7:
            return "essential"
        if tier >= 5:
            return "strong"
        if tier >= 3:
            return "useful"
        return "filler"
