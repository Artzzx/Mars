# Claude Code Task — Build the Knowledge Ingestion Pipeline

## What You Are Building

A Python data pipeline that transforms raw Last Epoch build data into a structured
`knowledge-base.json` file consumed by a TypeScript filter compiler at runtime.

This is a batch job. It never runs at runtime. It runs locally or in CI when
data is updated. Speed is not a concern. Correctness and graceful degradation are.

Read every file referenced in the "Read first" section before writing any code.
The architecture is fully specified — your job is implementation, not design.

---

## Read First — In This Order

1. `packages/knowledge-pipeline/ARCHITECTURE.md`
   Full design spec. Every class, every method, every design decision is documented here.
   Do not deviate from it without flagging the reason.

2. `packages/knowledge-pipeline/UML.mermaid`
   Visual class diagram. Use this to understand relationships between classes
   before writing any of them.

3. `packages/filter-compiler/src/knowledge/game/classes.ts`
   The class hierarchy you must mirror in Python for inheritance resolution.

4. `packages/filter-compiler/src/knowledge/game/damage-types.ts`
   Damage type → affix ID mappings. The Python pipeline loads these as JSON
   (there is a serialization script — see Output section below).

5. `packages/filter-compiler/src/knowledge/game/threshold-affixes.ts`
   Affixes that must be skipped during weight extraction. The extractor must
   consult this list before processing any affix.

6. `packages/filter-compiler/src/knowledge/game/affix-overrides.ts`
   Manual classification overrides for ambiguous affixes.

7. `packages/filter-compiler/src/knowledge/game/affix-graph.ts`
   SYNERGY and PREREQUISITE edges for graph propagation.

8. `data/mappings/affixes.json`
   Ground truth for all game affixes. ~946 entries. The AffixResolver
   loads this on startup. Study the schema before writing the loader.

9. `data/sources/planners/`
   Sample planner export JSON files. Study at least one before writing
   the PlannerIngester — understand the actual data shape before coding.

10. `data/sources/filters/`
    Sample community filter XML files. Study at least one before writing
    the FilterIngester.

---

## Repo Structure to Create

```
packages/knowledge-pipeline/
  __init__.py
  pipeline.py              ← IngestionPipeline orchestrator + CLI entry point
  config.py                ← PipelineConfig dataclass + constants

  domain/
    __init__.py
    models.py              ← All dataclasses: RawSource, ExtractedWeight,
                             ConsensusWeight, BuildKnowledgeProfile,
                             SourceQualityScore, AffixDefinition

  graph/
    __init__.py
    affix_graph.py         ← AffixRelationshipGraph, AffixNode, AffixEdge
                             Loads edge data from affix-graph.ts JSON export

  inheritance/
    __init__.py
    nodes.py               ← InheritanceNode (abstract) + all 5 subclasses:
                             UniversalBaseline, DamageTypeProfile,
                             ClassProfile, MasteryProfile, BuildOverride
    resolver.py            ← InheritanceResolver — walks the 5-layer chain

  ingestion/
    __init__.py
    base.py                ← SourceIngester (abstract) + SourceScope enum
    planner.py             ← PlannerIngester
    filter_ingester.py     ← FilterIngester

  validation/
    __init__.py
    validator.py           ← SourceValidator — hard rejection + soft scoring

  extraction/
    __init__.py
    resolver.py            ← AffixResolver — fuzzy name→ID matching
    base.py                ← WeightExtractor (abstract)
    planner.py             ← PlannerWeightExtractor
    filter_extractor.py    ← FilterWeightExtractor

  consensus/
    __init__.py
    engine.py              ← ConsensusEngine

  output/
    __init__.py
    writer.py              ← KnowledgeBaseWriter

  scripts/
    export_ts_constants.py ← Serializes TS game constants to JSON for Python use
                             (one-time helper, not part of pipeline run)
```

---

## The TypeScript Constants Problem

The game knowledge lives in TypeScript files. Python cannot import TypeScript.

Before the pipeline can run, the TypeScript constants must be serialized to JSON.
Build `scripts/export_ts_constants.py` as the very first script. It reads the
`.ts` files (they are structured enough to parse with regex + string extraction,
or you can use `node -e` to evaluate and stdout the JSON) and writes:

```
data/mappings/game-constants.json
```

With this shape:
```json
{
  "class_hierarchy": { ... },      // from classes.ts
  "damage_type_profiles": { ... }, // from damage-types.ts
  "threshold_affix_ids": [...],    // Set of IDs from threshold-affixes.ts
  "affix_overrides": [...],        // from affix-overrides.ts
  "affix_edges": [...]             // from affix-graph.ts
}
```

All pipeline modules load from `data/mappings/game-constants.json` at startup.
This file is gitignored (it is generated) but reproducible with one command.

---

## Critical Implementation Rules

### Graceful degradation — non-negotiable
Every build is processed in a try/except. A single failed build NEVER crashes
the pipeline. Log failures to `PipelineReport.builds_failed` and continue.

```python
for build_slug, sources in builds.items():
    try:
        profile = self.process_build(build_slug, sources)
        results[build_slug] = profile
    except Exception as e:
        logger.error(f"[FAIL] {build_slug}: {e}")
        report.builds_failed.append({"build": build_slug, "reason": str(e)})
```

### Hard rejection rules — SourceValidator
Discard sources that fail ANY of these. Do not partially process them:
- Fewer than 15 unique affix IDs present
- Contains affix IDs not found in `data/mappings/affixes.json`
- No phase differentiation in the data
- Detected as a copy of another already-processed source (checksum match)

Multi-mastery sources are NOT rejected. They receive a `SourceScope` enum tag
and their specificity score = 1 / len(covered_masteries). See architecture doc.

