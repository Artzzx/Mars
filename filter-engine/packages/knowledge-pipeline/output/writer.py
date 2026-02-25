"""
output/writer.py
KnowledgeBaseWriter — writes the final pipeline outputs atomically.

Outputs:
  date/weights/knowledge-base.json      — main knowledge base
  date/weights/knowledge-base.meta.json — checksums and generation metadata
  date/weights/pipeline-report.json     — structured run report

All writes are atomic: write to temp file, then rename. This ensures the
compiler never reads a partially-written file.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

from ..config import PipelineConfig
from ..domain.models import AffixWeight, BuildKnowledgeProfile, PipelineReport

logger = logging.getLogger(__name__)


def _affix_weight_to_dict(aw: AffixWeight) -> dict:
    return {
        "id": aw.id,
        "weight": aw.weight,
        "category": aw.category,
        "min_tier": aw.min_tier,
        "consensus_spread": aw.consensus_spread,
        "confidence": aw.confidence,
    }


def _profile_to_dict(profile: BuildKnowledgeProfile) -> dict:
    phases = {}
    for phase_name, affix_list in profile.phases.items():
        phases[phase_name] = {
            "affixes": [_affix_weight_to_dict(aw) for aw in affix_list]
        }
    return {
        "mastery": profile.mastery,
        "damage_type": profile.damage_type,
        "specificity_score": profile.specificity_score,
        "source_count": profile.source_count,
        "confidence": profile.confidence,
        "data_source_layer": profile.data_source_layer,
        "phases": phases,
    }


def _atomic_write(path: Path, content: str) -> None:
    """Write content to path atomically via temp file + rename."""
    path.parent.mkdir(parents=True, exist_ok=True)
    # Write to temp file in same directory (ensures same filesystem for rename)
    fd, tmp_path = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(content)
        os.replace(tmp_path, path)
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


class KnowledgeBaseWriter:
    """Writes all pipeline outputs atomically to the date/weights/ directory."""

    def __init__(self, config: PipelineConfig) -> None:
        self._config = config

    def write(
        self,
        profiles: dict[str, BuildKnowledgeProfile],
        report: PipelineReport,
    ) -> None:
        """
        Write all outputs. Called only when the full pipeline completes —
        never write partial output.
        """
        weights_dir = self._config.weights_dir
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # ── knowledge-base.json ───────────────────────────────────────────────
        kb_data = {
            "version": self._config.output_version,
            "generated_at": now_iso,
            "patch_version": self._config.patch_version,
            "builds": {
                slug: _profile_to_dict(profile)
                for slug, profile in sorted(profiles.items())
            },
        }
        kb_json = json.dumps(kb_data, indent=2, ensure_ascii=False)
        kb_path = weights_dir / "knowledge-base.json"
        _atomic_write(kb_path, kb_json)
        logger.info("Wrote %s (%d builds)", kb_path, len(profiles))

        # ── knowledge-base.meta.json ──────────────────────────────────────────
        checksum = hashlib.sha256(kb_json.encode("utf-8")).hexdigest()
        meta_data = {
            "generated_at": now_iso,
            "patch_version": self._config.patch_version,
            "build_count": len(profiles),
            "checksum": f"sha256:{checksum}",
        }
        meta_path = weights_dir / "knowledge-base.meta.json"
        _atomic_write(meta_path, json.dumps(meta_data, indent=2, ensure_ascii=False))
        logger.info("Wrote %s", meta_path)

        # ── pipeline-report.json ──────────────────────────────────────────────
        report_data = {
            "generated_at": now_iso,
            "patch_version": self._config.patch_version,
            "builds_processed": report.builds_processed,
            "builds_failed": report.builds_failed,
            "sources_accepted": report.sources_accepted,
            "sources_rejected": report.sources_rejected,
            "low_confidence_builds": report.low_confidence_builds,
            "high_spread_affixes": report.high_spread_affixes,
            "duration_seconds": round(report.duration_seconds, 2),
        }
        report_path = weights_dir / "pipeline-report.json"
        _atomic_write(report_path, json.dumps(report_data, indent=2, ensure_ascii=False))
        logger.info("Wrote %s", report_path)

    def print_report(self, report: PipelineReport) -> None:
        """Print a structured summary to stdout."""
        lines = [
            "",
            "════════════════════════════════════════",
            "  Knowledge Pipeline — Run Report",
            "════════════════════════════════════════",
            f"  Builds processed : {report.builds_processed}",
            f"  Builds failed    : {len(report.builds_failed)}",
        ]
        for failure in report.builds_failed:
            lines.append(f"    ✗ {failure.get('build', '?')}: {failure.get('reason', '?')}")

        lines.append(f"  Sources accepted : {report.sources_accepted}")
        lines.append(f"  Sources rejected : {len(report.sources_rejected)}")
        for rejection in report.sources_rejected:
            lines.append(
                f"    ✗ {rejection.get('source_id', '?')}: {rejection.get('reason', '?')}"
            )

        lines.append(f"  Low confidence   : {len(report.low_confidence_builds)}")
        for slug in report.low_confidence_builds:
            lines.append(f"    ⚠  {slug}")

        lines.append(f"  Duration         : {report.duration_seconds:.1f}s")
        lines.append("════════════════════════════════════════")
        lines.append("")

        print("\n".join(lines))
