# Agent Task: Build `analyze-filters.ts` — Last Epoch Filter Engine Pipeline (Script 1 of 3)

## Context & Scope

You are building **Script 1 of a 3-script data pipeline** for a Last Epoch loot filter generation engine. This script is the foundation of the entire system. Do not build Script 2 or Script 3. Do not modify the existing engine, frontend, or any existing TypeScript files.

This script's sole job is to **read raw XML filter files + mapping JSON files** and output a structured `raw-frequency.json` file. No scoring, no interpretation, no weighting — that happens in Script 3.

---

## Project Background (Read Only — Do Not Modify)

The project already has:
- `backend/app.py` — FastAPI backend
- `src/lib/templates/core/engine.ts` — filter compilation engine
- `src/lib/templates/core/rule-builder.ts` — rule generation logic
- `tools/filter-analyzer.ts` — an existing analyzer (do not modify this file)
- Existing `.ts` module files (e.g., `module_avalanche_shaman.ts`) — processed outputs from an older pipeline

**These existing files must not be touched.** The new script is a clean, separate tool.

---

## What You Are Building

### File to Create
```
scripts/pipeline/analyze-filters.ts
```

This is a standalone Node.js/TypeScript script run locally via `tsx`. It is **not** part of the Next.js app. It reads files, processes them, and writes JSON output. That's it.

---

## Inputs

### 1. XML Filter Files
- **Location:** `data/filters/raw/` (folder of `.xml` files)
- **Naming convention:** `{build-slug}_{strictness}.xml`
  - Example: `avalanche_shaman_strict.xml`, `forgedweapons_forgeguard_very_strict.xml`
  - Valid strictness values: `relaxed`, `normal`, `strict`, `very_strict`, `uber_strict`
  - The build slug becomes the key in the output JSON
- **Structure:** Standard Last Epoch filter XML — see confirmed structure below

### 2. Affix Mapping File
- **Location:** `data/mappings/affixes.json`
- **Format:** Array of affix objects. Each has:
  ```json
  {
    "affixId": 0,
    "name": "Void Penetration",
    "affixType": "Prefix",
    "group": "Offensive",
    "classSpecificity": "Universal",
    "classSpecificityCode": 0,
    "canRollOn": [20],
    "tiers": [
      { "tierNumber": 1, "requiredLevel": 0, "rolls": [{ "min": 0.04, "max": 0.04 }] }
    ]
  }
  ```
  The `canRollOn` array contains **numeric itemType IDs** (e.g. `20` = Amulet). These must be converted to filter constant strings using the `ITEM_TYPE_ID_TO_FILTER_CONSTANT` bridge table defined below. Do not use the human-readable names from `referenceMappings.itemTypes` — always go through the bridge table.

### 3. Equipment Mapping File
- **Location:** `data/mappings/equipment.json`
- **Format:** Contains a top-level `referenceMappings.itemTypes` object used for reference only. All slot resolution must go through the bridge table.

---

## Confirmed XML Structure — Verified Against Real Filter Files

### Root structure

```xml
<ItemFilter xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
  <n>Filter Name</n>
  <filterIcon>19</filterIcon>
  <filterIconColor>15</filterIconColor>
  <description></description>
  <lastModifiedInVersion>1.3.5</lastModifiedInVersion>
  <lootFilterVersion>5</lootFilterVersion>
  <rules>
    <Rule> ... </Rule>
    <Rule> ... </Rule>
  </rules>
</ItemFilter>
```

### Condition polymorphism — CRITICAL

All conditions use a **single `<Condition>` element** differentiated by the `i:type` XML attribute. There are **no** `<AffixCondition>`, `<SubTypeCondition>`, or other named condition elements. The parser must read `i:type` to determine what each condition is.

Six condition types exist in real filters:

| i:type | Script 1 action |
|---|---|
| `AffixCondition` | **Extract fully** — affix IDs, minOnTheSameItem, combined fields |
| `SubTypeCondition` | **Extract fully** — equipment slot constants |
| `UniqueModifiersCondition` | **Extract UniqueIds** — record per rule for legendary data |
| `RarityCondition` | **Skip content** — note presence only, do not crash |
| `ClassCondition` | **Skip content** — note presence only, do not crash |
| `CharacterLevelCondition` | **Skip content** — note presence only, do not crash |

For the three "skip content" types: do not crash, do not skip the parent rule. Continue processing other conditions on the same rule normally.

---

### ⚠️ Intentional typos in the game's XML — match exactly

The game's XML contains misspelled field names. If you look for the correctly-spelled versions you will find nothing:

- `<comparsion>` — NOT `<comparison>`
- `<comparsionValue>` — NOT `<comparisonValue>`
- `<combinedComparsion>` — NOT `<combinedComparison>`
- `<combinedComparsionValue>` — NOT `<combinedComparisonValue>`

