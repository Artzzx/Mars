# Knowledge Ingestion Pipeline — Architecture Document

## Overview

This pipeline transforms raw, heterogeneous build data (Maxroll planner exports, community filter XML) into a versioned, structured knowledge base that the filter compiler consumes at runtime. It runs offline as a batch job — never on user request.

**Language:** Python  
**Output:** `data/weights/knowledge-base.json`  
**Trigger:** Manual run or CI schedule on patch/data update

---

## Design Principles

1. **Every stage has one job.** No class reads data and also scores it.
2. **The compiler never sees raw data.** Only the final JSON output crosses the boundary.
3. **Bad data degrades gracefully.** It doesn't crash the pipeline or corrupt good builds.
4. **The graph is additive.** Graph propagation enriches weights — it never replaces them.
5. **Inheritance is the floor.** Scraped data is always an override on top of game mechanics knowledge, never a replacement.

---

## Layer 1 — Domain Models

These are pure data classes with no logic. They define the shape of data as it flows through the pipeline.

### `AffixDefinition`
The ground truth for every affix in the game. Loaded once from `data/mappings/affixes.json` at pipeline startup. Every other class references this, never raw affix names.

Key fields:
- `valid_slots` — which gear slots this affix can roll on. Used in relevance filtering.
- `is_class_gated` — hard constraint that overrides any weight.
- `damage_type` — populated via a **hybrid strategy**: programmatic name-matching first (any affix containing "cold", "fire", "lightning", "void", "physical", "necrotic", "poison" in its name is classified automatically), then a manual override list (`AffixClassificationOverride`) covering ~30–50 ambiguous cases — stat scaling affixes, penetration variants, crit multipliers — that have damage-type relevance but aren't obvious from name alone. Default is `unclassified`, meaning relevant to all builds. Unclassified is the safe default: better to show an affix that wasn't needed than to hide one that was.
- `is_damage_locked` — **derived field**, not stored. Returns `True` only when `damage_type` is explicitly set via the hybrid strategy above. Nothing is inferred as locked unless explicitly classified.

The override list lives in `src/knowledge/game/affix-overrides.ts` alongside other game constants. It is authored once and maintained manually across patches.

### `RawSource`
A single ingested source before any processing. Stored in memory only — never persisted. Contains both the raw data and metadata about where it came from and what it targets.

### `SourceQualityScore`
The output of the validator for a single source. The `overall` float (0–1) determines how much weight this source gets in consensus averaging. Sources below 0.4 overall are supplementary only.

### `ExtractedWeight`
A single affix weight inferred from a single source. Includes `derivation_method` (was this from tier translation or strictness survival?) so the consensus engine can weight these differently.

### `ConsensusWeight`
The merged result across multiple sources for a single affix. `consensus_spread` measures disagreement — high spread means sources conflict, which reduces confidence.

### `BuildKnowledgeProfile`
The final output per build. Phases are the top-level grouping because the compiler resolves by phase first. Each phase contains its own ranked affix list.

---

## Layer 2 — The Affix Relationship Graph

### Why a Graph

Affixes don't exist in isolation. Cold damage and cold penetration are synergistic — a filter that includes one should be biased toward including the other. Armor shred has an implicit prerequisite of melee attack type. A flat list of weights can't express these relationships. A graph can.

**Note on CONFLICT edges:** These were removed. Last Epoch's item system prevents the same affix from rolling twice on a single item by game rules, making explicit conflict modeling redundant. The graph is simplified to two edge types only.

### `AffixRelationshipGraph`

Nodes are `AffixNode` instances. Edges are `AffixEdge` with two types:

- `SYNERGY` — if affix A is high priority, affix B should get a proportional weight boost.
- `PREREQUISITE` — affix A only makes sense if a build condition is met (e.g., armor shred requires melee). If the prerequisite is unmet, the affix weight is zeroed regardless of data.

**`propagate_weights(weights_dict) → weights_dict`**

After consensus weights are derived from sources, the graph runs one propagation pass:

1. For each high-weight affix (weight > 60), traverse SYNERGY edges and apply a proportional boost to connected affixes.
2. For each affix, check PREREQUISITE edges — if the build context doesn't satisfy the prerequisite, zero the weight.

