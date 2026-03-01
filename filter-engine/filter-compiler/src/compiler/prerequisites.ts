/**
 * prerequisites.ts — Stage 3a
 *
 * applyPrerequisites() zeroes out affix weights that don't apply to the
 * current build context, based on:
 *  1. PREREQUISITE edges in affix-graph.ts (build-condition gates)
 *  2. class_gated entries in affix-taxonomy.ts (class restriction gates)
 */

import { AFFIX_EDGES } from '../knowledge/game/affix-graph.js';
import { TAXONOMY_BY_ID } from '../knowledge/game/affix-taxonomy.js';
import type { AffixWeight } from '../types/knowledge-base.js';
import type { BuildContext } from '../types/build-context.js';

// ---------------------------------------------------------------------------
// Condition evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluate a PREREQUISITE condition string against the build context.
 * Returns true if the affix is ALLOWED (condition met), false to zero it out.
 * Unknown predicates return true (safe default — never wrongly zero out).
 */
function evaluateCondition(condition: string, ctx: BuildContext): boolean {
  const trimmed = condition.trim();
  if (!trimmed) return true;

  // Handle compound conditions: && (all must be true)
  if (trimmed.includes(' && ')) {
    return trimmed.split(' && ').every(part => evaluateCondition(part, ctx));
  }

  // Handle compound conditions: || (any must be true)
  if (trimmed.includes(' || ')) {
    return trimmed.split(' || ').some(part => evaluateCondition(part, ctx));
  }

  // ── build.attackType === "X" ──────────────────────────────────────────────
  const attackTypeMatch = trimmed.match(/^build\.attackType\s*===\s*"([^"]+)"$/);
  if (attackTypeMatch) {
    return ctx.attackType === attackTypeMatch[1];
  }

  // ── build.weaponType === "X" ──────────────────────────────────────────────
  // Mapped from ctx.attackType — 'bow' archetype uses bow weapon type
  const weaponTypeMatch = trimmed.match(/^build\.weaponType\s*===\s*"([^"]+)"$/);
  if (weaponTypeMatch) {
    const weaponType = weaponTypeMatch[1];
    if (weaponType === 'bow') return ctx.attackType === 'bow';
    // Other weapon types (e.g. "sword") are not tracked in v1 context → safe default
    return true;
  }

  // ── build.damageType === "X" ──────────────────────────────────────────────
  // Note: ctx.damageTypes is an array, so use includes()
  const damageTypeMatch = trimmed.match(/^build\.damageType\s*===\s*"([^"]+)"$/);
  if (damageTypeMatch) {
    return ctx.damageTypes.includes(damageTypeMatch[1]);
  }

  // ── build.usesMinions === true ────────────────────────────────────────────
  if (trimmed === 'build.usesMinions === true') return ctx.usesMinions;
  if (trimmed === 'build.usesMinions === false') return !ctx.usesMinions;

  // ── build.usesShield === true ─────────────────────────────────────────────
  if (trimmed === 'build.usesShield === true') return ctx.usesShield;
  if (trimmed === 'build.usesShield === false') return !ctx.usesShield;

  // ── build.channelling / usesWard / usesTotems ─────────────────────────────
  // Not tracked in v1 BuildContext → safe default (allow the affix)
  if (trimmed.includes('build.channelling')) return true;
  if (trimmed.includes('build.usesWard')) return true;
  if (trimmed.includes('build.usesTotems')) return true;

  // ── Fallback for any unrecognised predicate ───────────────────────────────
  // Do not zero out for unknown conditions — avoids silently hiding valid affixes.
  return true;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Zero out affix weights that don't meet the build's PREREQUISITE conditions
 * or are class-gated to a different base class.
 *
 * Returns a new array; input is not mutated.
 */
export function applyPrerequisites(
  affixes: AffixWeight[],
  ctx: BuildContext,
): AffixWeight[] {
  const zeroSet = new Set<number>();

  // ── 1. PREREQUISITE edges ─────────────────────────────────────────────────
  for (const edge of AFFIX_EDGES) {
    if (edge.type !== 'PREREQUISITE') continue;
    if (!edge.condition) continue; // no condition → unconditional, skip

    if (!evaluateCondition(edge.condition, ctx)) {
      zeroSet.add(edge.from);
    }
  }

  // ── 2. class_gated taxonomy check ────────────────────────────────────────
  for (const affix of affixes) {
    const entry = TAXONOMY_BY_ID.get(affix.id);
    if (!entry) continue;
    if (entry.structuralCategory !== 'class_gated') continue;
    if (!entry.validClasses) continue;

    // validClasses is an array of BaseClass strings
    if (!(entry.validClasses as readonly string[]).includes(ctx.baseClass)) {
      zeroSet.add(affix.id);
    }
  }

  // ── 3. Apply zero-out ─────────────────────────────────────────────────────
  return affixes.map(a =>
    zeroSet.has(a.id) ? { ...a, weight: 0 } : a
  );
}
