"""
filter_ingester.py
FilterIngester — reads Last Epoch community filter XML files.

Filters encode affix relevance through strictness levels:
  - Uber Strict / Very Strict / Strict / Relaxed / Show All

Each rule block contains affix conditions. We extract which affix IDs appear
at each strictness level to derive behavioral "category" signals.

Expected XML shape (Last Epoch loot filter format):
<LootFilter version="..." build_slug="..." mastery="..." damage_type="...">
  <RuleBlock strictness="strict">
    <Rule>
      <Condition type="AffixId" value="42"/>
      <Condition type="AffixId" value="77"/>
    </Rule>
  </RuleBlock>
  <RuleBlock strictness="very_strict">
    ...
  </RuleBlock>
</LootFilter>

The exact attribute names are flexible — the ingester tries multiple common
conventions used in Last Epoch community filters.
"""

from __future__ import annotations

import hashlib
import logging
import re
import xml.etree.ElementTree as ET
from pathlib import Path

from ..domain.models import RawSource
from .base import SourceIngester

logger = logging.getLogger(__name__)

# Strictness level → canonical name mapping (handles various naming conventions)
_STRICTNESS_MAP: dict[str, str] = {
    # Canonical
    "uber_strict": "uber_strict",
    "very_strict": "very_strict",
    "strict": "strict",
    "relaxed": "relaxed",
    "show_all": "show_all",
    # Common variants
    "uberstrict": "uber_strict",
    "verystrict": "very_strict",
    "normal": "relaxed",
    "lax": "show_all",
    "all": "show_all",
}

VALID_PHASES = {"starter", "endgame", "aspirational"}

# Attributes that commonly store affix IDs in filter XML
_AFFIX_ID_ATTRS = {"value", "id", "affixid", "affix_id"}


class FilterIngester(SourceIngester):
    """Reads a Last Epoch community filter XML file and normalizes it into a RawSource."""

    def ingest(self, file_path: Path) -> RawSource:
        raw_text = file_path.read_text(encoding="utf-8")
        try:
            root = ET.fromstring(raw_text)
        except ET.ParseError as exc:
            raise ValueError(f"Invalid XML in {file_path}: {exc}") from exc

        # ── Extract metadata ──────────────────────────────────────────────────
        # Try common attribute names for build metadata
        build_slug = (
            root.get("build_slug")
            or root.get("buildSlug")
            or root.get("build")
            or file_path.stem
        )
        mastery = (
            root.get("mastery")
            or root.get("class")
            or ""
        )
        damage_type = root.get("damage_type") or root.get("damageType") or ""

        # ── Extract affix IDs per strictness level ────────────────────────────
        strictness_affixes: dict[str, set[int]] = {
            "uber_strict": set(),
            "very_strict": set(),
            "strict": set(),
            "relaxed": set(),
            "show_all": set(),
        }

        for rule_block in root.iter("RuleBlock"):
            raw_strictness = (
                rule_block.get("strictness")
                or rule_block.get("level")
                or "relaxed"
            ).lower().replace(" ", "_").replace("-", "_")
            canonical = _STRICTNESS_MAP.get(raw_strictness, "relaxed")

            for condition in rule_block.iter("Condition"):
                cond_type = (condition.get("type") or "").lower()
                if "affix" not in cond_type and "id" not in cond_type:
                    continue
                for attr in _AFFIX_ID_ATTRS:
                    raw_val = condition.get(attr) or condition.get(attr.capitalize())
                    if raw_val is not None:
                        try:
                            strictness_affixes[canonical].add(int(raw_val))
                        except ValueError:
                            pass
                        break

        # Also scan for numeric IDs in text content of condition elements
        for element in root.iter():
            if element.text and re.match(r"^\d+$", element.text.strip()):
                # Don't know the strictness context here — add to relaxed as floor
                try:
                    strictness_affixes["relaxed"].add(int(element.text.strip()))
                except ValueError:
                    pass

        # ── Map strictness → all phases (filters don't separate phases) ───────
        # Filter data doesn't distinguish phases — apply to all phases uniformly.
        phases: dict[str, dict] = {}
        for phase_name in VALID_PHASES:
            phases[phase_name] = {
                "strictness_affixes": {
                    level: sorted(ids)
                    for level, ids in strictness_affixes.items()
                }
            }

        # ── Covered masteries ─────────────────────────────────────────────────
        covered_masteries_raw = root.get("covered_masteries") or root.get("masteries") or ""
        if covered_masteries_raw:
            covered_masteries = [m.strip() for m in covered_masteries_raw.split(",") if m.strip()]
        elif mastery:
            covered_masteries = [mastery]
        else:
            covered_masteries = []

        # ── Checksum ──────────────────────────────────────────────────────────
        checksum = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()

        metadata = {
            "source_file": file_path.name,
            "filter_version": root.get("version") or "",
        }

        return RawSource(
            source_id=f"filter:{file_path.stem}",
            source_type="filter",
            build_slug=str(build_slug),
            mastery=str(mastery),
            damage_type=str(damage_type),
            phases=phases,
            checksum=checksum,
            covered_masteries=covered_masteries,
            metadata=metadata,
        )
