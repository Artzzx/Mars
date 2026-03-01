#!/usr/bin/env tsx
/**
 * cli.ts — Command-line interface for the filter compiler.
 *
 * Usage:
 *   npx tsx src/cli.ts --mastery necromancer [options]
 *   npm run cli -- --mastery sorcerer --progress high_corruption
 *
 * Options:
 *   --mastery <name>            Mastery name, e.g. necromancer, sorcerer (required)
 *   --damage-types <a,b,...>    Comma-separated damage types (default: none)
 *   --progress <stage>          Game progress stage (default: empowered_monolith)
 *                                 campaign | early_monolith | empowered_monolith | high_corruption
 *   --archetype <type>          Build archetype (default: none)
 *                                 melee | spell | dot | minion | ranged
 *   --strictness <id>           Override strictness (default: derived from progress)
 *                                 regular | strict | very-strict | uber-strict | giga-strict
 *   --resistances-capped        Flag: skip threshold resistance rules
 *   --show-cross-class          Flag: show high-weight affixes from other classes
 *   --cross-class-threshold <n> Minimum weight for cross-class affixes (default: 75)
 *   --output <path>             Write XML to file instead of stdout
 *   --meta                      Print compile metadata to stderr as JSON
 *   --help                      Print this help message
 */

import { writeFileSync } from 'node:fs';
import { compileFilterFull } from './compiler/index.js';
import type { UserInput, GameProgress, Archetype } from './types/build-context.js';

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[name] = true; // boolean flag
    } else {
      args[name] = next;
      i++;
    }
  }
  return args;
}

const HELP = `
Usage: tsx src/cli.ts --mastery <name> [options]

Options:
  --mastery <name>            Mastery name (required)
  --damage-types <a,b,...>    Comma-separated damage types
  --progress <stage>          Game progress (default: empowered_monolith)
  --archetype <type>          Build archetype
  --strictness <id>           Override strictness
  --resistances-capped        Skip threshold resistance rules
  --show-cross-class          Show high-weight cross-class affixes
  --cross-class-threshold <n> Cross-class weight threshold (default: 75)
  --output <path>             Write XML to file (default: stdout)
  --meta                      Print metadata JSON to stderr
  --help                      Show this help

Progress values: campaign | early_monolith | empowered_monolith | high_corruption
Archetype values: melee | spell | dot | minion | ranged
Strictness values: regular | strict | very-strict | uber-strict | giga-strict
`.trim();

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const VALID_PROGRESS = new Set(['campaign', 'early_monolith', 'empowered_monolith', 'high_corruption']);
const VALID_ARCHETYPE = new Set(['melee', 'spell', 'dot', 'minion', 'ranged']);
const VALID_STRICTNESS = new Set(['regular', 'strict', 'very-strict', 'uber-strict', 'giga-strict']);

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args['help']) {
    console.log(HELP);
    process.exit(0);
  }

  const mastery = args['mastery'];
  if (!mastery || typeof mastery !== 'string') {
    console.error('Error: --mastery is required.');
    console.error('Run with --help for usage.');
    process.exit(1);
  }

  const progressRaw = (args['progress'] as string | undefined) ?? 'empowered_monolith';
  if (!VALID_PROGRESS.has(progressRaw)) {
    console.error(`Error: invalid --progress "${progressRaw}". Valid: ${[...VALID_PROGRESS].join(', ')}`);
    process.exit(1);
  }
  const gameProgress = progressRaw as GameProgress;

  const archetypeRaw = args['archetype'] as string | undefined;
  if (archetypeRaw && !VALID_ARCHETYPE.has(archetypeRaw)) {
    console.error(`Error: invalid --archetype "${archetypeRaw}". Valid: ${[...VALID_ARCHETYPE].join(', ')}`);
    process.exit(1);
  }
  const archetype = (archetypeRaw as Archetype | undefined) ?? null;

  const strictnessRaw = args['strictness'] as string | undefined;
  if (strictnessRaw && !VALID_STRICTNESS.has(strictnessRaw)) {
    console.error(`Error: invalid --strictness "${strictnessRaw}". Valid: ${[...VALID_STRICTNESS].join(', ')}`);
    process.exit(1);
  }
  const strictnessId = strictnessRaw ?? 'regular';

  const damageTypesRaw = args['damage-types'] as string | undefined;
  const damageTypes = damageTypesRaw
    ? damageTypesRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const crossClassThreshold = Number(args['cross-class-threshold'] ?? 75);

  const input: UserInput = {
    mastery,
    damageTypes,
    gameProgress,
    archetype,
    strictnessId,
    resistancesCapped:      args['resistances-capped'] === true,
    showCrossClassItems:    args['show-cross-class'] === true,
    crossClassWeightThreshold: isNaN(crossClassThreshold) ? 75 : crossClassThreshold,
  };

  let result;
  try {
    result = compileFilterFull(input);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Compilation error: ${msg}`);
    process.exit(1);
  }

  // Write XML output
  const outputPath = args['output'] as string | undefined;
  if (outputPath) {
    writeFileSync(outputPath, result.xml, 'utf8');
    console.error(`Filter written to ${outputPath}`);
  } else {
    process.stdout.write(result.xml);
  }

  // Optional metadata to stderr
  if (args['meta']) {
    const meta = {
      filterName:      result.filter.name,
      rulesGenerated:  result.rulesGenerated,
      affixesDropped:  result.affixesDropped,
      specificityScore: result.specificityScore,
      confidence:      result.confidence,
      matchedBuilds:   result.matchedBuilds,
    };
    process.stderr.write('\n--- meta ---\n' + JSON.stringify(meta, null, 2) + '\n');
  }
}

main();