The graph is defined as TypeScript game knowledge constants and serialized to JSON for Python to load. It is never learned from data.

---

## New Concept: ThresholdAffix

A `ThresholdAffix` represents affixes that every build needs until a game-defined cap is reached, regardless of build archetype. Resistances (cap: 75%) are the canonical example. Endurance threshold is another.

```python
class ThresholdAffix:
    affix_id: int
    cap: int                  # 75 for resistances
    priority: str             # always 'essential' until capped
    show_min_tier: int        # minimum tier worth showing
    user_controllable: bool   # can the user toggle this off
    applies_to_phases: str    # all phases unless specified
```

**These bypass the weight system entirely.** The compiler treats them as a separate always-on rule category — ordered above build-specific affixes, included regardless of strictness, and toggleable by the user via a UI flag ("My resistances are capped"). The knowledge pipeline never assigns weights to threshold affixes. The extractor skips them explicitly via `ThresholdAffixRegistry.is_threshold()`. Threshold affixes are defined in TypeScript game constants, not derived from data.

---

## Layer 3 — Inheritance Hierarchy

**Layer 1 — Universal Baseline**

Every filter ever generated starts here. These weights are true for all builds in all phases. Includes universal defensive affixes — health, endurance, movement speed. Note that resistances are **not** in this layer — they are handled by `ThresholdAffixRegistry` and bypass the weight system.

**Layer 2 — Damage Type Profile**

Each damage type brings its own affix relevance — `primary_affixes` and `synergy_affixes`. No anti-affixes list; damage-type irrelevance is handled by the `is_damage_locked` field on `AffixDefinition` itself, not the profile.

```
UniversalBaseline        ← hand-authored, never changes
DamageTypeProfile        ← one per damage type, hand-authored
ClassProfile             ← one per base class, hand-authored  
MasteryProfile           ← one per mastery, hand-authored
BuildOverride            ← machine-generated from scraped data
```

### Resolution

`InheritanceResolver.resolve(mastery, damage_type, build_slug)` walks the chain bottom-up:

1. Start with `UniversalBaseline.resolve()` — the full baseline weight dict.
2. Apply `DamageTypeProfile.merge_into()` — modifies weights for the relevant damage type.
3. Apply `ClassProfile.merge_into()` — class-specific modifiers.
4. Apply `MasteryProfile.merge_into()` — mastery signature affixes added.
5. Apply `BuildOverride.merge_into()` — data-backed overrides, if available.
6. Apply `AffixRelationshipGraph.propagate_weights()` — graph enrichment pass.

If no `BuildOverride` exists (new build, no data yet), steps 1–4 still produce a complete profile. The compiler gets a valid output at every level of data availability.

### The `specificity_score` field

Surfaces to the compiler which layer the profile was resolved from:

- `1.0` — full build-specific data
- `0.7` — mastery-level resolution
- `0.4` — class-level resolution
- `0.2` — damage type only
- `0.0` — universal baseline only

The compiler can expose this to users as filter confidence.

---

## Layer 4 — Source Ingestion

### `SourceIngester` (abstract)

Defines the contract for reading a raw source. Two implementations:

**`PlannerIngester`** — reads Maxroll planner export JSON. The export provides tier values (1–7) per affix per item slot, phase-stratified. This is the highest-quality input because it's explicit and structured.

**`FilterIngester`** — reads Last Epoch filter XML. Extracts affix conditions per rule block, grouped by strictness level. More work to interpret but provides behavioral ground truth.

Both produce a `RawSource` with normalized metadata and raw data dict.

---

## Layer 5 — Validation

### `SourceValidator`

The quality gate. Every source passes through before any weight extraction.

**Hard rejection rules (any one triggers full discard):**

| Rule | Rationale |
|---|---|
| Fewer than 15 unique affixes | Too sparse to teach anything meaningful |
| Contains affix IDs not in mapping | Corrupted or outdated patch data |
| No phase differentiation | Can't derive progression signals |
| Detected as copy of existing source | False consensus |

