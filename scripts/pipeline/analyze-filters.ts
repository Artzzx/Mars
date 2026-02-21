/**
 * analyze-filters.ts — Script 1 of 3: Last Epoch Filter Engine Pipeline
 *
 * Reads raw XML filter files from data/filters/raw/ and affix mappings from
 * data/mappings/affixes.json, then outputs:
 *   - data/pipeline/raw-frequency.json  — structured affix frequency data per build
 *   - data/pipeline/analyze-warnings.json — unknown IDs, skipped files, idol variants
 *
 * Run: npx tsx scripts/pipeline/analyze-filters.ts
 */

import { XMLParser } from 'fast-xml-parser';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');

const FILTERS_DIR = path.join(PROJECT_ROOT, 'data/filters/raw');
const AFFIXES_PATH = path.join(PROJECT_ROOT, 'data/mappings/affixes.json');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'data/pipeline');
const FREQUENCY_OUT = path.join(OUTPUT_DIR, 'raw-frequency.json');
const WARNINGS_OUT = path.join(OUTPUT_DIR, 'analyze-warnings.json');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_STRICTNESS = [
  'relaxed',
  'normal',
  'strict',
  'very_strict',
  'uber_strict',
] as const;

type Strictness = typeof VALID_STRICTNESS[number];

// Bridge table: numeric itemType ID → filter constant string
// Must use these exact strings — not the human-readable names from referenceMappings
const ITEM_TYPE_ID_TO_FILTER_CONSTANT: Record<number, string> = {
  0:  'HELMET',
  1:  'BODY_ARMOR',          // NOT "BODY_ARMOUR"
  2:  'GLOVES',
  3:  'BELT',
  4:  'BOOTS',
  5:  'ONE_HANDED_SWORD',
  6:  'WAND',
  7:  'ONE_HANDED_AXE',
  8:  'ONE_HANDED_MACES',    // NOT "ONE_HANDED_MACE"
  9:  'ONE_HANDED_DAGGER',   // NOT "DAGGER"
  10: 'ONE_HANDED_SCEPTRE',  // NOT "SCEPTRE"
  12: 'TWO_HANDED_SWORD',
  13: 'TWO_HANDED_AXE',
  14: 'TWO_HANDED_MACE',
  15: 'TWO_HANDED_SPEAR',
  16: 'BOW',
  17: 'QUIVER',
  18: 'SHIELD',
  19: 'CATALYST',            // NOT "OFF_HAND_CATALYST"
  20: 'AMULET',
  21: 'RING',
  22: 'RELIC',
  23: 'TWO_HANDED_STAFF',
  24: 'IDOL_1x1',
  25: 'IDOL_1x1_MINOR',
  26: 'IDOL_2x1',
  27: 'IDOL_1x2',
  28: 'IDOL_3x1',
  29: 'IDOL_1x3',
  30: 'IDOL_4x1',
  31: 'IDOL_1x4',
  32: 'IDOL_2x2',
};

// Idol class-specific variant pattern: e.g. IDOL_1x1_LAGON, IDOL_1x1_ETERRA
const IDOL_VARIANT_RE = /^IDOL_\d+x\d+_.+$/;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface AffixEntry {
  name: string;
  group: string;
  classSpecificity: string;
  canRollOn: number[];
  tiers: unknown[];
}

interface AffixObservation {
  strictness: Strictness;
  slotContext: string[];
  appearsAlone: boolean;
  minOnSameItem: number;
  comparsion: string;
  comparsionValue: number;
  combinedComparsion: string;
  combinedComparsionValue: number;
  advanced: boolean;
}

interface AffixFrequency {
  name: string;
  group: string;
  classSpecificity: string;
  canRollOn: string[];
  totalTiers: number;
  appearances: Record<string, number>;
  slotsObserved: string[];
  appearsAlone: boolean;
  maxMinOnSameItem: number;
  rawScore: 0;
}

interface BuildData {
  affixObservations: Map<number, AffixObservation[]>;
  uniqueIdsObserved: Set<number>;
}

interface Warnings {
  unknownAffixIds: Array<{ affixId: number; file: string }>;
  unmappedItemTypeIds: Array<{ numericId: number; affixId: number; file: string }>;
  idolVariantsObserved: Array<{ rawValue: string; file: string }>;
  filesSkipped: Array<{ file: string; reason: string }>;
}

// ---------------------------------------------------------------------------
// fast-xml-parser setup
// ---------------------------------------------------------------------------

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '__',
  isArray: (name) =>
    ['Rule', 'Condition', 'int', 'EquipmentType', 'Uniques'].includes(name),
});

// ---------------------------------------------------------------------------
// Filename parsing
// ---------------------------------------------------------------------------

