# Spec: `extract-build-recommendations.ts`
> Claude Code task — new pipeline script

---

## Context and Purpose

The scraper (`extract-planner-exports.ts`) produces rich per-phase files in `data/sources/planners/` containing full item data per slot: `itemType`, `subType`, `uniqueID`, `uniqueName`, and per-slot affix arrays.

`normalize-planners.ts` reads these files and strips everything down to flat `(affix_id, tier)` pairs for the Python pipeline. This is correct for affix weight extraction, but it discards data the filter compiler needs for a different purpose: generating **unique item highlight rules** and **item base show rules**.

This script is a second consumer of the same raw source files. It runs independently of `normalize-planners.ts` and the Python pipeline. Its output is consumed by the filter compiler alongside `knowledge-base.json`.

---

## Script Location

```
filter-engine/scripts/data/maxroll/extract-build-recommendations.ts
```

---

## Inputs

### Raw planner files
```
data/sources/planners/{build_slug}_{phase}.json
```

These are the files produced by `extract-planner-exports.ts` — **not** the normalized files in `planners/normalized/`. This script reads the originals.

Each file shape (relevant fields only):
```typescript
{
  build_slug: string;        // e.g. "Abomination Necromancer"
  mastery: string;           // e.g. "Necromancer"
  damage_types: string[];    // e.g. ["Physical", "Necrotic"]
  archetype: string;         // e.g. "minion"
  phase: string;             // raw Maxroll phase name e.g. "Aspirational 2H DPS Variant"
  sourceUrl: string;
  items: {
    [slot: string]: {        // slot keys: "helmet", "body", "gloves", "boots", "ring1", etc.
      itemType: number;
      subType: number;
      uniqueID: number;      // 0 = not a unique item
      uniqueName: string | null;
      affixes: Array<{ id: number; tier: number; roll: number }>;
      sealedAffix: { id: number; tier: number; roll: number } | null;
      primordialAffix: { id: number; tier: number; roll: number } | null;
    }
  };
  idols: Array<{
    slot: number;
    itemType: number;
    subType: number;
    affixes: Array<{ id: number; tier: number; roll: number }>;
  } | null>;
}
```

### Equipment mapping
```
data/mappings/MasterItemsList.json
```

Used to resolve `itemType + subType → human-readable base name`. Already loaded by `extract-planner-exports.ts` — reuse the same loader pattern.