---

### SubTypeCondition (confirmed)

A single SubTypeCondition can contain **multiple** `<EquipmentType>` elements. The `<subTypes>` element can be empty (self-closing).

```xml
<Condition i:type="SubTypeCondition">
  <type>
    <EquipmentType>IDOL_1x1_ETERRA</EquipmentType>
    <EquipmentType>IDOL_1x1_LAGON</EquipmentType>
    <EquipmentType>IDOL_2x1</EquipmentType>
    <EquipmentType>IDOL_1x2</EquipmentType>
  </type>
  <subTypes />
</Condition>
```

Record all `<EquipmentType>` string values as the slot context array. Handle empty `<subTypes />` without error.

---

### AffixCondition (confirmed)

```xml
<Condition i:type="AffixCondition">
  <affixes>
    <int>50</int>
    <int>504</int>
    <int>503</int>
  </affixes>
  <comparsion>ANY</comparsion>
  <comparsionValue>1</comparsionValue>
  <minOnTheSameItem>3</minOnTheSameItem>
  <combinedComparsion>ANY</combinedComparsion>
  <combinedComparsionValue>1</combinedComparsionValue>
  <advanced>false</advanced>
</Condition>
```

- Affix IDs are inside `<affixes><int>` — collect all as an array
- `<minOnTheSameItem>` is a child element, not an XML attribute — default to `0` if absent
- `<combinedComparsion>` and `<combinedComparsionValue>` — record in observations
- `appearsAlone` is `true` when `<affixes>` contains exactly one `<int>`

---

### UniqueModifiersCondition (confirmed — extract UniqueIds)

```xml
<Condition i:type="UniqueModifiersCondition">
  <Uniques>
    <UniqueId>344</UniqueId>
    <Rolls />
  </Uniques>
  <Uniques>
    <UniqueId>388</UniqueId>
    <Rolls />
  </Uniques>
</Condition>
```

Extract all `<UniqueId>` integer values per rule. Store them on the rule observation so they are available for legendary recipe analysis in Script 3. Record under `uniqueIdsObserved` in the build output.

---

### RarityCondition (confirmed — skip content, do not crash)

```xml
<Condition i:type="RarityCondition">
  <rarity>NORMAL MAGIC RARE UNIQUE SET EXALTED</rarity>
  <minLegendaryPotential i:nil="true" />
  <maxLegendaryPotential i:nil="true" />
  <minWeaversWill i:nil="true" />
  <maxWeaversWill i:nil="true" />
</Condition>
```

Note presence, do not extract or store content. Handle `i:nil="true"` self-closing elements without error.

---

### ClassCondition (confirmed — skip content, do not crash)

```xml
<Condition i:type="ClassCondition">
  <req>Primalist Sentinel Acolyte Rogue</req>
</Condition>
```

Note presence only. Do not extract content.

---

### CharacterLevelCondition (confirmed — skip content, do not crash)

```xml
<Condition i:type="CharacterLevelCondition">
  <minimumLvl>0</minimumLvl>
  <maximumLvl>40</maximumLvl>
</Condition>
```

Note presence only. Do not extract content.

---

## Bridge Table — Required Before Processing

The affix mapping file uses numeric itemType IDs in `canRollOn`. Use this table to convert those to filter constant strings. This table is used **only** for resolving affix `canRollOn` fields — not for XML parsing, which uses raw string values directly.

```typescript
const ITEM_TYPE_ID_TO_FILTER_CONSTANT: Record<number, string> = {
  0:  "HELMET",
  1:  "BODY_ARMOR",        // NOT "BODY_ARMOUR" — confirmed from spec
  2:  "GLOVES",
  3:  "BELT",
  4:  "BOOTS",
  5:  "ONE_HANDED_SWORD",
  6:  "WAND",
  7:  "ONE_HANDED_AXE",
  8:  "ONE_HANDED_MACES",  // NOT "ONE_HANDED_MACE" — confirmed from spec
  9:  "ONE_HANDED_DAGGER", // NOT "DAGGER" — confirmed from spec
  10: "ONE_HANDED_SCEPTRE",// NOT "SCEPTRE" — confirmed from spec
  12: "TWO_HANDED_SWORD",
  13: "TWO_HANDED_AXE",
  14: "TWO_HANDED_MACE",
  15: "TWO_HANDED_SPEAR",
  16: "BOW",
  17: "QUIVER",
  18: "SHIELD",
  19: "CATALYST",          // NOT "OFF_HAND_CATALYST" — confirmed from spec
  20: "AMULET",
  21: "RING",
  22: "RELIC",
  23: "TWO_HANDED_STAFF",
  24: "IDOL_1x1",
  25: "IDOL_1x1_MINOR",
  26: "IDOL_2x1",
  27: "IDOL_1x2",
  28: "IDOL_3x1",
  29: "IDOL_1x3",
  30: "IDOL_4x1",
  31: "IDOL_1x4",
  32: "IDOL_2x2"
};
```

