# Spec: Filter Compiler
> Claude Code task — full TypeScript component build

---

## What This Is

The filter compiler is the TypeScript component that takes user parameters and produces a downloadable Last Epoch XML filter file. It is the final stage of the engine.

It reads two JSON files produced by the data pipeline:
- `data/weights/knowledge-base.json` — affix weights per build per phase
- `data/sources/recommendations/build-recommendations.json` — unique items, exalted bases, idol affixes

It reads five TypeScript game constants files already in the repo:
- `filter-compiler/src/knowledge/game/classes.ts`
- `filter-compiler/src/knowledge/game/damage-types.ts`
- `filter-compiler/src/knowledge/game/affix-graph.ts`
- `filter-compiler/src/knowledge/game/affix-taxonomy.ts`
- `filter-compiler/src/knowledge/game/threshold-affixes.ts`

It uses the existing XML generator already in the codebase:
- `filter-site/src/lib/xml/generator.ts`
- `filter-site/src/lib/filters/types.ts`

**Do not modify any of the above files.** Build on top of them.

---

## File Structure to Create

```
filter-compiler/src/
  compiler/
    index.ts           ← Public entry point: compileFilter()
    context.ts         ← resolveContext() — user input → BuildContext
    lookup.ts          ← lookupKnowledgeProfile() — BuildContext → ResolvedProfile
    prerequisites.ts   ← applyPrerequisites() — zero out irrelevant affixes
    budget.ts          ← allocateRuleBudget() — plan rule sections within 75 cap
    rules/
      index.ts         ← generateRules() orchestrator
      legendary.ts     ← generateLegendaryRules()
      uniques.ts       ← generateUniqueRules()
      threshold.ts     ← generateThresholdRules()
      recommended.ts   ← generateRecommendedUniqueRules() + generateBasRules()
      idols.ts         ← generateIdolRules()
      exalted.ts       ← generateExaltedRules()
      rares.ts         ← generateRareRules()
      leveling.ts      ← generateLevelingRules()
      crossclass.ts    ← generateCrossClassRules()
      classhide.ts     ← generateClassHideRules()
  types/
    build-context.ts   ← BuildContext interface
    resolved-profile.ts ← ResolvedProfile interface
    knowledge-base.ts  ← TypeScript types for knowledge-base.json shape
    recommendations.ts ← TypeScript types for build-recommendations.json shape
  loaders/
    knowledge-base.ts  ← loadKnowledgeBase() — reads + validates JSON
    recommendations.ts ← loadRecommendations() — reads + validates JSON
```

---

## Stage 1 — `context.ts`: resolveContext()

Converts raw user form input into a validated, enriched `BuildContext`.

### Input — `UserInput`

```typescript
interface UserInput {
  mastery: string;                   // e.g. "necromancer"
  damageTypes: string[];             // e.g. ["physical", "necrotic"]
  gameProgress: GameProgress;        // see enum below
  archetype: Archetype | null;       // null = "not sure"
  strictnessId: string;              // may be overridden by recommended strictness
  resistancesCapped: boolean;
  showCrossClassItems: boolean;
  crossClassWeightThreshold: number; // default 75
}

type GameProgress =
  | 'campaign'
  | 'early_monolith'
  | 'empowered_monolith'
  | 'high_corruption';

type Archetype = 'melee' | 'spell' | 'dot' | 'minion' | 'ranged';
```

### Output — `BuildContext`

```typescript
interface BuildContext {
  mastery: string;                   // normalized lowercase
  damageTypes: string[];             // normalized lowercase
  phase: 'starter' | 'endgame' | 'aspirational';
  archetype: Archetype | null;
  attackType: 'melee' | 'spell' | 'bow' | null;  // derived from archetype
  usesMinions: boolean;                            // derived from archetype
  usesShield: boolean;                             // false for v1 — not yet in UI
  strictnessId: string;
  resistancesCapped: boolean;
  showCrossClassItems: boolean;
  crossClassWeightThreshold: number;
  baseClass: string;                 // derived from mastery via classes.ts
}
```

### Mapping rules

