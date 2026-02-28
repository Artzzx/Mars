/**
 * extract-build-recommendations.ts — Script 2.7 of 3: Last Epoch Filter Engine Pipeline
 *
 * Second consumer of the raw per-phase planner JSONs. While normalize-planners.ts
 * flattens affixes for the Python pipeline, this script extracts the item-level data
 * that the filter compiler needs to generate:
 *   - Unique item highlight rules (Priority 2 zone)
 *   - Exalted base targeting rules (replaces generic "show all exalteds" at high strictness)
 *   - Slot-aware idol affix rules
 *
 * Reads: data/sources/planners/{build_slug}_{phase}.json  (raw, NOT normalized/)
 * Reads: data/mappings/items.json                         (itemType+subType → displayName)
 *
 * Outputs:
 *   data/sources/recommendations/build-recommendations.json
 *   data/sources/recommendations/recommendations-warnings.json
 *
 * CLI:
 *   npx tsx scripts/data/maxroll/extract-build-recommendations.ts
 *   npx tsx scripts/data/maxroll/extract-build-recommendations.ts --only "Abomination Necromancer"
 *   npx tsx scripts/data/maxroll/extract-build-recommendations.ts --verbose
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PLANNERS_DIR        = path.resolve(__dirname, '../../../data/sources/planners');
const ITEMS_MAP_FILE      = path.resolve(__dirname, '../../../data/mappings/items.json');
const RECOMMENDATIONS_DIR = path.resolve(__dirname, '../../../data/sources/recommendations');
const OUTPUT_FILE         = path.join(RECOMMENDATIONS_DIR, 'build-recommendations.json');
const WARNINGS_FILE       = path.join(RECOMMENDATIONS_DIR, 'recommendations-warnings.json');

const EXCLUDE_FILENAMES = new Set(['planner-warnings.json']);

// ---------------------------------------------------------------------------
// Types — raw planner file shape (copied from normalize-planners.ts)
// ---------------------------------------------------------------------------

interface RawAffix {
  id: number;
  tier: number;
  roll: number;
}

interface RawItem {
  slot: string;
  itemType: number;
  subType: number;
  uniqueID: number;
  uniqueName: string | null;
  affixes: RawAffix[];
  sealedAffix: RawAffix | null;
  primordialAffix: RawAffix | null;
  implicits?: number[];
}

interface RawIdol {
  slot: number;
  itemType: number;
  subType: number;
  affixes: RawAffix[];
}

interface RawPlannerFile {
  build_slug: string;
  mastery: string;
  damage_types: string[];
  archetype: string;
  phase: string;
  sourceUrl: string;
  scrapedAt?: string;
  items: Record<string, RawItem>;
  idols: (RawIdol | null)[];
}

// ---------------------------------------------------------------------------
// Types — output shape
// ---------------------------------------------------------------------------

interface UniqueRec {
  uniqueID: number;
  uniqueName: string;
  slot: string;
  phases: string[];
  itemType: number;
  subType: number;
}

interface BaseRec {
  itemType: number;
  subType: number;
  slot: string;
  phases: string[];
  baseName: string | null;
  is_exalted_target: boolean;
}

interface IdolAffixRec {
  affix_id: number;
  slot: number;
  itemType: number;
  subType: number;
  phases: string[];
  max_tier: number;
}

interface BuildRec {
  build_slug: string;
  mastery: string;
  damage_types: string[];
  archetype: string;
  source_url: string;
  uniques: UniqueRec[];
  bases: BaseRec[];
  idol_affixes: IdolAffixRec[];
}

interface BuildRecommendations {
  generated_at: string;
  builds: Record<string, BuildRec>;
}

interface Warnings {
  unknownUniqueIDs: Array<{ uniqueID: number; buildSlug: string; slot: string; phase: string }>;
  unknownBases: Array<{ itemType: number; subType: number; buildSlug: string; slot: string }>;
  totalBuilds: number;
  totalUniques: number;
  totalBases: number;
}

// ---------------------------------------------------------------------------
// Phase normalization (verbatim copy of PHASE_MAP from normalize-planners.ts)
// ---------------------------------------------------------------------------

const PHASE_MAP: Record<string, string> = {
  // Exact matches
  'starter':      'starter',
  'endgame':      'endgame',
  'aspirational': 'aspirational',
  'bis':          'aspirational',
  // Keyword-based
  'campaign':     'starter',
  'leveling':     'starter',
  'early':        'starter',
  'starting':     'starter',
  'empowered':    'endgame',
  'defensive':    'endgame',
  'late':         'endgame',
  'corrupt':      'aspirational',
  'dps':          'aspirational',
  'variant':      'aspirational',
  '2h':           'aspirational',
};

function normalizePhase(rawPhase: string): 'starter' | 'endgame' | 'aspirational' {
  const lower = rawPhase.toLowerCase();

  // Exact match
  if (PHASE_MAP[lower]) return PHASE_MAP[lower] as 'starter' | 'endgame' | 'aspirational';

  // Keyword scan
  for (const [keyword, phase] of Object.entries(PHASE_MAP)) {
    if (lower.includes(keyword)) return phase as 'starter' | 'endgame' | 'aspirational';
  }

  // Aspirational/bis check
  if (lower.includes('aspirational') || lower.includes('bis')) return 'aspirational';

  // Fallback
  return 'endgame';
}

// ---------------------------------------------------------------------------
// Items.json loader — itemType + subType → displayName
// ---------------------------------------------------------------------------

interface ItemsMaps {
  baseMap: Map<number, Map<number, string>>;
  uniqueNameMap: Map<number, string>;
}

function loadItemsMap(raw: string): ItemsMaps {
  const data = JSON.parse(raw) as {
    EquippableItems?: Array<{
      baseTypeID: number;
      subItems?: Array<{
        subTypeID: number;
        displayName?: string;
        name?: string;
        uniquesList?: Array<{ uniqueId: number; displayName?: string; name?: string }>;
      }>;
    }>;
  };

  const baseMap = new Map<number, Map<number, string>>();
  const uniqueNameMap = new Map<number, string>();

  for (const baseType of data.EquippableItems ?? []) {
    const sub = new Map<number, string>();
    for (const item of baseType.subItems ?? []) {
      // Use || not ?? — ?? only falls through on null/undefined, not empty string
      const name = item.displayName || item.name || '';
      if (name) sub.set(item.subTypeID, name);

      // Build uniqueID → unique name map from the nested uniquesList
      for (const unique of item.uniquesList ?? []) {
        const uniqueName = unique.displayName || unique.name || '';
        if (unique.uniqueId && uniqueName) {
          uniqueNameMap.set(unique.uniqueId, uniqueName);
        }
      }
    }
    baseMap.set(baseType.baseTypeID, sub);
  }

  return { baseMap, uniqueNameMap };
}

// ---------------------------------------------------------------------------
// slug normalisation (snake_case — same as normalize-planners.ts toSlug)
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}

// ---------------------------------------------------------------------------
// Phase-aware per-build accumulator helpers
// ---------------------------------------------------------------------------

function addPhase(phases: string[], phase: string): void {
  if (!phases.includes(phase)) phases.push(phase);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Parse CLI args
  const args     = process.argv.slice(2);
  const verbose  = args.includes('--verbose');
  const onlyIdx  = args.indexOf('--only');
  const onlySlug = onlyIdx !== -1 ? args[onlyIdx + 1] ?? null : null;

  console.log('extract-build-recommendations: reading source files...');

  // Load items.json for base name and unique name resolution
  let itemsMap = new Map<number, Map<number, string>>();
  let uniqueNameMap = new Map<number, string>();
  try {
    const itemsRaw = await readFile(ITEMS_MAP_FILE, 'utf-8');
    ({ baseMap: itemsMap, uniqueNameMap } = loadItemsMap(itemsRaw));
  } catch (err) {
    console.error(`Failed to load items map from ${ITEMS_MAP_FILE}: ${err}`);
    process.exit(1);
  }

  // Read all raw planner JSON files from PLANNERS_DIR
  let allFiles: string[] = [];
  try {
    allFiles = await readdir(PLANNERS_DIR);
  } catch {
    console.warn(`No planner source directory found at ${PLANNERS_DIR}. Nothing to process.`);
    process.exit(1);
  }

  const jsonFiles = allFiles.filter(
    f => f.endsWith('.json') && !EXCLUDE_FILENAMES.has(f),
  );

  if (jsonFiles.length === 0) {
    console.warn('No planner JSON files found. Run extract-planner-exports.ts first.');
    process.exit(1);
  }

  // Group files by build_slug
  const buildGroups = new Map<string, Array<{ filename: string; data: RawPlannerFile }>>();

  for (const filename of jsonFiles) {
    let data: RawPlannerFile;
    try {
      const raw = await readFile(path.join(PLANNERS_DIR, filename), 'utf-8');
      data = JSON.parse(raw) as RawPlannerFile;
    } catch (err) {
      console.warn(`  ⚠ Skipping ${filename}: parse error — ${err}`);
      continue;
    }

    if (!data.build_slug) {
      console.warn(`  ⚠ Skipping ${filename}: missing build_slug`);
      continue;
    }

    if (onlySlug && data.build_slug !== onlySlug) continue;

    const group = buildGroups.get(data.build_slug) ?? [];
    group.push({ filename, data });
    buildGroups.set(data.build_slug, group);
  }

  if (buildGroups.size === 0) {
    console.warn(`No builds found${onlySlug ? ` matching "${onlySlug}"` : ''}.`);
    process.exit(1);
  }

  // Accumulate output and warnings
  const outputBuilds: Record<string, BuildRec> = {};
  const warnings: Warnings = {
    unknownUniqueIDs: [],
    unknownBases: [],
    totalBuilds: 0,
    totalUniques: 0,
    totalBases: 0,
  };

  // Process each build
  for (const [buildSlug, files] of buildGroups) {
    console.log(`\n[${buildSlug}] — ${files.length} source file(s)`);

    const firstFile = files[0].data;
    const slug      = toSlug(buildSlug);

    // Per-build accumulators (keyed maps for deduplication)
    const uniqueMap    = new Map<string, UniqueRec>();     // key: uniqueID::slot
    const baseMap      = new Map<string, BaseRec>();       // key: itemType::subType::slot
    const idolAffixMap = new Map<string, IdolAffixRec>();  // key: affix_id::slot::itemType::subType

    // Per-phase counts for console output
    const phaseCounts: Record<string, { uniques: number; bases: number; idols: number }> = {};

    for (const { filename, data } of files) {
      const phase = normalizePhase(data.phase ?? '');

      if (verbose) {
        console.log(`  ${filename}: phase "${data.phase}" → ${phase}`);
      }

      let phaseUniques = 0;
      let phaseBases   = 0;
      let phaseIdols   = 0;

      // ── Step 3: Unique item extraction ────────────────────────────────────
      for (const [slot, item] of Object.entries(data.items ?? {})) {
        if (!item) continue;
        const itemType = item.itemType ?? 0;
        const subType  = item.subType ?? 0;
        const uniqueID = item.uniqueID ?? 0;

        if (itemType === 0) continue; // empty slot

        if (uniqueID > 0) {
          const key = `${uniqueID}::${slot}`;

          // Resolve uniqueName: planner file first, then uniqueNameMap fallback
          // Use || not ?? so empty string falls through to the lookup
          let uniqueName = item.uniqueName || null;
          if (!uniqueName) {
            uniqueName = uniqueNameMap.get(uniqueID) ?? null;
          }
          if (!uniqueName) {
            uniqueName = `Unknown (ID: ${uniqueID})`;
            warnings.unknownUniqueIDs.push({ uniqueID, buildSlug, slot, phase });
            if (verbose) {
              console.log(`    ⚠ Unknown uniqueID ${uniqueID} at slot ${slot}`);
            }
          }

          if (uniqueMap.has(key)) {
            addPhase(uniqueMap.get(key)!.phases, phase);
          } else {
            uniqueMap.set(key, { uniqueID, uniqueName, slot, phases: [phase], itemType, subType });
          }

          phaseUniques++;

          if (verbose) {
            console.log(`    [unique] slot=${slot} uniqueID=${uniqueID} name="${uniqueName}" phase=${phase}`);
          }

        } else {
          // ── Step 4: Base item extraction ──────────────────────────────────
          const key = `${itemType}::${subType}::${slot}`;

          const baseName = itemsMap.get(itemType)?.get(subType) ?? null;
          if (baseName === null) {
            warnings.unknownBases.push({ itemType, subType, buildSlug, slot });
            if (verbose) {
              console.log(`    ⚠ Unknown base itemType=${itemType} subType=${subType} at slot ${slot}`);
            }
          }

          if (baseMap.has(key)) {
            addPhase(baseMap.get(key)!.phases, phase);
          } else {
            baseMap.set(key, {
              itemType, subType, slot,
              phases: [phase],
              baseName,
              is_exalted_target: true,
            });
          }

          phaseBases++;

          if (verbose) {
            console.log(`    [base] slot=${slot} itemType=${itemType} subType=${subType} baseName="${baseName ?? 'unknown'}" phase=${phase}`);
          }
        }
      }

      // ── Step 5: Idol affix extraction ──────────────────────────────────────
      for (const idol of data.idols ?? []) {
        if (!idol) continue;
        const idolItemType = idol.itemType ?? 0;
        if (idolItemType === 0) continue; // empty idol slot

        for (const affix of idol.affixes ?? []) {
          const key = `${affix.id}::${idol.slot}::${idolItemType}::${idol.subType}`;

          if (idolAffixMap.has(key)) {
            const existing = idolAffixMap.get(key)!;
            addPhase(existing.phases, phase);
            existing.max_tier = Math.max(existing.max_tier, affix.tier ?? 0);
          } else {
            idolAffixMap.set(key, {
              affix_id: affix.id,
              slot: idol.slot,
              itemType: idolItemType,
              subType: idol.subType ?? 0,
              phases: [phase],
              max_tier: affix.tier ?? 0,
            });
          }

          phaseIdols++;
        }
      }

      // Record per-phase counts
      const existing = phaseCounts[phase];
      if (existing) {
        existing.uniques += phaseUniques;
        existing.bases   += phaseBases;
        existing.idols   += phaseIdols;
      } else {
        phaseCounts[phase] = { uniques: phaseUniques, bases: phaseBases, idols: phaseIdols };
      }
    }

    // Print per-phase breakdown
    for (const [phase, counts] of Object.entries(phaseCounts)) {
      const label = phase.charAt(0).toUpperCase() + phase.slice(1);
      console.log(
        `  → ${label.padEnd(14)}: ${counts.uniques} uniques, ${counts.bases} bases, ${counts.idols} idol affixes`,
      );
    }

    const mergedUniques    = uniqueMap.size;
    const mergedBases      = baseMap.size;
    const mergedIdolAffixes = idolAffixMap.size;
    console.log(
      `  → Merged        : ${mergedUniques} uniques, ${mergedBases} bases, ${mergedIdolAffixes} idol affixes`,
    );

    outputBuilds[slug] = {
      build_slug:   slug,
      mastery:      (firstFile.mastery ?? '').toLowerCase(),
      damage_types: firstFile.damage_types ?? [],
      archetype:    firstFile.archetype ?? '',
      source_url:   firstFile.sourceUrl ?? '',
      uniques:      Array.from(uniqueMap.values()),
      bases:        Array.from(baseMap.values()),
      idol_affixes: Array.from(idolAffixMap.values()),
    };

    warnings.totalUniques += mergedUniques;
    warnings.totalBases   += mergedBases;
  }

  warnings.totalBuilds = buildGroups.size;

  // Write outputs
  await mkdir(RECOMMENDATIONS_DIR, { recursive: true });

  const output: BuildRecommendations = {
    generated_at: new Date().toISOString(),
    builds: outputBuilds,
  };

  await writeFile(OUTPUT_FILE,   JSON.stringify(output,   null, 2), 'utf-8');
  await writeFile(WARNINGS_FILE, JSON.stringify(warnings, null, 2), 'utf-8');

  // Summary
  const totalIdolAffixes = Object.values(outputBuilds).reduce(
    (sum, b) => sum + b.idol_affixes.length, 0,
  );

  console.log(`\n✓ Processed ${buildGroups.size} build(s)`);
  console.log(`  Uniques:        ${warnings.totalUniques} total recommendations`);
  console.log(`  Bases:          ${warnings.totalBases} total recommendations`);
  console.log(`  Idol affixes:   ${totalIdolAffixes} total recommendations`);

  if (warnings.unknownUniqueIDs.length > 0) {
    console.warn(`  ⚠ ${warnings.unknownUniqueIDs.length} unknown unique ID(s) — see recommendations-warnings.json`);
  }
  if (warnings.unknownBases.length > 0) {
    console.warn(`  ⚠ ${warnings.unknownBases.length} unknown base type(s) — see recommendations-warnings.json`);
  }

  console.log(`  Output: ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('extract-build-recommendations failed:', err);
  process.exit(1);
});
