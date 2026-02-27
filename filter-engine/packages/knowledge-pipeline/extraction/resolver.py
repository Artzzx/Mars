"""
extraction/resolver.py
AffixResolver — maps affix names from source data to canonical AffixDefinition IDs.

Uses:
  1. Exact match on all name variants (affixName, displayName, lootFilterOverrideName)
  2. rapidfuzz fuzzy matching at 0.85 threshold
  3. Hybrid damage-type classification: programmatic + manual override list

Also provides is_threshold() for skipping threshold affixes.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from rapidfuzz import process as fuzz_process
from rapidfuzz.fuzz import WRatio

from ..domain.models import AffixDefinition

logger = logging.getLogger(__name__)

# Damage type keywords for programmatic classification
_DAMAGE_KEYWORDS: dict[str, list[str]] = {
    "fire": ["fire", "ignite", "burn", "combustion"],
    "cold": ["cold", "freeze", "chill", "frost"],
    "lightning": ["lightning", "shock", "electrify", "thunder"],
    "void": ["void", "corruption"],
    "necrotic": ["necrotic", "decay"],
    "poison": ["poison", "venom", "toxic"],
    "physical": ["physical", "bleed", "armor shred"],
}


class AffixResolver:
    """
    Loads and indexes the affix mapping. Provides name→ID resolution and
    damage-type classification.
    """

    def __init__(
        self,
        affixes_file: Path,
        game_constants_file: Path,
        fuzzy_threshold: float = 0.85,
    ) -> None:
        self._threshold = fuzzy_threshold
        self._index: dict[int, AffixDefinition] = {}
        self._name_index: dict[str, int] = {}  # lower-case name → affix_id
        self._threshold_ids: set[int] = set()

        self._load_affixes(affixes_file)
        self._load_game_constants(game_constants_file)

        # Build fuzzy search corpus: list of (name, affix_id)
        self._corpus: list[str] = list(self._name_index.keys())
        logger.info(
            "AffixResolver loaded: %d affixes, %d name entries, %d threshold IDs",
            len(self._index), len(self._name_index), len(self._threshold_ids),
        )

    # ── Loading ───────────────────────────────────────────────────────────────

    def _load_affixes(self, affixes_file: Path) -> None:
        """Load and index MasterAffixesList.json (Unity serialized format)."""
        logger.debug("Loading affixes from %s", affixes_file)
        raw = json.loads(affixes_file.read_text(encoding="utf-8"))

        affix_list = raw.get("singleAffixes", []) + raw.get("multiAffixes", [])
        if not affix_list:
            raise RuntimeError(f"No 'singleAffixes' or 'multiAffixes' in {affixes_file}")

        for entry in affix_list:
            try:
                affix_id = int(entry["affixId"])
                name = str(entry.get("affixName", ""))
                display_name = str(entry.get("affixDisplayName", ""))
                loot_name = str(entry.get("affixLootFilterOverrideName", ""))
                can_roll_on = [int(x) for x in entry.get("canRollOn", [])]
                class_specificity = int(entry.get("classSpecificity", 0))

                affix_def = AffixDefinition(
                    affix_id=affix_id,
                    name=name,
                    display_name=display_name,
                    valid_slots=can_roll_on,
                    is_class_gated=class_specificity != 0,
                    damage_type=self._classify_damage_type(name),
                )
                self._index[affix_id] = affix_def

                # Index all name variants (lower-case, deduplicated)
                for variant in {name, display_name, loot_name}:
                    if variant:
                        self._name_index[variant.lower()] = affix_id

            except (KeyError, ValueError, TypeError) as exc:
                logger.debug("Skipping malformed affix entry: %s", exc)

    def _load_game_constants(self, constants_file: Path) -> None:
        """Load threshold affix IDs and apply manual classification overrides."""
        if not constants_file.exists():
            logger.warning(
                "game-constants.json not found at %s. "
                "Run scripts/export_ts_constants.py first.",
                constants_file,
            )
            return

        constants = json.loads(constants_file.read_text(encoding="utf-8"))

        # Threshold affix IDs
        self._threshold_ids = set(int(i) for i in constants.get("threshold_affix_ids", []))

        # Manual overrides: update damage_type on affected AffixDefinitions
        for override in constants.get("affix_overrides", []):
            affix_id = int(override.get("affixId", -1))
            if affix_id not in self._index:
                continue
            affix_def = self._index[affix_id]
            is_locked = bool(override.get("isDamageLocked", False))
            if not is_locked:
                # isDamageLocked=False means NOT damage-locked → unclassified
                self._index[affix_id] = AffixDefinition(
                    affix_id=affix_def.affix_id,
                    name=affix_def.name,
                    display_name=affix_def.display_name,
                    valid_slots=affix_def.valid_slots,
                    is_class_gated=affix_def.is_class_gated,
                    damage_type=None,  # unclassified — safe to show for all builds
                )

    # ── Classification ────────────────────────────────────────────────────────

    def _classify_damage_type(self, name: str) -> str | None:
        """Programmatic keyword-based damage type classification."""
        name_lower = name.lower()
        for damage_type, keywords in _DAMAGE_KEYWORDS.items():
            if any(kw in name_lower for kw in keywords):
                return damage_type
        return None  # unclassified = relevant to all builds

    # ── Resolution ────────────────────────────────────────────────────────────

    def resolve_id(self, affix_id: int) -> AffixDefinition | None:
        """Look up an affix by its numeric ID."""
        return self._index.get(affix_id)

    def resolve_name(self, name: str) -> AffixDefinition | None:
        """
        Resolve an affix name to its AffixDefinition.

        1. Exact match (case-insensitive)
        2. rapidfuzz fuzzy match at self._threshold
        Returns None if no match above threshold.
        """
        if not name:
            return None

        # Exact match
        exact = self._name_index.get(name.lower())
        if exact is not None:
            return self._index.get(exact)

        # Fuzzy match
        result = fuzz_process.extractOne(
            name.lower(),
            self._corpus,
            scorer=WRatio,
            score_cutoff=self._threshold * 100,
        )
        if result is not None:
            matched_name, score, _ = result
            affix_id = self._name_index[matched_name]
            logger.debug(
                "Fuzzy match: %r → %r (score=%.1f, id=%d)",
                name, matched_name, score, affix_id,
            )
            return self._index.get(affix_id)

        logger.debug("Unresolved affix name: %r (threshold=%.2f)", name, self._threshold)
        return None

    def is_threshold(self, affix_id: int) -> bool:
        """Return True if this affix is a threshold affix (should be skipped)."""
        return affix_id in self._threshold_ids

    @property
    def known_ids(self) -> set[int]:
        """All valid affix IDs in the mapping."""
        return set(self._index.keys())

    @property
    def index(self) -> dict[int, AffixDefinition]:
        """Full affix index keyed by ID."""
        return self._index