**gameProgress → phase:**
```
campaign           → starter
early_monolith     → endgame
empowered_monolith → endgame
high_corruption    → aspirational
```

**gameProgress → recommended strictness (applied if user left default):**
```
campaign           → regular
early_monolith     → strict
empowered_monolith → very-strict
high_corruption    → uber-strict
```

**archetype → attackType + usesMinions:**
```
melee   → attackType: 'melee',  usesMinions: false
spell   → attackType: 'spell',  usesMinions: false
dot     → attackType: 'spell',  usesMinions: false
minion  → attackType: 'spell',  usesMinions: true
ranged  → attackType: 'bow',    usesMinions: false
null    → attackType: null,     usesMinions: false
```

**mastery → baseClass** — use `CLASS_HIERARCHY` from `classes.ts`. Walk the hierarchy to find which base class contains the mastery.

---

## Stage 2 — `lookup.ts`: lookupKnowledgeProfile()

Finds the best matching build profile from `knowledge-base.json` for the given context, then merges in recommendation data.

### Profile matching (try in order, use first match)

```
Level 1: mastery + ALL damageTypes match + archetype matches  → specificity 1.0
Level 2: mastery + ANY damageType matches + archetype matches → specificity 0.85
Level 3: mastery + ANY damageType matches                     → specificity 0.7
Level 4: mastery only                                         → specificity 0.4
Level 5: baseClass only                                       → specificity 0.2
Level 6: universal baseline (all affixes weight = 0)          → specificity 0.0
```

When multiple builds match at the same level (e.g. three Necromancer builds), **union their affix lists**, keeping the highest weight per `affix_id`. This is the cross-build merge.

### Output — `ResolvedProfile`

```typescript
interface ResolvedProfile {
  specificityScore: number;        // 0.0–1.0 from match level
  dataSourceLayer: string;         // "specific" | "mastery" | "class" | "baseline"
  confidence: 'high' | 'medium' | 'low';  // from knowledge-base
  phaseAffixes: AffixWeight[];     // merged + phase-selected affix list
  recommendedUniques: UniqueRec[];
  recommendedBases: BaseRec[];
  idolAffixes: IdolAffixRec[];
  matchedBuilds: string[];         // build slugs that contributed (for debugging)
}
```

`phaseAffixes` is the affix list from the matching profile's phase that corresponds to `context.phase`. If a build has no `aspirational` phase data, fall back to `endgame`. If no `endgame`, fall back to `starter`.

For `recommendedUniques`, `recommendedBases`, `idolAffixes`: load from `build-recommendations.json` using the same mastery/archetype matching logic. Filter to the active phase.

---

## Stage 3 — `prerequisites.ts`: applyPrerequisites()

Zero out affixes that fail PREREQUISITE conditions for this build.

### How PREREQUISITE edges work

`affix-graph.ts` contains edges of type `PREREQUISITE`:
```typescript
{
  from: 98,    // Increased Minion Damage Over Time
  to: 26,      // anchor: Increased Minion Damage
  type: 'PREREQUISITE',
  strength: 1,
  condition: 'build.usesMinions === true',
}
```

The `from` affix is only relevant if the `condition` evaluates to `true` against the build context. If the condition fails, set that affix's weight to 0.

### Condition evaluation

Conditions are simple predicate strings. Evaluate them against `BuildContext`:

```typescript
function evaluateCondition(condition: string, ctx: BuildContext): boolean {
  // Handle: "build.usesMinions === true"
  // Handle: "build.attackType === 'melee'"
  // Handle: "build.damageType === 'physical'"  ← check ctx.damageTypes array
  // Handle: compound: "A && B", "A || B"
}
```

**Critical:** `build.damageType === "x"` should check if `x` is **in** `ctx.damageTypes[]`, not equality. `damageTypes` is now an array.

### Class-gated affixes

Check `affix-taxonomy.ts`. Any affix with `structuralCategory: 'class_gated'` has a `validClasses` field. If `ctx.baseClass` is not in `validClasses`, set weight to 0. This applies **even when `showCrossClassItems` is true** — these affixes physically cannot roll on your class items.

