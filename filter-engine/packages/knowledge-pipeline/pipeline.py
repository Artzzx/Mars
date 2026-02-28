"""
pipeline.py
IngestionPipeline — orchestrator and CLI entry point.

Usage:
    python -m packages.knowledge_pipeline.pipeline
    python -m packages.knowledge_pipeline.pipeline --only avalanche_shaman
    python -m packages.knowledge_pipeline.pipeline --dry-run
    python -m packages.knowledge_pipeline.pipeline --force

The pipeline is sequential — one build at a time. No parallelism.
A single failed build never crashes the pipeline — it's logged and continued.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from collections import defaultdict
from pathlib import Path

from .config import PipelineConfig
from .consensus.engine import ConsensusEngine
from .domain.models import BuildKnowledgeProfile, ExtractedWeight, PipelineReport, RawSource
from .extraction.filter_extractor import FilterWeightExtractor
from .extraction.planner import PlannerWeightExtractor
from .extraction.resolver import AffixResolver
from .graph.affix_graph import AffixRelationshipGraph
from .ingestion.filter_ingester import FilterIngester
from .ingestion.planner import PlannerIngester
from .inheritance.resolver import InheritanceResolver
from .output.writer import KnowledgeBaseWriter
from .validation.validator import SourceValidator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

STRICTNESS_SUFFIXES = {
    "_regular", "_strict", "_very_strict", 
    "_uber_strict", "_giga_strict", "_normal", "_relaxed"
}

def _build_slug_from_path(path: Path) -> str:
    stem = path.stem
    if path.suffix.lower() == ".xml":
        # Strip strictness suffix to group filter back to its parent build
        for suffix in STRICTNESS_SUFFIXES:
            if stem.endswith(suffix):
                return stem[: -len(suffix)]
    return stem

# ─────────────────────────────────────────────────────────────────────────────
# Source discovery
# ─────────────────────────────────────────────────────────────────────────────

def _discover_sources(sources_dir: Path) -> dict[str, list[Path]]:
    """
    Discover all source files grouped by build_slug.

    Looks in:
      data/sources/planners/normalized/*.json
      date/sources/filters/*.xml

    Build slug is inferred from filename: "avalanche_shaman.json" → "avalanche_shaman".
    Skips non-data files (like "test" with no extension, README, etc.).
    """
    build_sources: dict[str, list[Path]] = defaultdict(list)
    EXCLUDE_FILES = {"normalization-report.json", "planner-warnings.json"}

    planners_dir = sources_dir / "planners" / "normalized"
    filters_dir = sources_dir / "filters"

    if planners_dir.exists():
        for path in sorted(planners_dir.iterdir()):
            if path.name in EXCLUDE_FILES:
                continue
            if path.suffix.lower() == ".json" and path.stat().st_size > 0:
                slug = _build_slug_from_path(path)
                build_sources[slug].append(path)

    if filters_dir.exists():
        for path in sorted(filters_dir.iterdir()):
            if path.suffix.lower() == ".xml" and path.stat().st_size > 0:
                slug = _build_slug_from_path(path)
                # Only add if the parent build already has a planner source
                if slug in build_sources:
                    build_sources[slug].append(path)

    return dict(build_sources)


def _ingest_file(file_path: Path) -> RawSource:
    """Ingest a single source file using the appropriate ingester."""
    if file_path.suffix.lower() == ".json":
        return PlannerIngester().ingest(file_path)
    elif file_path.suffix.lower() == ".xml":
        return FilterIngester().ingest(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_path.suffix}")


# ─────────────────────────────────────────────────────────────────────────────
# Pipeline
# ─────────────────────────────────────────────────────────────────────────────

class IngestionPipeline:
    """
    Main pipeline orchestrator.

    10-step per-build processing sequence (see ARCHITECTURE.md):
      1. Load all RawSources for this build slug
      2. Validate each → SourceQualityScore
      3. Discard hard-rejected sources
      4. Extract weights from accepted sources → list[ExtractedWeight]
      5. Merge via ConsensusEngine → list[ConsensusWeight]
      6. Resolve inheritance hierarchy → base weights
      7. Apply ConsensusWeights as overrides on inheritance result
      8. Run graph propagation pass (done inside InheritanceResolver)
      9. Package into BuildKnowledgeProfile
      10. Record specificity score and data source layer
    """

    def __init__(self, config: PipelineConfig) -> None:
        self._config = config
        self._resolver: AffixResolver | None = None
        self._inheritance_resolver: InheritanceResolver | None = None
        self._consensus_engine = ConsensusEngine(config)
        self._planner_extractor = PlannerWeightExtractor(config)
        self._filter_extractor = FilterWeightExtractor(config)
        self._writer = KnowledgeBaseWriter(config)

    def _load_dependencies(self) -> None:
        """Load affix index, game constants, and build the graph."""
        logger.info("Loading affix index from %s …", self._config.affixes_file)
        self._resolver = AffixResolver(
            affixes_file=self._config.affixes_file,
            game_constants_file=self._config.game_constants_file,
            fuzzy_threshold=self._config.fuzzy_match_threshold,
        )

        logger.info("Loading game constants from %s …", self._config.game_constants_file)
        if not self._config.game_constants_file.exists():
            logger.error(
                "game-constants.json not found. "
                "Run: python packages/knowledge-pipeline/scripts/export_ts_constants.py"
            )
            sys.exit(1)

        game_constants = json.loads(
            self._config.game_constants_file.read_text(encoding="utf-8")
        )

        graph = AffixRelationshipGraph(game_constants.get("affix_edges", []))

        self._inheritance_resolver = InheritanceResolver(
            game_constants=game_constants,
            affix_index=self._resolver.index,
            graph=graph,
            config=self._config,
        )

    def process_build(
        self,
        build_slug: str,
        source_files: list[Path],
        report: PipelineReport,
    ) -> BuildKnowledgeProfile:
        """
        Process all sources for a single build and return a BuildKnowledgeProfile.
        """
        assert self._resolver is not None, "Call _load_dependencies first"
        assert self._inheritance_resolver is not None, "Call _load_dependencies first"

        validator = SourceValidator(
            known_affix_ids=self._resolver.known_ids,
            min_unique_affixes=self._config.min_unique_affixes,
            supplementary_threshold=self._config.supplementary_quality_threshold,
        )

        # ── Step 1: Ingest all sources ────────────────────────────────────────
        raw_sources: list[RawSource] = []
        for file_path in source_files:
            try:
                raw = _ingest_file(file_path)
                raw_sources.append(raw)
            except Exception as exc:
                logger.warning("Failed to ingest %s: %s", file_path, exc)
                report.sources_rejected.append({
                    "source_id": str(file_path.name),
                    "build": build_slug,
                    "reason": f"Ingestion error: {exc}",
                })

        if not raw_sources:
            raise ValueError(f"No sources could be ingested for build {build_slug!r}")

        # ── Steps 2–3: Validate, collect quality scores, discard rejected ─────
        accepted_sources: list[RawSource] = []
        quality_scores: dict[str, float] = {}  # source_id → overall quality
        known_checksums: set[str] = set()

        for source in raw_sources:
            accepted, quality, reason = validator.validate(source, known_checksums)
            if not accepted:
                report.sources_rejected.append({
                    "source_id": source.source_id,
                    "build": build_slug,
                    "reason": reason,
                })
                continue

            accepted_sources.append(source)
            quality_scores[source.source_id] = quality.overall  # type: ignore[union-attr]
            known_checksums.add(source.checksum)
            report.sources_accepted += 1

        if not accepted_sources:
            # No accepted sources — fall back to pure inheritance profile
            logger.warning(
                "[%s] No accepted sources — generating inheritance-only profile",
                build_slug,
            )
            mastery = raw_sources[0].mastery if raw_sources else ""
            damage_types = raw_sources[0].damage_types if raw_sources else []
            archetype = raw_sources[0].archetype if raw_sources else ""
            return self._inheritance_resolver.resolve(
                mastery=mastery,
                damage_types=damage_types,
                archetype=archetype,
                build_slug=build_slug,
                consensus_weights_by_phase=None,
                source_count=0,
            )

        # ── Step 4: Extract weights ───────────────────────────────────────────
        all_extracted: list[ExtractedWeight] = []
        for source in accepted_sources:
            if source.source_type == "planner":
                extracted = self._planner_extractor.extract(source, self._resolver)
            else:
                extracted = self._filter_extractor.extract(source, self._resolver)
            all_extracted.extend(extracted)

        # ── Step 5: Merge via ConsensusEngine ─────────────────────────────────
        consensus_weights = self._consensus_engine.merge(
            all_extracted,
            quality_scores,
        )

        # Group consensus weights by phase
        consensus_by_phase: dict[str, list] = defaultdict(list)
        for cw in consensus_weights:
            consensus_by_phase[cw.phase].append(cw)

        # ── Steps 6–10: Inheritance resolution + graph propagation ────────────
        mastery = accepted_sources[0].mastery
        damage_types = accepted_sources[0].damage_types
        archetype = accepted_sources[0].archetype

        profile = self._inheritance_resolver.resolve(
            mastery=mastery,
            damage_types=damage_types,
            archetype=archetype,
            build_slug=build_slug,
            consensus_weights_by_phase=dict(consensus_by_phase) if consensus_weights else None,
            source_count=len(accepted_sources),
        )

        return profile

    def run(self) -> PipelineReport:
        """Run the full pipeline. Returns a PipelineReport."""
        config = self._config
        report = PipelineReport()
        start_time = time.monotonic()

        logger.info("Knowledge Pipeline starting …")
        self._load_dependencies()

        # ── Discover sources ──────────────────────────────────────────────────
        build_sources = _discover_sources(config.sources_dir)

        if config.only_build:
            if config.only_build in build_sources:
                build_sources = {config.only_build: build_sources[config.only_build]}
            else:
                logger.error("Build %r not found in %s", config.only_build, config.sources_dir)
                build_sources = {}

        logger.info("Found %d build(s) to process", len(build_sources))

        if not build_sources:
            logger.info("No builds found — check %s", config.sources_dir)

        # ── Process each build ────────────────────────────────────────────────
        profiles: dict[str, BuildKnowledgeProfile] = {}

        for build_slug, source_files in sorted(build_sources.items()):
            logger.info("[%s] Processing %d source file(s) …", build_slug, len(source_files))
            try:
                profile = self.process_build(build_slug, source_files, report)
                profiles[build_slug] = profile
                report.builds_processed += 1

                # Flag low-confidence builds for human review
                if (
                    profile.specificity_score < config.low_confidence_specificity_threshold
                    or profile.source_count < config.low_confidence_source_count
                ):
                    report.low_confidence_builds.append(build_slug)

            except Exception as exc:
                logger.error("[FAIL] %s: %s", build_slug, exc, exc_info=True)
                report.builds_failed.append({
                    "build": build_slug,
                    "reason": str(exc),
                })

        # ── Write output ──────────────────────────────────────────────────────
        report.duration_seconds = time.monotonic() - start_time

        if not config.dry_run:
            if profiles or not config.force:
                self._writer.write(profiles, report)
        else:
            logger.info("Dry run — skipping output write")

        self._writer.print_report(report)
        return report


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Knowledge Ingestion Pipeline — transforms build data into knowledge-base.json"
    )
    parser.add_argument(
        "--only",
        metavar="BUILD_SLUG",
        default=None,
        help="Process only this build slug",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate sources and print report, write nothing",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force rebuild even if output already exists",
    )
    parser.add_argument(
        "--patch-version",
        default="1.3.5",
        metavar="VERSION",
        help="Game patch version to embed in output (default: 1.3.5)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable debug logging",
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    config = PipelineConfig(
        dry_run=args.dry_run,
        force=args.force,
        only_build=args.only,
        patch_version=args.patch_version,
    )

    pipeline = IngestionPipeline(config)
    report = pipeline.run()

    # Exit with non-zero code if all builds failed (or partial failures in CI)
    if report.builds_failed and report.builds_processed == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
