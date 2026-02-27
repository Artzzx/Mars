/**
 * normalize-planners.ts — Script 2.5 of 3: Last Epoch Filter Engine Pipeline
 *
 * Sits between the scraper (extract-planner-exports.ts) and the pipeline.
 * Reads all raw per-phase planner JSONs from data/sources/planners/, normalizes
 * phase names and archetypes, flattens affixes (max tier per affix_id across all
 * item slots and idols), merges phase collisions, and writes one consolidated
 * JSON per build.
 *
 * Outputs:
 *   data/sources/planners/normalized/{build_slug}.json  — one per build
 *   data/sources/planners/normalized/normalization-report.json
 *
 * CLI:
 *   npx tsx scripts/data/maxroll/normalize-planners.ts
 *   npx tsx scripts/data/maxroll/normalize-planners.ts --only "Abomination Necromancer"
 *   npx tsx scripts/data/maxroll/normalize-planners.ts --verbose
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLANNERS_DIR   = path.resolve(__dirname, '../../../data/sources/planners');
const NORMALIZED_DIR = path.resolve(__dirname, '../../../data/sources/planners/normalized');
const REPORT_OUT     = path.join(NORMALIZED_DIR, 'normalization-report.json');

// ---------------------------------------------------------------------------
// Types — raw planner file shape
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
  implicits: number[];
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
  build: string;
  phase: string;
  sourceUrl: string;
  scrapedAt: string;
  items: Record<string, RawItem>;
  idols: (RawIdol | null)[];
}

// ---------------------------------------------------------------------------
// Types — normalized output shape
// ---------------------------------------------------------------------------

interface NormalizedAffix {
  affix_id: number;
  tier: number;
}

type NormalizedPhase = 'starter' | 'endgame' | 'aspirational';

interface NormalizedBuild {
  build_slug:   string;
  mastery:      string;
  damage_types: string[];
  archetype:    string;
  phases: {
    starter?:      { affixes: NormalizedAffix[] };
    endgame?:      { affixes: NormalizedAffix[] };
    aspirational?: { affixes: NormalizedAffix[] };
  };
}

// ---------------------------------------------------------------------------
// Types — normalization report
// ---------------------------------------------------------------------------

interface PhaseMapping {
  sourceFile:      string;
  rawPhase:        string;
  normalizedPhase: NormalizedPhase;
  method:          'exact' | 'keyword' | 'aspirational-check' | 'fallback';
}

interface BuildReport {
  phaseMappings:   PhaseMapping[];
  phaseCollisions: string[];
}

interface NormalizationReport {
  processedAt:      string;
  totalBuilds:      number;
  totalSourceFiles: number;
  builds:           Record<string, BuildReport>;
  fallbackMappings: Array<{ sourceFile: string; rawPhase: string; normalizedPhase: string }>;
}

// ---------------------------------------------------------------------------
// Phase normalization
// ---------------------------------------------------------------------------

const PHASE_MAP: Record<string, string> = {
  // Exact matches
  'starter':      'starter',
  'endgame':      'endgame',
  'aspirational': 'aspirational',
  'bis':          'aspirational',
  // Keyword-based (check if phase name CONTAINS these)
  'campaign':     'starter',
  'leveling':     'starter',
  'early':        'starter',
  'starting':     'starter',    // gap fix: 'Starting' / 'Starting Gear' exist in the data
  'empowered':    'endgame',
  'defensive':    'endgame',
  'late':         'endgame',
  'corrupt':      'aspirational',
  'dps':          'aspirational',
  'variant':      'aspirational',
  '2h':           'aspirational',
};

function normalizePhase(rawPhase: string): { phase: NormalizedPhase; method: PhaseMapping['method'] } {
  const lower = rawPhase.toLowerCase();

  // Exact match
  if (PHASE_MAP[lower]) {
    return { phase: PHASE_MAP[lower] as NormalizedPhase, method: 'exact' };
  }

  // Keyword scan
  for (const [keyword, phase] of Object.entries(PHASE_MAP)) {
    if (lower.includes(keyword)) {
      return { phase: phase as NormalizedPhase, method: 'keyword' };
    }
  }

  // Aspirational/bis check (redundant after keyword scan but matches spec)
  if (lower.includes('aspirational') || lower.includes('bis')) {
    return { phase: 'aspirational', method: 'aspirational-check' };
  }

  // Final fallback
  return { phase: 'endgame', method: 'fallback' };
}

// ---------------------------------------------------------------------------
// Archetype normalization
// ---------------------------------------------------------------------------

const ARCHETYPE_MAP: Record<string, string> = {
  'melee':       'melee',
  'spell':       'spell',
  'caster':      'spell',
  'dot':         'dot',
  'damage over': 'dot',
  'minion':      'minion',
  'ranged':      'ranged',
  'bow':         'ranged',
};

function normalizeArchetype(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [keyword, value] of Object.entries(ARCHETYPE_MAP)) {
    if (lower.includes(keyword)) return value;
  }
  return 'spell'; // safe default
}

// ---------------------------------------------------------------------------
// Affix flattening — max tier per affix_id across all slots and idols
// ---------------------------------------------------------------------------

function flattenAffixes(items: Record<string, RawItem>, idols: (RawIdol | null)[]): Map<number, number> {
  const maxTierById = new Map<number, number>();

  // Gear slots
  for (const slot of Object.values(items)) {
    for (const affix of slot.affixes ?? []) {
      const existing = maxTierById.get(affix.id) ?? 0;
      maxTierById.set(affix.id, Math.max(existing, affix.tier));
    }
    // Sealed affix counts too
    if (slot.sealedAffix) {
      const sa = slot.sealedAffix;
      maxTierById.set(sa.id, Math.max(maxTierById.get(sa.id) ?? 0, sa.tier));
    }
  }

  // Idols
  for (const idol of idols ?? []) {
    if (!idol) continue;
    for (const affix of idol.affixes ?? []) {
      const existing = maxTierById.get(affix.id) ?? 0;
      maxTierById.set(affix.id, Math.max(existing, affix.tier));
    }
  }

  return maxTierById;
}

function mergePhaseMaps(existing: Map<number, number>, incoming: Map<number, number>): Map<number, number> {
  const merged = new Map(existing);
  for (const [id, tier] of incoming) {
    merged.set(id, Math.max(merged.get(id) ?? 0, tier));
  }
  return merged;
}

function mapToAffixArray(map: Map<number, number>): NormalizedAffix[] {
  return Array.from(map.entries()).map(([affix_id, tier]) => ({ affix_id, tier }));
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Parse CLI args
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const onlyIdx = args.indexOf('--only');
  const onlySlug = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

  console.log('normalize-planners: reading source files...');

  // Read all planner JSON files
  const allFiles = await readdir(PLANNERS_DIR);
  const jsonFiles = allFiles.filter(
    f => f.endsWith('.json') && f !== 'planner-warnings.json',
  );

  // Group raw files by build_slug
  const buildGroups = new Map<string, Array<{ filename: string; data: RawPlannerFile }>>();

  for (const filename of jsonFiles) {
    const raw = await readFile(path.join(PLANNERS_DIR, filename), 'utf-8');
    const data = JSON.parse(raw) as RawPlannerFile;

    if (onlySlug && data.build_slug !== onlySlug) continue;

    const group = buildGroups.get(data.build_slug) ?? [];
    group.push({ filename, data });
    buildGroups.set(data.build_slug, group);
  }

  if (buildGroups.size === 0) {
    console.warn(`No builds found${onlySlug ? ` matching "${onlySlug}"` : ''}.`);
    process.exit(1);
  }

  await mkdir(NORMALIZED_DIR, { recursive: true });

  // Normalization report accumulators
  const reportBuilds: Record<string, BuildReport> = {};
  const fallbackMappings: NormalizationReport['fallbackMappings'] = [];
  let totalSourceFiles = 0;

  // Process each build
  for (const [buildSlug, files] of buildGroups) {
    totalSourceFiles += files.length;
    console.log(`\n[${buildSlug}] — ${files.length} source file(s)`);

    const phaseMaps = new Map<NormalizedPhase, Map<number, number>>();
    const phaseMappings: PhaseMapping[] = [];
    const phaseCollisions: string[] = [];

    // Track which raw phases mapped to which normalized slot (for collision detection)
    const rawPhasesPerSlot = new Map<NormalizedPhase, string[]>();

    for (const { filename, data } of files) {
      const { phase: normalizedPhase, method } = normalizePhase(data.phase);

      if (verbose) {
        console.log(`  ${filename}: "${data.phase}" → ${normalizedPhase} (${method})`);
      }

      phaseMappings.push({
        sourceFile:      filename,
        rawPhase:        data.phase,
        normalizedPhase,
        method,
      });

      if (method === 'fallback') {
        fallbackMappings.push({ sourceFile: filename, rawPhase: data.phase, normalizedPhase });
        console.warn(`  ⚠ Fallback mapping: "${data.phase}" → ${normalizedPhase} in ${filename}`);
      }

      // Track collisions (multiple raw phases → same normalized slot)
      const existing = rawPhasesPerSlot.get(normalizedPhase) ?? [];
      if (existing.length > 0) {
        phaseCollisions.push(data.phase);
        console.log(`  ↔ Collision: "${data.phase}" merges into existing ${normalizedPhase}`);
      }
      existing.push(data.phase);
      rawPhasesPerSlot.set(normalizedPhase, existing);

      // Flatten affixes for this file
      const incoming = flattenAffixes(data.items, data.idols);

      // Merge into phase accumulator (max tier wins)
      const existingMap = phaseMaps.get(normalizedPhase);
      phaseMaps.set(
        normalizedPhase,
        existingMap ? mergePhaseMaps(existingMap, incoming) : incoming,
      );
    }

    // Build normalized output
    const firstFile = files[0].data;
    const normalizedBuild: NormalizedBuild = {
      build_slug:   buildSlug,
      mastery:      firstFile.mastery,
      damage_types: firstFile.damage_types,
      archetype:    normalizeArchetype(firstFile.archetype),
      phases:       {},
    };

    for (const [phase, affixMap] of phaseMaps) {
      normalizedBuild.phases[phase] = { affixes: mapToAffixArray(affixMap) };
    }

    // Write normalized build file
    const outFilename = `${toSlug(buildSlug)}.json`;
    const outPath = path.join(NORMALIZED_DIR, outFilename);
    await writeFile(outPath, JSON.stringify(normalizedBuild, null, 2), 'utf-8');
    console.log(`  → Saved: ${outFilename} (${Object.keys(normalizedBuild.phases).join(', ')})`);

    reportBuilds[buildSlug] = { phaseMappings, phaseCollisions };
  }

  // Write normalization report
  const report: NormalizationReport = {
    processedAt:      new Date().toISOString(),
    totalBuilds:      buildGroups.size,
    totalSourceFiles,
    builds:           reportBuilds,
    fallbackMappings,
  };

  await writeFile(REPORT_OUT, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n✓ Normalized ${buildGroups.size} build(s) from ${totalSourceFiles} source file(s).`);
  console.log(`  Output: ${NORMALIZED_DIR}`);
  if (fallbackMappings.length > 0) {
    console.warn(`  ⚠ ${fallbackMappings.length} phase(s) used fallback mapping — see normalization-report.json`);
  }
}

main().catch(err => {
  console.error('normalize-planners failed:', err);
  process.exit(1);
});