### Output

Returns a new `AffixWeight[]` with failed affixes zeroed. Does not mutate input.

---

## Stage 4 — `budget.ts`: allocateRuleBudget()

Plans which rule sections to include within the `MAX_RULES = 75` cap.

### Rule budget by section

| Section | Min rules | Max rules | Condition |
|---|---|---|---|
| Legendary | 1 | 1 | Always |
| Unique LP tiers | 2 | 5 | Based on strictness.minLegendaryPotential |
| Threshold affixes | 0 | 8 | Only if !resistancesCapped AND phase ≠ aspirational |
| Recommended uniques | 0 | 6 | If build-recommendations data available |
| Exalted rules | 1 | 8 | Always; tier varies by strictness |
| Idol rules | 1 | 6 | Always |
| Rare rules | 0 | 4 | Dropped at very-strict+ |
| Leveling rules | 0 | 4 | Dropped at strict+ |
| Cross-class SHOW | 0 | 2 | Only if showCrossClassItems |
| Class HIDE | 0 | 1 | Only if !showCrossClassItems |
| Affix rules (essential) | 0 | reserved | Filled with remaining budget |
| Affix rules (strong) | 0 | reserved | Only if budget remains |
| Affix rules (useful) | 0 | reserved | Only if budget remains after strong |

**Filling affix rules:**
1. Calculate remaining budget after all fixed sections
2. Sort `phaseAffixes` by weight descending
3. Fill essential affixes first (weight ≥ 75)
4. If budget remains, add strong affixes (weight 50–74)
5. If budget remains, add useful affixes (weight 25–49)
6. Never add filler affixes (weight < 25) — they waste slots

Each unique affix generates one rule (SHOW with AffixCondition). Multiple affixes can be combined into one rule using `MORE_OR_EQUAL` comparison when the budget is very tight.

### Output — `RuleSchedule`

```typescript
interface RuleSchedule {
  sections: Array<{
    name: string;
    priority: number;
    estimatedRules: number;
    generate: () => CompiledRule[];
  }>;
  totalEstimated: number;   // must be ≤ 75
  budgetUsed: number;
  affixesIncluded: number;
  affixesDrooped: number;  // dropped due to budget
}
```

---

## Stage 5 — `rules/`: Rule Generators

Each file generates rules for one section. All use the existing `buildRarityCondition`, `buildClassCondition`, `buildAffixCondition`, `buildEquipmentCondition` helpers from `rule-builder.ts`.

### Priority constants (add to existing PRIORITY object in `rule-builder.ts`)

```typescript
const PRIORITY = {
  // existing...
  THRESHOLD_AFFIX:     45,
  RECOMMENDED_UNIQUE:  50,
  BUILD_EXALTED_BASE:  55,
  CROSS_CLASS_AFFIX:   150,
  // existing HIDE_OTHER_CLASS: 300
};
```

### `legendary.ts`

Single rule. Always present. No changes from current behavior.

```typescript
SHOW Legendary
  RarityCondition: [LEGENDARY]
  color: 5, emphasized: true, sound: 6, beam: 4
```

### `uniques.ts`

LP-tiered rules. Behavior from existing `generateUniqueRules()`. Keep as-is.

LP thresholds by strictness:
```
regular:     show 0LP+
strict:      show 1LP+, hide 0LP
very-strict: show 2LP+, hide 0–1LP
uber-strict: show 3LP+, hide 0–2LP
giga-strict: show 4LP+, hide 0–3LP
```

### `threshold.ts`

Resistance + endurance rules. Only emitted when `!ctx.resistancesCapped`.

Load `THRESHOLD_AFFIXES` from `threshold-affixes.ts`. Filter to `relevantPhases.includes(ctx.phase)`. Group by `toggleKey`. Emit one SHOW rule per toggle key group.

```typescript
SHOW [Threshold] Elemental Resistance (T3+)
  AffixCondition: [affixIds for elemental_resistance_capped toggleKey]
  comparison: MORE_OR_EQUAL, minOnSameItem: 1
  color: 12 (green), emphasized: false
```

