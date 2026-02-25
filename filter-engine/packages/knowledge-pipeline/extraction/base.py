"""
extraction/base.py
WeightExtractor abstract base class.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from ..domain.models import ExtractedWeight, RawSource
from .resolver import AffixResolver


class WeightExtractor(ABC):
    """
    Abstract base for weight extractors.

    PlannerWeightExtractor → derives weight and min_tier
    FilterWeightExtractor  → derives category calibration and rule structure signals

    These are NOT interchangeable. Both run on their respective source types.
    """

    @abstractmethod
    def extract(self, source: RawSource, resolver: AffixResolver) -> list[ExtractedWeight]:
        """
        Extract weights from a validated RawSource.

        Threshold affixes are always skipped (checked via resolver.is_threshold).
        Returns a list of ExtractedWeight instances, one per (affix_id, phase).
        """
        ...
