"""
planner.py
PlannerIngester — reads Maxroll planner export JSON files.

Planner exports provide tier values (1–7) per affix per item slot,
phase-stratified. This is the highest-quality input: explicit, structured,
human-authored build data.

Expected JSON shape (best-effort — validates at ingestion time):
{
  "build_slug": "avalanche_shaman",
  "mastery": "shaman",
  "damage_type": "cold",
  "covered_masteries": ["shaman"],
  "phases": {
    "starter": {
      "affixes": [
        { "affix_id": 42, "tier": 5 },
        ...
      ]
    },
    "endgame": { ... },
    "aspirational": { ... }
  },
  "metadata": { "author": "...", "patch": "1.3.5", ... }
}
"""

from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path

from ..domain.models import RawSource
from .base import SourceIngester

logger = logging.getLogger(__name__)

VALID_PHASES = {"starter", "endgame", "aspirational"}


class PlannerIngester(SourceIngester):
    """Reads Maxroll planner export JSON and normalizes it into a RawSource."""

    def ingest(self, file_path: Path) -> RawSource:
        raw_text = file_path.read_text(encoding="utf-8")
        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON in {file_path}: {exc}") from exc

        # ── Required fields ───────────────────────────────────────────────────
        build_slug = data.get("build_slug")
        mastery = data.get("mastery")
        raw_dt = data.get("damage_types") or data.get("damage_type")
        damage_types = raw_dt if isinstance(raw_dt, list) else [raw_dt]
        archetype = data.get("archetype", "unknown")
        phases_raw = data.get("phases")

        if not build_slug:
            raise ValueError(f"Missing 'build_slug' in {file_path}")
        if not mastery:
            raise ValueError(f"Missing 'mastery' in {file_path}")
        if not isinstance(phases_raw, dict):
            raise ValueError(f"Missing or invalid 'phases' in {file_path}")

        # ── Normalize phases ──────────────────────────────────────────────────
        phases: dict[str, dict] = {}
        for phase_name in VALID_PHASES:
            phase_data = phases_raw.get(phase_name, {})
            affixes = phase_data.get("affixes", [])
            # Normalize: ensure each entry has affix_id and tier
            normalized_affixes = []
            for entry in affixes:
                affix_id = entry.get("affix_id")
                tier = entry.get("tier")
                if affix_id is not None and tier is not None:
                    normalized_affixes.append({
                        "affix_id": int(affix_id),
                        "tier": int(tier),
                    })
                else:
                    logger.debug(
                        "Skipping malformed affix entry in %s/%s: %r",
                        file_path.name, phase_name, entry,
                    )
            phases[phase_name] = {"affixes": normalized_affixes}

        # ── Covered masteries ─────────────────────────────────────────────────
        covered_masteries: list[str] = data.get("covered_masteries") or [mastery]
        if isinstance(covered_masteries, str):
            covered_masteries = [covered_masteries]

        # ── Checksum ──────────────────────────────────────────────────────────
        checksum = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()

        metadata = data.get("metadata", {})
        metadata["source_file"] = file_path.name

        return RawSource(
            source_id=f"planner:{file_path.stem}",
            source_type="planner",
            build_slug=str(build_slug),
            mastery=str(mastery),
            damage_types=damage_types,
            archetype=archetype,
            phases=phases,
            checksum=checksum,
            covered_masteries=covered_masteries,
            metadata=metadata,
        )
