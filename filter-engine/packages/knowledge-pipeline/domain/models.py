"""
models.py
Pure domain dataclasses — no logic, no I/O. They define the shape of data
as it flows through the pipeline. Every other module references these.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


# ─────────────────────────────────────────────────────────────────────────────
# Game knowledge
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class AffixDefinition:
    """Ground truth for every affix in the game. Loaded from MasterAffixesList.json."""
    affix_id: int
    name: str                    # affixName (internal/loot-filter name)
    display_name: str            # affixDisplayName
    valid_slots: list[int]       # canRollOn — gear slot IDs
    is_class_gated: bool         # classSpecificity != 0
    damage_type: str | None      # None = unclassified (safe default — show everywhere)

    @property
    def is_damage_locked(self) -> bool:
        """Derived: True only when damage_type was explicitly classified."""
        return self.damage_type is not None


# ─────────────────────────────────────────────────────────────────────────────
# Source data
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class RawSource:
    """
    A single ingested source before any processing.
    Stored in memory only — never persisted.
    """
    source_id: str               # unique identifier (filename or hash)
    source_type: str             # "planner" | "filter"
    build_slug: str              # e.g. "avalanche_shaman"
    mastery: str                 # e.g. "shaman"
    damage_type: str             # e.g. "cold"
    phases: dict[str, Any]       # raw phase data keyed by phase name
    checksum: str                # SHA256 for deduplication
    covered_masteries: list[str] # [mastery] for specific, multiple for multi-mastery
    metadata: dict[str, Any]     # source-specific extra info


# ─────────────────────────────────────────────────────────────────────────────
# Quality scoring
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SourceQualityScore:
    """Output of SourceValidator for a single source."""
    source_id: str
    specificity: float           # 1.0 = single mastery, lower for multi-mastery
    affix_coverage: float        # fraction of expected affixes present
    phase_coverage: float        # fraction of 3 phases represented
    recency: float               # 1.0 if current patch, decreasing with age
    consensus_alignment: float   # filled after other sources are scored
    overall: float               # weighted average of all dimensions
    is_supplementary: bool       # True if overall < 0.4


# ─────────────────────────────────────────────────────────────────────────────
# Weight extraction
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ExtractedWeight:
    """A single affix weight inferred from a single source."""
    affix_id: int
    phase: str                   # "starter" | "endgame" | "aspirational"
    weight: float
    min_tier: int | None         # only set by PlannerWeightExtractor
    category: str                # "essential" | "strong" | "useful" | "filler"
    derivation_method: str       # "tier_translation" | "strictness_survival"
    source_id: str


@dataclass
class ConsensusWeight:
    """The merged result across multiple sources for a single affix."""
    affix_id: int
    phase: str
    weight: float
    category: str
    min_tier: int | None
    consensus_spread: float      # std-dev of weights across sources (normalized 0–1)
    confidence: float            # 0–1, decreases with high spread / low source count
    source_count: int


# ─────────────────────────────────────────────────────────────────────────────
# Build output
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class AffixWeight:
    """A single affix entry in the final knowledge base."""
    id: int
    weight: float
    category: str
    min_tier: int
    consensus_spread: float
    confidence: float


@dataclass
class BuildKnowledgeProfile:
    """
    The final output per build. Phases are the top-level grouping because the
    compiler resolves by phase first.
    """
    build_slug: str
    mastery: str
    damage_type: str
    specificity_score: float     # 0.0–1.0, reflects depth of data
    source_count: int
    confidence: str              # "high" | "medium" | "low"
    data_source_layer: str       # "specific"|"mastery"|"class"|"damage_type"|"baseline"
    phases: dict[str, list[AffixWeight]]  # phase → ranked affix list


# ─────────────────────────────────────────────────────────────────────────────
# Pipeline reporting
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PipelineReport:
    """Structured summary of a pipeline run."""
    builds_processed: int = 0
    builds_failed: list[dict[str, str]] = field(default_factory=list)
    sources_accepted: int = 0
    sources_rejected: list[dict[str, str]] = field(default_factory=list)
    low_confidence_builds: list[str] = field(default_factory=list)
    high_spread_affixes: list[dict] = field(default_factory=list)
    duration_seconds: float = 0.0
