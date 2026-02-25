"""
base.py
SourceIngester abstract base class and SourceScope enum.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum
from pathlib import Path

from ..domain.models import RawSource


class SourceScope(Enum):
    """How narrow is the build target of this source?"""
    SPECIFIC = "specific"          # single mastery
    MULTI_MASTERY = "multi_mastery"
    MULTI_CLASS = "multi_class"
    UNIVERSAL = "universal"


class SourceIngester(ABC):
    """
    Abstract base for source ingesters.

    Each ingester reads one file and produces a RawSource.
    It has exactly one job: read and normalize. No validation, no weight extraction.
    """

    @abstractmethod
    def ingest(self, file_path: Path) -> RawSource:
        """
        Read the file at file_path and return a normalized RawSource.

        Raises:
            ValueError: if the file cannot be parsed or is missing required fields.
        """
        ...

    @staticmethod
    def _determine_scope(covered_masteries: list[str]) -> SourceScope:
        if len(covered_masteries) == 1:
            return SourceScope.SPECIFIC
        if len(covered_masteries) <= 3:
            return SourceScope.MULTI_MASTERY
        if len(covered_masteries) <= 9:
            return SourceScope.MULTI_CLASS
        return SourceScope.UNIVERSAL
