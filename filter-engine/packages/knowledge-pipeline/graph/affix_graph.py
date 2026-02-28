"""
affix_graph.py
AffixRelationshipGraph — loads SYNERGY and PREREQUISITE edges from
game-constants.json and propagates weights after consensus merging.

Graph is ADDITIVE. It never replaces data-backed weights, only enriches them.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import networkx as nx

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Data classes
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class AffixNode:
    affix_id: int
    name: str = ""


@dataclass
class AffixEdge:
    from_id: int
    to_id: int
    type: str           # "SYNERGY" | "PREREQUISITE"
    strength: float
    condition: str | None


# ─────────────────────────────────────────────────────────────────────────────
# Condition evaluation
# ─────────────────────────────────────────────────────────────────────────────

def _evaluate_condition(condition: str | None, build_context: dict) -> bool:
    """
    Evaluate a PREREQUISITE condition string against the build context.

    Condition strings are simple predicates like:
      "attack_type == melee"
      "attack_type == bow"
      "uses_shield == true"
      "damage_type == physical"
      "uses_minions == true"
      "uses_ward == true"
      "uses_totems == true"
      "uses_channelling == true"

    When the build_context value for a key is a list (e.g. damage_types),
    the check becomes membership ("physical" in ["physical", "chaos"]) rather
    than scalar equality.  The condition key "damage_type" is automatically
    resolved to "damage_types" if the scalar key is absent.

    Returns True if the prerequisite IS met (affix should keep its weight).
    Returns False if the condition fails (affix weight should be zeroed).
    """
    if condition is None:
        return True

    condition = condition.strip()

    # Handle compound conditions with "&&"
    if "&&" in condition:
        return all(_evaluate_condition(c.strip(), build_context) for c in condition.split("&&"))

    # Handle compound conditions with "||"
    if "||" in condition:
        return any(_evaluate_condition(c.strip(), build_context) for c in condition.split("||"))

    # Parse: key == value
    if "==" in condition:
        parts = [p.strip() for p in condition.split("==", 1)]
        if len(parts) != 2:
            logger.warning("Unparseable prerequisite condition: %r", condition)
            return True  # conservative: don't zero if we can't evaluate
        key, expected = parts[0], parts[1]
        expected_lower = expected.lower()

        # Resolve "damage_type" to the list key "damage_types" when the scalar
        # key is absent from the context (build now stores a list).
        if key not in build_context and f"{key}s" in build_context:
            key = f"{key}s"

        actual = build_context.get(key)
        if isinstance(actual, list):
            return expected_lower in [str(v).lower() for v in actual]
        return str(actual if actual is not None else "").lower() == expected_lower

    # Unknown format — conservative: don't zero
    logger.warning("Unknown prerequisite condition format: %r", condition)
    return True


# ─────────────────────────────────────────────────────────────────────────────
# Graph
# ─────────────────────────────────────────────────────────────────────────────

class AffixRelationshipGraph:
    """
    Directed graph of affix relationships. Nodes are affix IDs.
    Edges are SYNERGY or PREREQUISITE typed.

    Built from affix_edges in game-constants.json, which is serialized from
    affix-graph.ts. The graph is static game knowledge — never learned from data.
    """

    def __init__(self, edges: list[dict]) -> None:
        self._graph: nx.DiGraph = nx.DiGraph()
        self._edges: list[AffixEdge] = []

        for raw in edges:
            try:
                edge = AffixEdge(
                    from_id=int(raw["from"]),
                    to_id=int(raw["to"]),
                    type=raw["type"],
                    strength=float(raw["strength"]),
                    condition=raw.get("condition"),
                )
                self._edges.append(edge)
                self._graph.add_edge(
                    edge.from_id,
                    edge.to_id,
                    type=edge.type,
                    strength=edge.strength,
                    condition=edge.condition,
                )
            except (KeyError, ValueError) as exc:
                logger.warning("Skipping malformed edge %r: %s", raw, exc)

        logger.debug(
            "AffixRelationshipGraph loaded: %d nodes, %d edges",
            self._graph.number_of_nodes(),
            self._graph.number_of_edges(),
        )

    def propagate_weights(
        self,
        weights: dict[int, float],
        build_context: dict,
        synergy_trigger: float = 60.0,
        synergy_boost_per_strength: float = 15.0,
    ) -> dict[int, float]:
        """
        Run one propagation pass over the weight dict.

        1. SYNERGY pass: for each affix with weight > synergy_trigger, traverse
           outgoing SYNERGY edges and add (edge.strength * boost_per_strength) to
           the connected affix's weight. Additive — never replaces existing weight.

        2. PREREQUISITE pass: for each affix, check outgoing PREREQUISITE edges.
           If the build_context does NOT satisfy the condition, zero the weight.

        Returns a new dict (does not mutate the input).
        """
        result = dict(weights)  # shallow copy — values are floats

        # Pass 1 — SYNERGY boosts
        for affix_id, weight in weights.items():
            if weight <= synergy_trigger:
                continue
            if not self._graph.has_node(affix_id):
                continue
            for _, neighbor, data in self._graph.out_edges(affix_id, data=True):
                if data.get("type") != "SYNERGY":
                    continue
                boost = data["strength"] * synergy_boost_per_strength
                current = result.get(neighbor, 0.0)
                result[neighbor] = min(100.0, current + boost)
                logger.debug(
                    "SYNERGY boost: %d → %d (+%.1f, strength=%.2f)",
                    affix_id, neighbor, boost, data["strength"],
                )

        # Pass 2 — PREREQUISITE zeroing
        for affix_id in list(result.keys()):
            if not self._graph.has_node(affix_id):
                continue
            for _, _, data in self._graph.out_edges(affix_id, data=True):
                if data.get("type") != "PREREQUISITE":
                    continue
                condition = data.get("condition")
                if not _evaluate_condition(condition, build_context):
                    logger.debug(
                        "PREREQUISITE unmet for affix %d (condition=%r) — zeroing",
                        affix_id, condition,
                    )
                    result[affix_id] = 0.0
                    break  # one failing PREREQUISITE is enough

        return result