Skip entirely when `ctx.phase === 'aspirational'` — players at that level have resistances handled.

### `recommended.ts`

Unique item highlight rules from `build-recommendations.json`. Filter to `rec.phases.includes(ctx.phase)`.

```typescript
// One rule per unique item
SHOW [Build] Abomination's Heart (UNIQUE)
  SubTypeCondition: itemType + subType
  RarityCondition: [UNIQUE], minLP: 0
  color: 5, emphasized: true, sound: 6, beam: 4

// One rule per recommended exalted base
SHOW [Build] Exalted Runic Plate (EXALTED)
  SubTypeCondition: itemType + subType
  RarityCondition: [EXALTED]
  color: 14 (purple), emphasized: true, sound: 2, beam: 2
```

### `idols.ts`

Slot-specific idol rules from `build-recommendations.json`. Group by `itemType + subType` (idol size/type). Emit one SHOW rule per group with AffixCondition for all affixes in that group.

```typescript
SHOW [Build] Idol w/ Minion Dmg + Minion Health
  SubTypeCondition: itemType + subType   ← idol size/type
  AffixCondition: [affixIds], MORE_OR_EQUAL, 1
  color: 8, emphasized: true, sound: 1, beam: 1
```

### `exalted.ts`

Two sub-sections:

**Build-specific exalted SHOW** — for essential affixes, emit SHOW rules on EXALTED rarity with AffixCondition. These come before the generic exalted rules.

```typescript
SHOW [Build] Exalted w/ Affix X
  RarityCondition: [EXALTED]
  AffixCondition: [essentialAffixIds], MORE_OR_EQUAL, 1
  color: 14, emphasized: true, sound: 2, beam: 2
```

**Tier-gated hide** — based on strictness:
```
regular:     show all exalteds (no hide)
strict:      hide exalteds below T6 (minExaltedTier: 6)
very-strict: hide exalteds below T7 (minExaltedTier: 7)
uber-strict: hide exalteds below T7
giga-strict: hide exalteds below T7 + require double T7
```

Use `AffixCountCondition` for the double-T7 requirement at giga-strict.

### `rares.ts`

Only emitted at `regular` and `strict`. Essential affix combos on RARE rarity.

```typescript
SHOW [Build] Rare w/ Essential Affixes (2+ match)
  RarityCondition: [RARE]
  AffixCondition: [essentialAffixIds], MORE_OR_EQUAL, 2
  color: 0 (default)

// Then the generic rare hide at strict
HIDE Rare
  RarityCondition: [RARE]
  priority: HIDE_RARE
```

### `leveling.ts`

Magic and Normal items during leveling. Dropped at `strict+`. Keep existing behavior from `generateLevelingRules()`.

### `crossclass.ts`

Only emitted when `ctx.showCrossClassItems === true`.

Get all affix IDs from `ResolvedProfile.phaseAffixes` where `weight >= ctx.crossClassWeightThreshold`. These are the cross-class show rules.

```typescript
SHOW [Cross-Class] Strong Affixes
  AffixCondition: [highWeightAffixIds], MORE_OR_EQUAL, 1
  color: 0 (default — no emphasis for cross-class)
  priority: CROSS_CLASS_AFFIX (150)
```

If `highWeightAffixIds.length === 0`, skip — do not emit an empty rule.

### `classhide.ts`

Only emitted when `ctx.showCrossClassItems === false`.

Get `ALL_CLASSES` minus `ctx.baseClass`. Emit one HIDE rule.

```typescript
HIDE Non-Necromancer Items
  ClassCondition: [all other classes]
  priority: HIDE_OTHER_CLASS (300)
```

---

## Stage 6 — `index.ts`: Main Entry Point

The public API of the compiler. Two exports:

### `compileFilter(input: UserInput): ItemFilter`

