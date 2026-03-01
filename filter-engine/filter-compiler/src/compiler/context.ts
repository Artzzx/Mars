/**
 * context.ts — Stage 1
 *
 * resolveContext() converts raw user form input into a validated, enriched
 * BuildContext that is passed through all subsequent pipeline stages.
 */

import { MASTERY_TO_CLASS } from '../knowledge/game/classes.js';
import type { UserInput, BuildContext, Phase, Archetype } from '../types/build-context.js';

// ---------------------------------------------------------------------------
// Mapping tables
// ---------------------------------------------------------------------------

const PROGRESS_TO_PHASE: Record<string, Phase> = {
  campaign:           'starter',
  early_monolith:     'endgame',
  empowered_monolith: 'endgame',
  high_corruption:    'aspirational',
};

// Recommended strictness per progress level.
// Applied when the user left the default ('regular') — lets progress drive strictness.
const PROGRESS_TO_STRICTNESS: Record<string, string> = {
  campaign:           'regular',
  early_monolith:     'strict',
  empowered_monolith: 'very-strict',
  high_corruption:    'uber-strict',
};

const ARCHETYPE_TO_ATTACK: Record<string, 'melee' | 'spell' | 'bow'> = {
  melee:  'melee',
  spell:  'spell',
  dot:    'spell',
  minion: 'spell',
  ranged: 'bow',
};

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export function resolveContext(input: UserInput): BuildContext {
  const mastery = input.mastery.toLowerCase().trim();

  // ── Derive baseClass ───────────────────────────────────────────────────────
  const baseClass = (MASTERY_TO_CLASS as Record<string, string>)[mastery];
  if (!baseClass) {
    const valid = Object.keys(MASTERY_TO_CLASS).join(', ');
    throw new Error(
      `[filter-compiler] Unknown mastery: "${mastery}". Valid masteries: ${valid}`
    );
  }

  // ── Derive phase ───────────────────────────────────────────────────────────
  const phase = PROGRESS_TO_PHASE[input.gameProgress] ?? 'endgame';

  // ── Derive strictness ──────────────────────────────────────────────────────
  // If the user left the app default ('regular'), apply the progress-based
  // recommendation so high-corruption players aren't shown everything.
  const strictnessId =
    input.strictnessId === 'regular'
      ? (PROGRESS_TO_STRICTNESS[input.gameProgress] ?? 'regular')
      : input.strictnessId;

  // ── Derive attack type + minion flag ───────────────────────────────────────
  const archetype: Archetype | null = input.archetype;
  const attackType = archetype ? (ARCHETYPE_TO_ATTACK[archetype] ?? null) : null;
  const usesMinions = archetype === 'minion';

  return {
    mastery,
    damageTypes: input.damageTypes.map(d => d.toLowerCase().trim()),
    phase,
    archetype,
    attackType,
    usesMinions,
    usesShield: false,  // v1: not yet exposed in UI
    strictnessId,
    resistancesCapped: input.resistancesCapped,
    showCrossClassItems: input.showCrossClassItems,
    crossClassWeightThreshold: input.crossClassWeightThreshold,
    baseClass,
  };
}