**Multi-mastery sources are NOT hard rejected.** A filter covering multiple masteries or classes is valid data — it represents a different user intent (alt characters, transitions). Instead, it receives a `SourceScope` tag and `compute_scope_dilution()` reduces its specificity proportionally: `specificity = 1 / len(covered_masteries)`. A source covering three masteries contributes one-third as much to each as a single-mastery source. At compile time, multi-mastery sources become *more* relevant when the user requests a filter spanning multiple classes.

**Soft scoring (0–1 per dimension):**

- `specificity` — derived from `SourceScope`, how narrow is the intended build target?
- `affix_coverage` — what fraction of expected affixes for this class are present?
- `phase_coverage` — how many game phases are represented?
- `recency` — how many patches ago was this data valid?
- `consensus_alignment` — computed after other sources are processed; how much does this agree?

Overall score = weighted average. Sources below 0.4 get supplementary status — they can reinforce consensus but cannot establish it alone.

---

## Layer 6 — Weight Extraction

### `AffixResolver`

Before any weight can be extracted, affix names from source data must map to canonical `AffixDefinition` IDs. Source data uses display names that may differ from the mapping file.

Uses `rapidfuzz` for fuzzy string matching with an 0.85 threshold. Below that, the affix is logged as unresolved and skipped. Unresolved affix counts penalize `affix_coverage` in the quality score.

### `PlannerWeightExtractor`

Tier-to-weight translation:

```
Tier 7   → 90–100, essential
Tier 5–6 → 65–85,  strong
Tier 3–4 → 40–60,  useful
Tier 1–2 → 15–35,  filler
```

**Planner data is the primary source for `weight` and `min_tier`. It is NOT used for category boundary calibration** — that's filter data's job.

**Asymmetric phase persistence multiplier** applied after tier translation. Direction of rarity matters:

```
Appears only in Starter  → × 0.8  (phases out, lower long-term importance)
Appears only in BiS      → × 1.0  (ceiling value — high importance, rare drop)
Appears in all phases    → × 1.0  (universally important)
Appears in middle only   → × 0.85
```

BiS-only affixes are not penalized for rarity. An affix present only at the top of optimization represents something worth tracking down, not something to ignore.

### `FilterWeightExtractor`

Strictness survival → category boundary calibration:

```
Survives Uber Strict   → essential
Survives Very Strict   → strong
Survives Strict        → useful
Relaxed only           → filler
```

**Filter data informs category calibration and rule structure signals, not absolute weights.** The `extract_rule_structure_signals()` method captures patterns in how experienced filter authors structure rules — grouping decisions, condition ordering, slot-specific thresholds — that inform the compiler's rule generation patterns. This is behavioral knowledge that planner data cannot provide.

---

## Layer 7 — Consensus Engine

### `ConsensusEngine.merge()`

Takes all `ExtractedWeight` instances for a single affix across all accepted sources for a build, plus their quality scores.

**Weighted average:**
```
final_weight = Σ(weight_i × quality_i) / Σ(quality_i)
```

Sources with higher quality scores contribute proportionally more to the final weight.

**Outlier detection:** Weights more than 2 standard deviations from the mean are flagged. If an outlier comes from a low-quality source, it's excluded. If it comes from a high-quality source, it's kept but raises the `consensus_spread`, which lowers confidence.

**Low confidence clamping:** If `overall` confidence is below threshold and source count is below `MIN_SOURCES_FOR_OVERRIDE`, the consensus weight is clamped toward the inherited baseline weight rather than replacing it. This prevents sparse data from producing wild overrides.

---

## Layer 8 — Pipeline Orchestrator

### `IngestionPipeline.process_build()`

The per-build processing sequence:

```
1. Load all RawSources for this build slug
2. Validate each → SourceQualityScore
3. Discard hard-rejected sources
4. Extract weights from accepted sources → List[ExtractedWeight]
5. Merge via ConsensusEngine → List[ConsensusWeight]
6. Resolve inheritance hierarchy → base Dict[int, AffixWeight]
7. Apply ConsensusWeights as overrides on inheritance result
8. Run graph propagation pass
9. Package into BuildKnowledgeProfile
10. Record specificity score and data source layer
```

### `PipelineReport`

Every run produces a full report:
- Which builds succeeded and at what confidence level
- Which sources were rejected and why
- Which affixes had high consensus spread (potential data conflicts)
- Low-confidence builds that may need manual review