```typescript
export function compileFilter(input: UserInput): ItemFilter {
  const kb = loadKnowledgeBase();
  const recs = loadRecommendations();

  const ctx = resolveContext(input);
  const profile = lookupKnowledgeProfile(ctx, kb, recs);
  const filteredAffixes = applyPrerequisites(profile.phaseAffixes, ctx);
  const schedule = allocateRuleBudget(ctx, profile, filteredAffixes);
  const rules = generateRules(schedule, ctx, profile, filteredAffixes);

  rules.sort((a, b) => a.order - b.order);

  return {
    name: generateFilterName(ctx, profile),
    filterIcon: getClassIcon(ctx.baseClass),
    filterIconColor: getStrictnessColor(ctx.strictnessId),
    description: generateFilterDescription(ctx, profile),
    lastModifiedInVersion: GAME_VERSION.CURRENT,
    lootFilterVersion: FILTER_VERSION.CURRENT,
    rules: rules.map(toFilterRule),
  };
}
```

### `compileFilterXML(input: UserInput): string`

Calls `compileFilter()`, then passes the result to the existing `generateXML()` from `filter-site/src/lib/xml/generator.ts`.

```typescript
export function compileFilterXML(input: UserInput): string {
  const filter = compileFilter(input);
  return generateXML(filter);
}
```

---

## XML Format Requirements

These are non-negotiable. The game parser is strict.

**Intentional misspellings** — must be preserved exactly:
- `comparsion` not `comparison` (in AffixCondition)
- `treshold` not `threshold` (in LevelCondition)

These already exist in `types.ts` and `generator.ts`. Do not "fix" them.

**Polymorphic condition tags:**
Every `<Condition>` element must have `i:type="..."` attribute set to the concrete condition type name (e.g. `RarityCondition`, `AffixCondition`, `ClassCondition`).

**Rule ordering:** Lower `order` value = higher in the file = processed first. The game reads top-to-bottom and uses the first matching rule.

**Max rules:** `MAX_RULES = 75`, defined in `types.ts`. Never exceed this.

---

## Loaders — `loaders/`

### `knowledge-base.ts`

```typescript
let cache: KnowledgeBase | null = null;

export function loadKnowledgeBase(): KnowledgeBase {
  if (cache) return cache;
  // In Node/build context: read from file system
  // In browser/runtime context: import as JSON module
  // Throw clearly if file missing or malformed
  cache = validate(raw);
  return cache;
}
```

Validate required fields: `version`, `generated_at`, `builds`. Throw if missing. Log a warning (not error) if `builds` is empty.

### `recommendations.ts`

Same pattern. If file doesn't exist, return an empty recommendations object — the compiler degrades gracefully without it.

```typescript
export function loadRecommendations(): BuildRecommendations {
  try {
    return validate(raw);
  } catch {
    console.warn('[filter-compiler] build-recommendations.json not found — unique/base rules disabled');
    return { generated_at: '', builds: {} };
  }
}
```

---

## Filter Metadata Generation

### `generateFilterName(ctx, profile)`

```
[Mastery] [Damage Types] [Strictness] Filter
e.g. "Necromancer Physical/Necrotic Strict Filter"
e.g. "Necromancer Very Strict Filter"  (if damageTypes not specified)
```

### `generateFilterDescription(ctx, profile)`

Multi-line string:
```
Line 1: strictness description (from STRICTNESS_CONFIGS)
Line 2: "Optimized for Necromancer (Minion) — Physical/Necrotic"
Line 3: "Phase: Endgame | Confidence: High | Sources: 6"
Line 4: "Generated by Last Epoch Filter Tool"
```

### `getClassIcon(baseClass)`

Map base class to filter icon ID (existing mapping in engine.ts — reuse it).

### `getStrictnessColor(strictnessId)`

Map strictness to filter icon color (existing mapping in engine.ts — reuse it).

---

## Confidence Passthrough

`ResolvedProfile.confidence` should be returned alongside the filter to the calling code (the download page), so it can display a badge:

```typescript
export interface CompileResult {
  filter: ItemFilter;
  xml: string;
  confidence: 'high' | 'medium' | 'low';
  specificityScore: number;
  matchedBuilds: string[];    // for debug display
  rulesGenerated: number;
  affixesDropped: number;     // dropped due to budget
}

export function compileFilterFull(input: UserInput): CompileResult {
  // ...same as compileFilter but returns full metadata
}
```