### Weight extraction — two sources, two jobs
These are NOT interchangeable:
- **PlannerWeightExtractor** → derives `weight` and `min_tier`
- **FilterWeightExtractor** → derives `category` calibration and rule structure signals

Planner tier → weight mapping:
```
Tier 7   → 90–100  (essential)
Tier 5–6 → 65–85   (strong)
Tier 3–4 → 40–60   (useful)
Tier 1–2 → 15–35   (filler)
```

Asymmetric phase persistence multiplier (apply AFTER tier translation):
```
BiS/Aspirational only → × 1.0  (ceiling value, don't penalise rarity)
Starter only          → × 0.8  (phases out early)
All phases present    → × 1.0
Middle phases only    → × 0.85
```

### Threshold affixes — always skip
Before extracting any weight, check `ThresholdAffixRegistry.is_threshold(affix_id)`.
If true, skip entirely. These affixes are handled by the compiler directly.
Never assign weights to resistance affixes, endurance threshold, or any other
ID in `threshold-affixes.ts`.

### Consensus merging
Weighted average where source quality = weight:
```python
final_weight = sum(w * q for w, q in zip(weights, qualities)) / sum(qualities)
```

Sources with overall quality < 0.4 are supplementary — they influence but
cannot establish consensus alone. Require MIN_SOURCES_FOR_OVERRIDE = 3
before applying data-backed overrides on inheritance baseline.

### Inheritance resolution order
Always walk this chain, bottom to top, merging deltas at each layer:
```
0. UniversalBaseline         (health, endurance — always the floor)
1. DamageTypeProfile         (primary + synergy affixes for damage type)
2. ClassProfile              (class-specific modifiers)
3. MasteryProfile            (mastery signature affixes)
4. BuildOverride             (data-backed overrides, if available)
5. Graph propagation pass    (SYNERGY boosts, PREREQUISITE zeroing)
```

If BuildOverride doesn't exist (no data for this build), stop at layer 3.
The output is still a complete, usable profile. Never return empty.

### Graph propagation
After merging all inheritance layers, run one propagation pass:
1. For each affix with weight > 60, traverse SYNERGY edges and boost
   connected affixes: `connected_weight += edge.strength * 15`
2. For each affix, evaluate PREREQUISITE conditions against build context.
   If condition fails, set weight to 0.

The graph is additive. It never replaces data-backed weights, only enriches them.

---

## Output Contract

Write to `data/weights/knowledge-base.json`. This exact schema — the compiler
depends on it and will break if field names change:

```json
{
  "version": "1.0.0",
  "generated_at": "2026-02-25T00:00:00Z",
  "patch_version": "1.3.5",
  "builds": {
    "avalanche_shaman": {
      "mastery": "shaman",
      "damage_type": "cold",
      "specificity_score": 0.87,
      "source_count": 4,
      "confidence": "high",
      "data_source_layer": "specific",
      "phases": {
        "starter": {
          "affixes": [
            {
              "id": 16,
              "weight": 88.0,
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

Also write `data/weights/knowledge-base.meta.json`:
```json
{
  "generated_at": "...",
  "patch_version": "...",
  "build_count": 12,
  "checksum": "sha256 of knowledge-base.json"
}
```

---

## CLI Interface

```bash
# Run full pipeline on all builds found in data/sources/
python -m packages.knowledge_pipeline.pipeline

# Run on a single build only
python -m packages.knowledge_pipeline.pipeline --only avalanche_shaman

# Dry run — validate sources and print report, write nothing
python -m packages.knowledge_pipeline.pipeline --dry-run

# Force rebuild even if output already exists
python -m packages.knowledge_pipeline.pipeline --force
```

---

## Dependencies

Use these and only these external libraries. Add them to `pyproject.toml`:

```
rapidfuzz     ← fuzzy affix name matching in AffixResolver
pandas        ← data aggregation in ConsensusEngine
networkx      ← graph structure in AffixRelationshipGraph
```

Standard library only beyond these three. No requests, no playwright, no DB.

---

## Pipeline Report

After every run, print a structured summary to stdout AND write it to
`data/weights/pipeline-report.json`:

```
════════════════════════════════════════
  Knowledge Pipeline — Run Report
════════════════════════════════════════
  Builds processed : 12
  Builds failed    : 1  ← list them
  Sources accepted : 38
  Sources rejected : 4  ← list with reason
  Low confidence   : 3  ← builds needing more data
  Duration         : 4.2s
════════════════════════════════════════
```

Low confidence = builds where specificity_score < 0.5 or source_count < 3.
These are flagged for human review, not errors.

---

## What NOT to Do

- Do not modify any file in `packages/filter-compiler/`
- Do not modify any file in `data/mappings/` (read-only inputs)
- Do not connect to any database
- Do not make any network requests
- Do not use parallel processing — sequential only, one build at a time
- Do not write any output until the full pipeline completes successfully
  (write atomically — temp file then rename)
- Do not silently swallow errors — log everything that goes wrong
- Do not hardcode any affix IDs — always load from mappings files
- Do not trust source data — validate everything before using it

---

## Definition of Done

The task is complete when:

1. `python -m packages.knowledge_pipeline.pipeline --dry-run` runs without
   error and prints a valid report

2. `python -m packages.knowledge_pipeline.pipeline` on the sample data in
   `data/sources/` produces a valid `knowledge-base.json` that matches
   the output schema exactly

3. `knowledge-base.json` contains at least one build with:
   - All three phases present (even if empty arrays)
   - At least one affix with weight > 0 in at least one phase
   - `specificity_score` between 0 and 1
   - `data_source_layer` set to a valid value

4. Running the pipeline twice on the same input produces identical output
   (determinism check)

5. Deliberately corrupting one source file in `data/sources/` does NOT
   crash the pipeline — it produces a warning in the report and continues