This report is the human review surface. The pipeline flags problems — a human decides whether to act.

---

## Output Schema

```json
{
  "version": "semver matching patch version",
  "generated_at": "ISO 8601",
  "patch_version": "game patch this was built against",
  "builds": {
    "avalanche_shaman": {
      "mastery": "shaman",
      "damage_types": ["cold"],
      "archetype": "avalanche_shaman",
      "specificity_score": 0.87,
      "source_count": 9,
      "confidence": "high",
      "data_source_layer": "specific",
      "phases": {
        "starter": {
          "affixes": [
            {
              "id": 1042,
              "weight": 88,
              "category": "essential",
              "min_tier": 4,
              "consensus_spread": 0.06,
              "confidence": 0.91
            }
          ]
        },
        "endgame": { "affixes": [] },
        "aspirational": { "affixes": [] }
      }
    }
  }
}
```

---

## File Structure

```
scripts/
  pipeline/
    __init__.py
    pipeline.py              ← IngestionPipeline orchestrator
    config.py                ← PipelineConfig, constants
    
    domain/
      models.py              ← All domain dataclasses
      
    graph/
      affix_graph.py         ← AffixRelationshipGraph, Node, Edge (SYNERGY + PREREQUISITE only)
      
    inheritance/
      nodes.py               ← All InheritanceNode subclasses
      resolver.py            ← InheritanceResolver
      
    ingestion/
      base.py                ← SourceIngester abstract + SourceScope enum
      planner.py             ← PlannerIngester
      filter_ingester.py     ← FilterIngester
      
    validation/
      validator.py           ← SourceValidator, hard rejection, scope dilution scoring
      
    extraction/
      resolver.py            ← AffixResolver (fuzzy matching + override application)
      base.py                ← WeightExtractor abstract
      planner.py             ← PlannerWeightExtractor (asymmetric phase multipliers)
      filter_extractor.py    ← FilterWeightExtractor (category calibration + rule structure signals)
      
    consensus/
      engine.py              ← ConsensusEngine
      
    output/
      writer.py              ← KnowledgeBaseWriter

data/
  weights/
    knowledge-base.json      ← pipeline output, read by TypeScript compiler
    knowledge-base.meta.json ← checksums, generation metadata

src/
  knowledge/
    game/
      classes.ts             ← CLASS_HIERARCHY constant
      damage-types.ts        ← DAMAGE_TYPE_PROFILES constant (primary + synergy only, no anti)
      affix-taxonomy.ts      ← AFFIX_CATEGORIES constant
      affix-graph.ts         ← AFFIX_RELATIONSHIPS constant (SYNERGY + PREREQUISITE edges)
      affix-overrides.ts     ← AffixClassificationOverride list (~30-50 manual entries)
      threshold-affixes.ts   ← ThresholdAffixRegistry (resistances, endurance etc.)
```

## Summary: What Changed from Initial Design

| Area | Change |
|---|---|
| `AffixDefinition.damage_type` | Hybrid population: programmatic name-match + manual override list |
| `AffixDefinition.is_damage_locked` | Derived field, returns `damage_type is not None`. Conservative default. |
| `AffixClassificationOverride` | New class, ~30–50 hand-authored entries for ambiguous affixes |
| Graph CONFLICT edges | Removed entirely. Graph is SYNERGY + PREREQUISITE only. |
| `ThresholdAffix` + `ThresholdAffixRegistry` | New concept. Resistance/endurance bypass weight system, user-toggleable. |
| `DamageTypeProfile.anti_affixes` | Removed. Irrelevance handled by `is_damage_locked` on `AffixDefinition`. |
| Layer 4 extraction | Planner → weight + min_tier. Filter → category calibration + rule structure signals. |
| `SourceScope` enum | Replaces hard rejection for multi-mastery sources. Proportional dilution instead. |
| Phase persistence multiplier | Asymmetric — BiS-only = full weight, Starter-only = penalized. |
| Rare affix floor | Compiler-level safety net (not knowledge layer). High base-rarity items shown regardless of affix composition. |

---

## The Boundary Rule

Python writes to `data/weights/`. TypeScript reads from `data/weights/`. Nothing crosses in the other direction. The JSON schema is the only contract both sides must honor.