---

## Error Handling

| Situation | Behavior |
|---|---|
| `knowledge-base.json` missing | Throw with clear message: "Run pipeline first" |
| `build-recommendations.json` missing | Warn and continue — unique/base rules disabled |
| No matching build profile | Use baseline fallback, confidence: "low" |
| Rule count exceeds 75 | Drop lowest-priority affixes until ≤ 75, log how many dropped |
| Unknown mastery | Throw with message listing valid masteries |
| Invalid strictnessId | Fall back to "regular", log warning |
| Empty damageTypes array | Use mastery-only profile lookup |

---

## CLI Entry Point (optional for local testing)

```
filter-compiler/src/cli.ts
```

```bash
npx tsx filter-compiler/src/cli.ts \
  --mastery necromancer \
  --damage-types physical necrotic \
  --archetype minion \
  --progress empowered_monolith \
  --strictness very-strict \
  --out ./output/my-filter.filter
```

Prints: build slug matched, specificity score, confidence, rule count, affixes dropped.

---

## Files to Create (summary)

| File | Purpose |
|---|---|
| `compiler/index.ts` | `compileFilter()`, `compileFilterXML()`, `compileFilterFull()` |
| `compiler/context.ts` | `resolveContext()` |
| `compiler/lookup.ts` | `lookupKnowledgeProfile()` |
| `compiler/prerequisites.ts` | `applyPrerequisites()` |
| `compiler/budget.ts` | `allocateRuleBudget()` |
| `compiler/rules/index.ts` | `generateRules()` orchestrator |
| `compiler/rules/legendary.ts` | |
| `compiler/rules/uniques.ts` | |
| `compiler/rules/threshold.ts` | |
| `compiler/rules/recommended.ts` | |
| `compiler/rules/idols.ts` | |
| `compiler/rules/exalted.ts` | |
| `compiler/rules/rares.ts` | |
| `compiler/rules/leveling.ts` | |
| `compiler/rules/crossclass.ts` | |
| `compiler/rules/classhide.ts` | |
| `types/build-context.ts` | `UserInput`, `BuildContext`, `GameProgress`, `Archetype` |
| `types/resolved-profile.ts` | `ResolvedProfile`, `RuleSchedule`, `CompileResult` |
| `types/knowledge-base.ts` | TS types matching `knowledge-base.json` schema |
| `types/recommendations.ts` | TS types matching `build-recommendations.json` schema |
| `loaders/knowledge-base.ts` | `loadKnowledgeBase()` |
| `loaders/recommendations.ts` | `loadRecommendations()` |
| `cli.ts` | Local test CLI (optional) |

## Files to NOT modify

- `filter-site/src/lib/xml/generator.ts`
- `filter-site/src/lib/filters/types.ts`
- `filter-site/src/lib/templates/core/rule-builder.ts` (except adding new PRIORITY constants)
- Any file under `filter-compiler/src/knowledge/game/`
- Any file under `data/`

---

## Acceptance Criteria

- [ ] `compileFilterXML(input)` returns valid XML parseable by Last Epoch
- [ ] Rule count never exceeds 75
- [ ] PREREQUISITE conditions zero out the correct affixes (verify: minion affixes absent for non-minion build)
- [ ] `resistancesCapped: true` removes threshold affix rules from output
- [ ] `showCrossClassItems: false` includes ClassCondition HIDE rule
- [ ] `showCrossClassItems: true` removes ClassCondition HIDE, adds SHOW for high-weight affixes
- [ ] Class-gated affixes never appear in output for wrong class
- [ ] `specificityScore: 0.0` (baseline fallback) produces a valid filter — no crash
- [ ] `confidence` field correctly passed through to `CompileResult`
- [ ] Missing `build-recommendations.json` produces valid filter without unique/base rules
- [ ] Intentional misspellings `comparsion` and `treshold` preserved in XML output
- [ ] All `<Condition>` tags have `i:type=` attribute
- [ ] CLI produces a `.filter` file that imports into Last Epoch without errors