If a numeric ID has no entry in the bridge table, record the raw number as a string (e.g. `"unknown_99"`) and log to `analyze-warnings.json`.

---

## Processing Logic — Four Steps in Order

### Step 1: Parse XML → Extract Rules

For each XML file in `data/filters/raw/`:

1. Parse the filename to extract `buildSlug` and `strictness`. Format is exactly `{build-slug}_{strictness}.xml`. The strictness is the last `_`-separated segment before `.xml`. If the filename cannot be parsed into a valid build slug + known strictness, skip the file and log it in `filesSkipped`.
2. Parse the XML using `fast-xml-parser` with the configuration below
3. Navigate to `ItemFilter.rules.Rule` — normalize to always treat as an array
4. For each `<Rule>`, iterate `conditions.Condition` (always an array) and dispatch by `__i:type`

### Step 2: Resolve Affix IDs → Metadata

For each affix ID found in an AffixCondition, look up in `affixes.json` by `affixId`. Pull:
- `name`, `group`, `classSpecificity`
- `canRollOn` — convert each numeric ID via bridge table
- `tiers` array length as `totalTiers`

If not found: log `[WARN] Unknown affixId: {id} in {filename}`, add to warnings, skip affix.

### Step 3: Record Context Per Occurrence

**Important:** AffixCondition is the ONLY condition type that can appear multiple times in a single rule. Each AffixCondition block on the same rule is treated independently — each produces its own observation entry with its own affix list, tier settings, and slot context from the SubTypeCondition on the same rule.

```typescript
interface AffixObservation {
  strictness: string;
  slotContext: string[];            // raw EquipmentType strings from SubTypeCondition on same rule
  appearsAlone: boolean;            // true if sole affix in its AffixCondition
  minOnSameItem: number;            // default 0
  // Tier fields — critical for engine weight scoring in Script 3
  comparsion: string;               // "ANY" | "MORE_OR_EQUAL" | "EQUAL" | etc. — default "ANY"
  comparsionValue: number;          // tier threshold per affix — default 1
  combinedComparsion: string;       // default "ANY"
  combinedComparsionValue: number;  // combined tier quality threshold — default 1
  advanced: boolean;                // true = tier filtering active, false = existence check only
}
```

**Why tier fields matter:** When `advanced: true` and `comparsion: MORE_OR_EQUAL` with `comparsionValue: 6`, the filter only shows this affix at tier 6+. Script 3 uses this data to auto-calculate `minTier` thresholds — if an affix consistently appears with high tier thresholds across strict filters, that informs its weight score and tier requirement in the engine output.

### Step 4: Aggregate Into Frequency Structure

```typescript
interface AffixFrequency {
  name: string;
  group: string;
  classSpecificity: string;
  canRollOn: string[];
  totalTiers: number;
  appearances: { [strictness: string]: number };
  slotsObserved: string[];      // deduplicated
  appearsAlone: boolean;        // true if ever sole affix in any condition
  maxMinOnSameItem: number;     // highest value observed
  rawScore: 0;                  // always 0, scoring is Script 3
}
```

---

## Output

### File: `data/pipeline/raw-frequency.json`

```json
{
  "_meta": {
    "generatedAt": "ISO timestamp",
    "filesProcessed": 30,
    "buildsFound": ["avalanche_shaman", "runemaster_shocking_illness"],
    "strictnessLevels": ["relaxed", "normal", "strict", "very_strict", "uber_strict"]
  },
  "builds": {
    "avalanche_shaman": {
      "affixes": {
        "892": {
          "name": "Avalanche Size",
          "group": "Offensive",
          "classSpecificity": "Universal",
          "canRollOn": ["IDOL_3x1", "IDOL_1x3"],
          "totalTiers": 8,
          "appearances": { "strict": 3, "very_strict": 2 },
          "slotsObserved": ["IDOL_3x1", "IDOL_1x3"],
          "appearsAlone": true,
          "maxMinOnSameItem": 2,
          "rawScore": 0
        }
      },
      "uniqueIdsObserved": [344, 388, 401]
    }
  }
}
```

Note the `uniqueIdsObserved` array per build — deduplicated list of all UniqueIds found across UniqueModifiersConditions in that build's filters.

---

## Additional Output: Warning Log

### File: `data/pipeline/analyze-warnings.json`

```json
{
  "unknownAffixIds": [
    { "affixId": 9999, "file": "avalanche_shaman_strict.xml" }
  ],
  "unmappedItemTypeIds": [
    { "numericId": 99, "affixId": 5, "file": "avalanche_shaman_strict.xml" }
  ],
  "idolVariantsObserved": [
    { "rawValue": "IDOL_1x1_LAGON", "file": "runemaster_shocking_illness_strict.xml" },
    { "rawValue": "IDOL_1x1_ETERRA", "file": "avalanche_shaman_strict.xml" }
  ],
  "filesSkipped": [
    { "file": "bad_format.xml", "reason": "Could not parse filename into build + strictness" }
  ]
}
```