/**
 * Parse a filename like "avalanche_shaman_very_strict.xml" into
 * { buildSlug: "avalanche_shaman", strictness: "very_strict" }.
 *
 * Tries longest strictness suffixes first to avoid partial matches
 * (e.g. "strict" inside "uber_strict").
 */
function parseFilename(
  filename: string,
): { buildSlug: string; strictness: Strictness } | null {
  if (!filename.toLowerCase().endsWith('.xml')) return null;
  const base = filename.slice(0, -4); // strip ".xml"

  // Order matters: try multi-word suffixes before single-word ones
  const orderedStrictness: Strictness[] = [
    'uber_strict',
    'very_strict',
    'strict',
    'normal',
    'relaxed',
  ];

  for (const s of orderedStrictness) {
    const suffix = '_' + s;
    if (base.endsWith(suffix)) {
      const buildSlug = base.slice(0, -suffix.length);
      if (buildSlug.length > 0) {
        return { buildSlug, strictness: s };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Affix map loading
// ---------------------------------------------------------------------------

async function loadAffixMap(filePath: string): Promise<Map<number, AffixEntry>> {
  const raw = JSON.parse(await readFile(filePath, 'utf-8')) as {
    singleAffixes?: AffixRaw[];
    multiAffixes?: AffixRaw[];
  };

  const map = new Map<number, AffixEntry>();
  const allAffixes = [
    ...(raw.singleAffixes ?? []),
    ...(raw.multiAffixes ?? []),
  ];

  for (const a of allAffixes) {
    map.set(a.affixId, {
      name: a.name,
      group: a.group,
      classSpecificity: a.classSpecificity,
      canRollOn: a.canRollOn ?? [],
      tiers: a.tiers ?? [],
    });
  }

  return map;
}

interface AffixRaw {
  affixId: number;
  name: string;
  group: string;
  classSpecificity: string;
  canRollOn?: number[];
  tiers?: unknown[];
}

// ---------------------------------------------------------------------------
// Bridge table resolution
// ---------------------------------------------------------------------------

function resolveItemTypeIds(
  numericIds: number[],
  affixId: number,
  filename: string,
  warnings: Warnings,
): string[] {
  return numericIds.map((id) => {
    const constant = ITEM_TYPE_ID_TO_FILTER_CONSTANT[id];
    if (constant !== undefined) return constant;
    warnings.unmappedItemTypeIds.push({ numericId: id, affixId, file: filename });
    return `unknown_${id}`;
  });
}

// ---------------------------------------------------------------------------
// Per-file processing
// ---------------------------------------------------------------------------

interface FileProcessResult {
  /** affixId → list of observations collected from this file */
  affixObservations: Map<number, AffixObservation[]>;
  uniqueIds: Set<number>;
}

function processXmlFile(
  xmlContent: string,
  filename: string,
  strictness: Strictness,
  affixMap: Map<number, AffixEntry>,
  warnings: Warnings,
): FileProcessResult {
  const parsed = parser.parse(xmlContent) as ParsedFilter;

  const rulesContainer = parsed?.ItemFilter?.rules;
  if (!rulesContainer) {
    return { affixObservations: new Map(), uniqueIds: new Set() };
  }

  // Normalize to array (isArray config ensures Rule is always an array,
  // but rules might be missing entirely — guarded above)
  const rules: Rule[] = Array.isArray(rulesContainer.Rule)
    ? rulesContainer.Rule
    : rulesContainer.Rule
    ? [rulesContainer.Rule as Rule]
    : [];

  const affixObservations = new Map<number, AffixObservation[]>();
  const uniqueIds = new Set<number>();

  for (const rule of rules) {
    const conditions: Condition[] = rule.conditions?.Condition ?? [];

    // First pass: collect slot context from SubTypeCondition(s) on this rule
    const slotContext: string[] = [];
    for (const condition of conditions) {
      const condType = condition['__i:type'];
      if (condType === 'SubTypeCondition') {
        const equipTypes: string[] = condition.type?.EquipmentType ?? [];
        for (const et of equipTypes) {
          slotContext.push(et);
          // Track idol class-specific variants
          if (IDOL_VARIANT_RE.test(et)) {
            const alreadyTracked = warnings.idolVariantsObserved.some(
              (v) => v.rawValue === et,
            );
            if (!alreadyTracked) {
              warnings.idolVariantsObserved.push({ rawValue: et, file: filename });
            }
          }
        }
      }
    }

    // Second pass: process AffixCondition and UniqueModifiersCondition
    for (const condition of conditions) {
      const condType = condition['__i:type'];

      if (condType === 'AffixCondition') {
        const affixIds: number[] = condition.affixes?.int ?? [];
        const minOnSameItem: number = condition.minOnTheSameItem ?? 0;
        const comparsion: string = condition.comparsion ?? 'ANY';
        const comparsionValue: number = condition.comparsionValue ?? 1;
        const combinedComparsion: string = condition.combinedComparsion ?? 'ANY';
        const combinedComparsionValue: number =
          condition.combinedComparsionValue ?? 1;
        const advanced: boolean =
          condition.advanced === true || condition.advanced === 'true';
        const appearsAlone: boolean = affixIds.length === 1;

        for (const affixId of affixIds) {
          const affixEntry = affixMap.get(affixId);
          if (!affixEntry) {
            // Unknown affix — log warning and skip
            const alreadyLogged = warnings.unknownAffixIds.some(
              (w) => w.affixId === affixId && w.file === filename,
            );
            if (!alreadyLogged) {
              warnings.unknownAffixIds.push({ affixId, file: filename });
            }
            console.warn(`  [WARN] Unknown affixId: ${affixId} in ${filename}`);
            continue;
          }

          const observation: AffixObservation = {
            strictness,
            slotContext: [...slotContext],
            appearsAlone,
            minOnSameItem,
            comparsion,
            comparsionValue,
            combinedComparsion,
            combinedComparsionValue,
            advanced,
          };

          if (!affixObservations.has(affixId)) {
            affixObservations.set(affixId, []);
          }
          affixObservations.get(affixId)!.push(observation);
        }
      } else if (condType === 'UniqueModifiersCondition') {
        const uniques: UniqueBlock[] = condition.Uniques ?? [];
        for (const u of uniques) {
          if (u.UniqueId != null) {
            uniqueIds.add(Number(u.UniqueId));
          }
        }
      }
      // RarityCondition, ClassCondition, CharacterLevelCondition: skip silently
    }
  }

  return { affixObservations, uniqueIds };
}

// ---------------------------------------------------------------------------
// Type helpers for parsed XML
// ---------------------------------------------------------------------------

interface ParsedFilter {
  ItemFilter?: {
    rules?: {
      Rule?: Rule | Rule[];
    };
  };
}

interface Rule {
  conditions?: {
    Condition?: Condition[];
  };
}

interface Condition {
  '__i:type'?: string;
  // AffixCondition fields
  affixes?: { int?: number[] };
  minOnTheSameItem?: number;
  comparsion?: string;
  comparsionValue?: number;
  combinedComparsion?: string;
  combinedComparsionValue?: number;
  advanced?: boolean | string;
  // SubTypeCondition fields
  type?: { EquipmentType?: string[] };
  // UniqueModifiersCondition fields
  Uniques?: UniqueBlock[];
}

interface UniqueBlock {
  UniqueId?: number | string;
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

function aggregateBuildData(
  allObservations: Map<number, AffixObservation[]>,
  affixMap: Map<number, AffixEntry>,
  filename: string,
  warnings: Warnings,
): Record<string, AffixFrequency> {
  const result: Record<string, AffixFrequency> = {};

  for (const [affixId, observations] of allObservations) {
    const affixEntry = affixMap.get(affixId);
    if (!affixEntry) continue; // already warned during processing

    // Resolve canRollOn via bridge table
    const canRollOn = resolveItemTypeIds(
      affixEntry.canRollOn,
      affixId,
      filename,
      warnings,
    );

    // Count appearances per strictness
    const appearances: Record<string, number> = {};
    for (const obs of observations) {
      appearances[obs.strictness] = (appearances[obs.strictness] ?? 0) + 1;
    }

    // Deduplicated slots observed
    const slotsObservedSet = new Set<string>();
    for (const obs of observations) {
      for (const slot of obs.slotContext) {
        slotsObservedSet.add(slot);
      }
    }

    const appearsAlone = observations.some((o) => o.appearsAlone);
    const maxMinOnSameItem = Math.max(0, ...observations.map((o) => o.minOnSameItem));

    result[String(affixId)] = {
      name: affixEntry.name,
      group: affixEntry.group,
      classSpecificity: affixEntry.classSpecificity,
      canRollOn,
      totalTiers: affixEntry.tiers.length,
      appearances,
      slotsObserved: [...slotsObservedSet],
      appearsAlone,
      maxMinOnSameItem,
      rawScore: 0,
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== analyze-filters.ts — Last Epoch Filter Pipeline Script 1 ===\n');

  // Load affix map
  console.log(`Loading affix map from ${AFFIXES_PATH}...`);
  const affixMap = await loadAffixMap(AFFIXES_PATH);
  console.log(`  Loaded ${affixMap.size} affixes\n`);

  // Initialize warnings
  const warnings: Warnings = {
    unknownAffixIds: [],
    unmappedItemTypeIds: [],
    idolVariantsObserved: [],
    filesSkipped: [],
  };

  // Read XML files
  let xmlFiles: string[];
  try {
    const entries = await readdir(FILTERS_DIR);
    xmlFiles = entries.filter((f) => f.toLowerCase().endsWith('.xml'));
  } catch {
    console.error(`Could not read filters directory: ${FILTERS_DIR}`);
    console.error('Please add .xml filter files to data/filters/raw/');
    xmlFiles = [];
  }

  if (xmlFiles.length === 0) {
    console.log('No XML files found in data/filters/raw/');
    console.log('Add filter files named: {build-slug}_{strictness}.xml');
    console.log(
      'Valid strictness values: relaxed, normal, strict, very_strict, uber_strict\n',
    );
  }

  // Build data: buildSlug → BuildData
  const builds = new Map<string, BuildData>();
  let filesProcessed = 0;

  for (const filename of xmlFiles) {
    const parsed = parseFilename(filename);
    if (!parsed) {
      console.log(`  Skipping: ${filename} (cannot parse into build + strictness)`);
      warnings.filesSkipped.push({
        file: filename,
        reason: 'Could not parse filename into build + strictness',
      });
      continue;
    }

    const { buildSlug, strictness } = parsed;
    const filePath = path.join(FILTERS_DIR, filename);
    const xmlContent = await readFile(filePath, 'utf-8');

    console.log(
      `Processing: ${filename} → build: ${buildSlug}, strictness: ${strictness}`,
    );

    const { affixObservations, uniqueIds } = processXmlFile(
      xmlContent,
      filename,
      strictness,
      affixMap,
      warnings,
    );

    // Merge into build data
    if (!builds.has(buildSlug)) {
      builds.set(buildSlug, {
        affixObservations: new Map(),
        uniqueIdsObserved: new Set(),
      });
    }

    const buildData = builds.get(buildSlug)!;

    // Merge affix observations
    for (const [affixId, obs] of affixObservations) {
      if (!buildData.affixObservations.has(affixId)) {
        buildData.affixObservations.set(affixId, []);
      }
      buildData.affixObservations.get(affixId)!.push(...obs);
    }

    // Merge unique IDs
    for (const uid of uniqueIds) {
      buildData.uniqueIdsObserved.add(uid);
    }

    filesProcessed++;
  }

  // Build output
  const buildsFound = [...builds.keys()].sort();
  const strictnessLevels = [...VALID_STRICTNESS];

  // Determine which strictness levels were actually encountered
  const encounteredStrictness = new Set<string>();
  for (const bd of builds.values()) {
    for (const obs of bd.affixObservations.values()) {
      for (const o of obs) {
        encounteredStrictness.add(o.strictness);
      }
    }
  }

  const buildsOutput: Record<
    string,
    { affixes: Record<string, AffixFrequency>; uniqueIdsObserved: number[] }
  > = {};

  for (const buildSlug of buildsFound) {
    const buildData = builds.get(buildSlug)!;

    // Use a representative filename (build slug) for bridge table warning attribution
    const representativeFile = `${buildSlug}_*.xml`;

    const affixes = aggregateBuildData(
      buildData.affixObservations,
      affixMap,
      representativeFile,
      warnings,
    );

    const affixCount = Object.keys(affixes).length;
    console.log(`  ${buildSlug}: ${affixCount} unique affixes tracked`);

    buildsOutput[buildSlug] = {
      affixes,
      uniqueIdsObserved: [...buildData.uniqueIdsObserved].sort((a, b) => a - b),
    };
  }

  const rawFrequency = {
    _meta: {
      generatedAt: new Date().toISOString(),
      filesProcessed,
      buildsFound,
      strictnessLevels,
    },
    builds: buildsOutput,
  };

  // Deduplicate warnings.unknownAffixIds (keep first occurrence per affixId+file pair)
  // (already deduplicated during processing, but ensure clean output)
  const seenUnknown = new Set<string>();
  warnings.unknownAffixIds = warnings.unknownAffixIds.filter((w) => {
    const key = `${w.affixId}::${w.file}`;
    if (seenUnknown.has(key)) return false;
    seenUnknown.add(key);
    return true;
  });

  // Write outputs
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(FREQUENCY_OUT, JSON.stringify(rawFrequency, null, 2), 'utf-8');
  await writeFile(WARNINGS_OUT, JSON.stringify(warnings, null, 2), 'utf-8');

  console.log(`\n✓ Processed ${filesProcessed} files, ${buildsFound.length} builds`);
  console.log(`✓ Written: ${FREQUENCY_OUT}`);
  console.log(`✓ Written: ${WARNINGS_OUT}`);

  if (warnings.unknownAffixIds.length > 0) {
    console.log(`⚠ ${warnings.unknownAffixIds.length} unknown affix ID(s) — see analyze-warnings.json`);
  }
  if (warnings.filesSkipped.length > 0) {
    console.log(`⚠ ${warnings.filesSkipped.length} file(s) skipped — see analyze-warnings.json`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