### Phase normalization map
Use the same `PHASE_MAP` from `normalize-planners.ts`. Copy it into this script (don't import — these scripts are standalone).

---

## Output

Single file:
```
data/sources/recommendations/build-recommendations.json
```

Shape:
```typescript
interface BuildRecommendations {
  generated_at: string;           // ISO timestamp
  builds: Record<string, BuildRec>;  // keyed by normalized build_slug (snake_case)
}

interface BuildRec {
  build_slug: string;             // snake_case
  mastery: string;                // normalized lowercase
  damage_types: string[];
  archetype: string;
  source_url: string;

  uniques: UniqueRec[];           // all unique items recommended across any phase
  bases: BaseRec[];               // all exalted bases recommended across any phase
  idol_affixes: IdolAffixRec[];   // flat idol affix list (for idol rules in compiler)
}

interface UniqueRec {
  uniqueID: number;
  uniqueName: string;             // from MasterItemsList.json
  slot: string;                   // "helmet", "ring1", etc.
  phases: string[];               // which internal phases recommend it: ["endgame","aspirational"]
  itemType: number;
  subType: number;
}

interface BaseRec {
  itemType: number;
  subType: number;
  slot: string;
  phases: string[];               // which internal phases recommend this base
  baseName: string | null;        // resolved from MasterItemsList, null if unknown
  is_exalted_target: boolean;     // true when uniqueID === 0 (not a unique — it's a base to exalt)
}

interface IdolAffixRec {
  affix_id: number;
  slot: number;                   // idol slot index
  itemType: number;
  subType: number;
  phases: string[];
  max_tier: number;               // highest tier seen across all phases for this affix+slot combo
}
```

---

## Processing Logic

### Step 1 — Discover and group raw files by build slug

Same logic as `normalize-planners.ts`. Group files from `data/sources/planners/` by `build_slug`. Skip `planner-warnings.json` and any file without a `build_slug` field.

```typescript
const EXCLUDE_FILENAMES = new Set(['planner-warnings.json']);
```

### Step 2 — Normalize phase names

Use the same phase map as `normalize-planners.ts`:

```typescript
const PHASE_MAP: Record<string, 'starter' | 'endgame' | 'aspirational'> = {
  'starter': 'starter', 'campaign': 'starter', 'leveling': 'starter', 'early': 'starter',
  'endgame': 'endgame', 'defensive': 'endgame', 'empowered': 'endgame', 'late': 'endgame',
  'aspirational': 'aspirational', 'bis': 'aspirational', 'corrupt': 'aspirational',
  'dps': 'aspirational', 'variant': 'aspirational', '2h': 'aspirational',
};

function normalizePhase(raw: string): 'starter' | 'endgame' | 'aspirational' {
  const lower = raw.toLowerCase();
  if (PHASE_MAP[lower]) return PHASE_MAP[lower];
  for (const [keyword, phase] of Object.entries(PHASE_MAP)) {
    if (lower.includes(keyword)) return phase;
  }
  if (lower.includes('aspirational') || lower.includes('bis')) return 'aspirational';
  return 'endgame'; // safe fallback
}
```

### Step 3 — Extract unique recommendations

For each item slot in each phase file:

```typescript
if (item.uniqueID > 0) {
  // This slot recommends a unique item
  // Add to UniqueRec list, merging phases if same uniqueID already seen
}
```

Merging rule: if the same `uniqueID` appears in multiple phases (endgame + aspirational both recommend it), merge into a single `UniqueRec` with `phases: ["endgame", "aspirational"]`.

If `uniqueName` is null (unknown ID), attempt to resolve from `MasterItemsList.json`. If still unresolvable, keep the entry with `uniqueName: "Unknown (ID: ${uniqueID})"` and log a warning.

### Step 4 — Extract base recommendations

For each item slot where `uniqueID === 0` (it's a rare/exalted base, not a unique):

```typescript
if (item.uniqueID === 0 && item.itemType > 0) {
  // This slot recommends a specific exalted base type
  // Record itemType + subType + slot
  // is_exalted_target = true
}
```

Resolve `baseName` from `MasterItemsList.json` using `itemType → subType` lookup. Log a warning if not found.

Merging rule: same `itemType + subType + slot` combination across phases → merge phases array.

**Do not emit a base rec for `itemType === 0`** — this means the slot is empty in the planner.

### Step 5 — Extract idol affix recommendations

For each non-null idol in each phase file:

```typescript
for (const idol of phaseData.idols) {
  if (!idol) continue;
  for (const affix of idol.affixes) {
    // Key: affix.id + idol.slot + idol.itemType + idol.subType
    // Track max_tier across phases
    // Track which phases recommend this idol affix
  }
}
```

Merging rule: same `affix_id + slot + itemType + subType` → merge phases and take `max_tier`.

### Step 6 — Write output

Write to `data/sources/recommendations/build-recommendations.json`. Create the directory if it doesn't exist.

Also write a warnings file:
```
data/sources/recommendations/recommendations-warnings.json
```

Contents:
```typescript
interface Warnings {
  unknownUniqueIDs: Array<{ uniqueID: number; buildSlug: string; slot: string; phase: string }>;
  unknownBases: Array<{ itemType: number; subType: number; buildSlug: string; slot: string }>;
  totalBuilds: number;
  totalUniques: number;
  totalBases: number;
}
```

---

## CLI Interface

```bash
npx tsx scripts/data/maxroll/extract-build-recommendations.ts
npx tsx scripts/data/maxroll/extract-build-recommendations.ts --only "Abomination Necromancer"
npx tsx scripts/data/maxroll/extract-build-recommendations.ts --verbose
```

- `--only <slug>` — process only the specified build (by raw `build_slug` value, case-sensitive)
- `--verbose` — log each slot, uniqueID, and base type as it's processed

---

## Console Output Format

```
extract-build-recommendations: reading source files...

[Abomination Necromancer] — 3 source file(s)
  → Starter:      0 uniques, 8 bases, 4 idol affixes
  → Endgame:      2 uniques, 9 bases, 6 idol affixes
  → Aspirational: 3 uniques, 7 bases, 6 idol affixes
  → Merged:       3 uniques, 11 bases, 7 idol affixes

[Warpath Void Knight] — 3 source file(s)
  ...

✓ Processed 30 builds
  Uniques:        148 total recommendations
  Bases:          312 total recommendations
  Idol affixes:   89 total recommendations
  ⚠ 3 unknown unique IDs — see recommendations-warnings.json
  Output: data/sources/recommendations/build-recommendations.json
```

---

## What the Compiler Does With This Output

The compiler loads `build-recommendations.json` alongside `knowledge-base.json`. For a given mastery + phase:

1. **Unique rules** — emit `SHOW` rules with `SubTypeCondition` targeting `itemType + subType` and `RarityCondition` targeting `UNIQUE` with LP threshold per strictness level. These appear near the top of the filter (Priority 2 zone).

2. **Base rules** — emit `SHOW` rules for specific `itemType + subType` combinations with `RarityCondition` targeting `EXALTED`. These replace the generic "show all exalteds" rule with build-specific base targeting at higher strictness levels.

3. **Idol rules** — emit `SHOW` rules combining `SubTypeCondition` (idol type) with `AffixCondition` for relevant idol affixes. Replaces the generic idol affix rules from the knowledge-base affix weights with slot-aware, type-specific rules.

---

## What NOT to Do

- Do not read the `normalized/` directory — this script reads the raw phase files only
- Do not run the Python pipeline or modify `knowledge-base.json`
- Do not flatten affixes — the affix flattening belongs to `normalize-planners.ts` only
- Do not deduplicate across builds — each build gets its own entry in the output
- Do not crash on missing or null fields — all item fields should be treated as optional with safe defaults

---

## Files to Create

| File | Purpose |
|---|---|
| `scripts/data/maxroll/extract-build-recommendations.ts` | The script |
| `data/sources/recommendations/build-recommendations.json` | Main output (created at runtime) |
| `data/sources/recommendations/recommendations-warnings.json` | Warnings output (created at runtime) |

No existing files should be modified.

---

## Acceptance Criteria

- [ ] Reads raw files from `data/sources/planners/` (not `normalized/`)
- [ ] Groups files by `build_slug` and processes all phases per build
- [ ] Emits one entry per build in `build-recommendations.json`
- [ ] Unique items: deduplicated by `uniqueID + slot`, phases merged
- [ ] Base items: deduplicated by `itemType + subType + slot`, phases merged
- [ ] Idol affixes: deduplicated by `affix_id + slot + itemType + subType`, max tier tracked
- [ ] Skips slots with `itemType === 0` (empty slots)
- [ ] Warns on unknown unique IDs and unknown base types without crashing
- [ ] `--only` flag works correctly
- [ ] `--verbose` flag logs per-slot detail
- [ ] Output directory created if missing
- [ ] Warnings file written alongside main output