`idolVariantsObserved` is deduplicated — one entry per unique raw value.

---

## Technical Requirements

- Language: **TypeScript**
- Runtime: Node.js via `tsx`
- XML parsing: **`fast-xml-parser`** only — no `xml2js`, no native DOM
- File I/O: `fs/promises`
- No framework dependencies (no Next.js, React, Prisma, Supabase)
- Add script entry: `"analyze-filters": "tsx scripts/pipeline/analyze-filters.ts"`

### fast-xml-parser configuration

```typescript
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '__',
  isArray: (name) => ['Rule', 'Condition', 'int', 'EquipmentType', 'Uniques'].includes(name),
});
```

`isArray` is critical — without it, single elements parse as objects causing silent data loss.

After parsing, read condition type via `condition['__i:type']`.

Example dispatch:
```typescript
for (const condition of rule.conditions?.Condition ?? []) {
  const condType = condition['__i:type'];

  if (condType === 'AffixCondition') {
    const affixIds: number[] = condition.affixes?.int ?? [];
    const minOnSameItem: number = condition.minOnTheSameItem ?? 0;
    // Tier fields — record all, critical for Script 3 weight scoring
    const comparsion: string = condition.comparsion ?? 'ANY';
    const comparsionValue: number = condition.comparsionValue ?? 1;
    const combinedComparsion: string = condition.combinedComparsion ?? 'ANY';
    const combinedComparsionValue: number = condition.combinedComparsionValue ?? 1;
    const advanced: boolean = condition.advanced === true || condition.advanced === 'true';
  }

  if (condType === 'SubTypeCondition') {
    const equipmentTypes: string[] = condition.type?.EquipmentType ?? [];
    // subTypes may be empty/null — handle gracefully
  }

  if (condType === 'UniqueModifiersCondition') {
    const uniqueIds: number[] = (condition.Uniques ?? []).map((u: any) => u.UniqueId).filter(Boolean);
  }

  // RarityCondition, ClassCondition, CharacterLevelCondition: do nothing, do not crash
}
```

---

## What This Script Must NOT Do

- ❌ Do not calculate weight scores or categories (essential / strong / useful / filler)
- ❌ Do not write or modify any `.ts` module files in `src/`
- ❌ Do not touch `engine.ts`, `rule-builder.ts`, or `filter-analyzer.ts`
- ❌ Do not connect to any database or external API
- ❌ Do not scrape Maxroll or any website
- ❌ Do not build Script 2 or Script 3
- ❌ Do not modify `backend/app.py` or any backend files
- ❌ Do not create any frontend components or pages

---

## Deliverables

1. `scripts/pipeline/analyze-filters.ts` — the script
2. `data/filters/raw/` — directory with `.gitkeep` if empty
3. `data/pipeline/` — output directory
4. `npx tsx scripts/pipeline/analyze-filters.ts` produces both output files
5. Console output: log each file processed, affix count per build, summary at end

---


## Assumptions — Verified Against Real Filter Files + Official Spec

1. ✅ All conditions are `<Condition i:type="...">` — no named condition elements
2. ✅ Six condition types confirmed: AffixCondition, SubTypeCondition, UniqueModifiersCondition, RarityCondition, ClassCondition, CharacterLevelCondition
3. ✅ **AffixCondition can appear multiple times per rule** — it is the only condition type with this property. Each block is treated independently.
4. ✅ SubTypeCondition can contain multiple `<EquipmentType>` elements
5. ✅ `<subTypes />` can be empty/self-closing — handle without error
6. ✅ Misspelled field names `comparsion`, `comparsionValue`, `combinedComparsion`, `combinedComparsionValue` — match exactly
7. ✅ `minOnTheSameItem` is a child element, not an attribute
8. ✅ `advanced: true` enables tier-based filtering — record this field, it determines whether tier thresholds are active
9. ✅ Bridge table constants corrected per official spec: `BODY_ARMOR`, `ONE_HANDED_MACES`, `ONE_HANDED_DAGGER`, `ONE_HANDED_SCEPTRE`, `CATALYST`
10. ✅ Filename convention is exactly `{build-slug}_{strictness}.xml`
11. ✅ Idol class-specific variants (e.g. `IDOL_1x1_LAGON`, `IDOL_1x1_ETERRA`) confirmed in real files — record raw, log to `idolVariantsObserved`
12. ✅ `i:nil="true"` self-closing elements appear in RarityCondition — handle without error
13. ✅ Affix ID range is 0–946, tier range is 1–7, combined tier max is 28
