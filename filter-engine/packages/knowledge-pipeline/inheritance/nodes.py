"""
nodes.py
All InheritanceNode subclasses representing the 5-layer inheritance chain.

Resolution order (bottom to top):
  0. UniversalBaseline  — health, endurance floor — always present
  1. DamageTypeProfile  — primary + synergy affixes for the build's damage type
  2. ClassProfile       — class-specific modifiers
  3. MasteryProfile     — mastery signature affixes
  4. BuildOverride      — machine-generated from scraped data (optional)

After all layers: graph propagation pass (done in InheritanceResolver).
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

# Weight assigned to "primary" damage affixes from the damage type profile
_PRIMARY_AFFIX_WEIGHT = 75.0
_SYNERGY_AFFIX_WEIGHT = 55.0

# Weight boost applied to mastery signature affixes on top of existing weight
_MASTERY_SIGNATURE_BOOST = 10.0
_MASTERY_SIGNATURE_BASE = 60.0


class InheritanceNode(ABC):
    """Abstract base for all inheritance layers."""

    @abstractmethod
    def resolve(self) -> dict[int, float]:
        """Return a complete weight dict for this layer (affix_id → weight)."""
        ...

    def merge_into(self, weights: dict[int, float]) -> dict[int, float]:
        """
        Merge this layer's weights into an existing dict.
        Layer weights override lower-layer values when higher.
        Returns a new dict; does not mutate the input.
        """
        result = dict(weights)
        for affix_id, weight in self.resolve().items():
            existing = result.get(affix_id, 0.0)
            result[affix_id] = max(existing, weight)
        return result


# ─────────────────────────────────────────────────────────────────────────────
# Layer 0: Universal Baseline
# ─────────────────────────────────────────────────────────────────────────────

class UniversalBaseline(InheritanceNode):
    """
    The floor for every build. Affixes that are universally desirable.

    Resistances are handled by ThresholdAffixRegistry — they are NOT in this
    layer. The baseline covers health, vitality, and movement speed only.

    Weights here are resolved by name via the AffixResolver at resolve() time.
    The name_to_id map is provided by InheritanceResolver.
    """

    def __init__(self, name_to_id: dict[str, int], baseline_weights: dict[str, float]) -> None:
        self._name_to_id = name_to_id
        self._baseline_weights = baseline_weights

    def resolve(self) -> dict[int, float]:
        result: dict[int, float] = {}
        for name_key, weight in self._baseline_weights.items():
            # name_key is a snake_case lookup key like "added_health"
            # We look up the canonical affix ID at resolve time
            affix_id = self._name_to_id.get(name_key)
            if affix_id is not None:
                result[affix_id] = weight
            else:
                logger.debug("UniversalBaseline: no ID found for name key %r", name_key)
        return result


# ─────────────────────────────────────────────────────────────────────────────
# Layer 1: Damage Type Profile
# ─────────────────────────────────────────────────────────────────────────────

class DamageTypeProfile(InheritanceNode):
    """
    Affix weights for a specific damage type.
    Primary affixes get _PRIMARY_AFFIX_WEIGHT; synergy affixes get _SYNERGY_AFFIX_WEIGHT.
    """

    def __init__(self, damage_type: str, profile: dict) -> None:
        self._damage_type = damage_type
        self._primary_ids: list[int] = profile.get("primaryAffixIds", [])
        self._synergy_ids: list[int] = profile.get("synergyAffixIds", [])

    def resolve(self) -> dict[int, float]:
        result: dict[int, float] = {}
        for affix_id in self._primary_ids:
            result[affix_id] = _PRIMARY_AFFIX_WEIGHT
        for affix_id in self._synergy_ids:
            # Don't overwrite a primary with a lower synergy weight
            if affix_id not in result:
                result[affix_id] = _SYNERGY_AFFIX_WEIGHT
        return result


# ─────────────────────────────────────────────────────────────────────────────
# Layer 2: Class Profile
# ─────────────────────────────────────────────────────────────────────────────

class ClassProfile(InheritanceNode):
    """
    Class-specific modifiers. Classes have exclusive item affinities, so their
    profiles primarily adjust which affixes are relevant by slot.

    For now the class layer adds a modest weight for class-exclusive affixes.
    The primary job of this layer is slot-relevance, not weight magnitude.
    """

    def __init__(self, base_class: str, class_def: dict) -> None:
        self._base_class = base_class
        self._class_def = class_def

    def resolve(self) -> dict[int, float]:
        # Class profile currently contributes no explicit affix weights —
        # class relevance is handled via AffixDefinition.is_class_gated.
        # This layer is reserved for future class-specific weight adjustments.
        return {}


# ─────────────────────────────────────────────────────────────────────────────
# Layer 3: Mastery Profile
# ─────────────────────────────────────────────────────────────────────────────

class MasteryProfile(InheritanceNode):
    """
    Mastery signature affixes — the affixes that define the mastery's playstyle.

    These are derived from the damage type's primary affixes intersection with
    the mastery's class exclusives, plus any mastery-specific overrides.

    In the absence of a separate mastery affix registry, this layer boosts
    affixes that are already in the damage type profile to signal their
    heightened importance for this specific mastery.
    """

    def __init__(self, mastery: str, primary_affix_ids: list[int]) -> None:
        self._mastery = mastery
        self._primary_ids = primary_affix_ids

    def resolve(self) -> dict[int, float]:
        # Mastery profile boosts primary damage affixes by the signature amount.
        # The InheritanceResolver will merge this on top of DamageTypeProfile,
        # so the effective weight = max(DamageType weight, Mastery weight).
        result: dict[int, float] = {}
        for affix_id in self._primary_ids:
            result[affix_id] = _PRIMARY_AFFIX_WEIGHT + _MASTERY_SIGNATURE_BOOST
        return result


# ─────────────────────────────────────────────────────────────────────────────
# Layer 4: Build Override
# ─────────────────────────────────────────────────────────────────────────────

class BuildOverride(InheritanceNode):
    """
    Machine-generated overrides from the ConsensusEngine.

    If no data exists for this build, this layer is omitted entirely and the
    pipeline still produces a valid (inheritance-only) profile.
    """

    def __init__(self, consensus_weights: dict[int, float]) -> None:
        self._consensus_weights = consensus_weights

    def resolve(self) -> dict[int, float]:
        return dict(self._consensus_weights)
