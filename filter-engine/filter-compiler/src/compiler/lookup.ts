/**
 * lookup.ts — Stage 2
 *
 * lookupKnowledgeProfile() finds the best matching build profile from
 * knowledge-base.json, merges cross-build affix lists, and loads
 * recommendation data (uniques, bases, idols) for the active phase.
 *
 * Matching cascade (6 levels, first non-empty match wins):
 *   1. mastery + ALL damageTypes match          → specificity 1.0
 *   2. mastery + ANY damageType matches          → specificity 0.85
 *   3. mastery only                              → specificity 0.7
 *   4. baseClass only                            → specificity 0.4
 *   5. any build (universal fallback)            → specificity 0.2
 *   6. empty baseline                            → specificity 0.0
 */

import { MASTERY_TO_CLASS } from '../knowledge/game/classes.js';
import type { BuildContext } from '../types/build-context.js';
import type { KnowledgeBase, AffixWeight, BuildEntry } from '../types/knowledge-base.js';
import type { BuildRecommendations, UniqueRec, BaseRec, IdolAffixRec } from '../types/recommendations.js';
import type { ResolvedProfile } from '../types/resolved-profile.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses the damage_type string from knowledge-base.json into an array.
 * knowledge-base uses comma-separated strings, e.g. "physical,necrotic".
 */
function parseDamageTypes(damage_type: string): string[] {
  return damage_type.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

/**
 * Returns true if all of `required` are present in `available`.
 */
function allMatch(required: string[], available: string[]): boolean {
  return required.every(r => available.includes(r));
}

/**
 * Returns true if any of `required` are present in `available`.
 */
function anyMatch(required: string[], available: string[]): boolean {
  return required.some(r => available.includes(r));
}

/**
 * Merges multiple AffixWeight lists, keeping the highest weight per affix_id.
 */
function mergeAffixLists(lists: AffixWeight[][]): AffixWeight[] {
  const map = new Map<number, AffixWeight>();
  for (const list of lists) {
    for (const entry of list) {
      const existing = map.get(entry.id);
      if (!existing || entry.weight > existing.weight) {
        map.set(entry.id, entry);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.weight - a.weight);
}

/**
 * Selects phase affixes with fallback: ctx.phase → endgame → starter.
 */
function selectPhaseAffixes(entry: BuildEntry, phase: string): AffixWeight[] {
  return (
    entry.phases[phase as keyof typeof entry.phases]?.affixes ??
    entry.phases.endgame?.affixes ??
    entry.phases.starter?.affixes ??
    []
  );
}

/**
 * Picks the highest confidence level among a set of builds.
 */
function highestConfidence(
  builds: BuildEntry[]
): 'high' | 'medium' | 'low' {
  if (builds.some(b => b.confidence === 'high')) return 'high';
  if (builds.some(b => b.confidence === 'medium')) return 'medium';
  return 'low';
}

/**
 * Returns the data_source_layer label for a given specificity level.
 */
function dataSourceLayer(level: number): string {
  if (level >= 1.0) return 'specific';
  if (level >= 0.85) return 'specific';
  if (level >= 0.7) return 'mastery';
  if (level >= 0.4) return 'mastery';
  if (level >= 0.2) return 'class';
  return 'baseline';
}

// ---------------------------------------------------------------------------
// Knowledge-base profile matching
// ---------------------------------------------------------------------------

interface CandidateGroup {
  builds: BuildEntry[];
  slugs: string[];
  specificity: number;
}

function matchKnowledgeBase(
  ctx: BuildContext,
  kb: KnowledgeBase
): CandidateGroup {
  const entries = Object.entries(kb.builds);

  // Level 1 — mastery + ALL damage types
  let group = entries.filter(([, b]) => {
    const bdts = parseDamageTypes(b.damage_type);
    return b.mastery === ctx.mastery && allMatch(ctx.damageTypes, bdts);
  });
  if (group.length > 0)
    return { builds: group.map(([, b]) => b), slugs: group.map(([s]) => s), specificity: 1.0 };

  // Level 2 — mastery + ANY damage type
  group = entries.filter(([, b]) => {
    const bdts = parseDamageTypes(b.damage_type);
    return b.mastery === ctx.mastery && anyMatch(ctx.damageTypes, bdts);
  });
  if (group.length > 0)
    return { builds: group.map(([, b]) => b), slugs: group.map(([s]) => s), specificity: 0.85 };

  // Level 3 — mastery only
  group = entries.filter(([, b]) => b.mastery === ctx.mastery);
  if (group.length > 0)
    return { builds: group.map(([, b]) => b), slugs: group.map(([s]) => s), specificity: 0.7 };

  // Level 4 — baseClass only
  const baseClassEntries = entries.filter(([, b]) => {
    const bClass = (MASTERY_TO_CLASS as Record<string, string>)[b.mastery];
    return bClass === ctx.baseClass;
  });
  if (baseClassEntries.length > 0)
    return {
      builds: baseClassEntries.map(([, b]) => b),
      slugs: baseClassEntries.map(([s]) => s),
      specificity: 0.4,
    };

  // Level 5 — any build (broad fallback when class is unknown/generic)
  if (entries.length > 0)
    return { builds: entries.map(([, b]) => b), slugs: entries.map(([s]) => s), specificity: 0.2 };

  // Level 6 — empty baseline
  return { builds: [], slugs: [], specificity: 0.0 };
}

// ---------------------------------------------------------------------------
// Recommendation matching
// ---------------------------------------------------------------------------

function matchRecommendations(
  ctx: BuildContext,
  recs: BuildRecommendations
): { uniques: UniqueRec[]; bases: BaseRec[]; idols: IdolAffixRec[] } {
  const phase = ctx.phase;
  const entries = Object.values(recs.builds);

  // Apply same cascade as knowledge-base but using recommendations fields.
  // Recommendations have damage_types[] (already an array) and archetype string.
  let matched: typeof entries = [];

  // Level 1 — mastery + ALL damage types + archetype
  if (ctx.archetype) {
    matched = entries.filter(b =>
      b.mastery === ctx.mastery &&
      allMatch(ctx.damageTypes, b.damage_types) &&
      b.archetype === ctx.archetype
    );
  }

  // Level 2 — mastery + ANY damage type + archetype
  if (matched.length === 0 && ctx.archetype) {
    matched = entries.filter(b =>
      b.mastery === ctx.mastery &&
      anyMatch(ctx.damageTypes, b.damage_types) &&
      b.archetype === ctx.archetype
    );
  }

  // Level 3 — mastery + ANY damage type
  if (matched.length === 0) {
    matched = entries.filter(b =>
      b.mastery === ctx.mastery && anyMatch(ctx.damageTypes, b.damage_types)
    );
  }

  // Level 4 — mastery only
  if (matched.length === 0) {
    matched = entries.filter(b => b.mastery === ctx.mastery);
  }

  // Level 5 — baseClass
  if (matched.length === 0) {
    matched = entries.filter(b => {
      const bClass = (MASTERY_TO_CLASS as Record<string, string>)[b.mastery];
      return bClass === ctx.baseClass;
    });
  }

  if (matched.length === 0) {
    return { uniques: [], bases: [], idols: [] };
  }

  // Collect items, deduplicating by uniqueID+slot / itemType+subType+slot / affix_id+slot
  const uniqueMap = new Map<string, UniqueRec>();
  const baseMap = new Map<string, BaseRec>();
  const idolMap = new Map<string, IdolAffixRec>();

  for (const rec of matched) {
    for (const u of rec.uniques) {
      if (!u.phases.includes(phase)) continue;
      const key = `${u.uniqueID}::${u.slot}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, u);
    }
    for (const b of rec.bases) {
      if (!b.phases.includes(phase)) continue;
      const key = `${b.itemType}::${b.subType}::${b.slot}`;
      if (!baseMap.has(key)) baseMap.set(key, b);
    }
    for (const idol of rec.idol_affixes) {
      if (!idol.phases.includes(phase)) continue;
      const key = `${idol.affix_id}::${idol.slot}::${idol.itemType}::${idol.subType}`;
      const existing = idolMap.get(key);
      if (!existing || idol.max_tier > existing.max_tier) {
        idolMap.set(key, idol);
      }
    }
  }

  return {
    uniques: Array.from(uniqueMap.values()),
    bases: Array.from(baseMap.values()),
    idols: Array.from(idolMap.values()),
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function lookupKnowledgeProfile(
  ctx: BuildContext,
  kb: KnowledgeBase,
  recs: BuildRecommendations
): ResolvedProfile {
  const { builds, slugs, specificity } = matchKnowledgeBase(ctx, kb);

  // Merge affix lists from all matched builds, phase-selected with fallback
  const affix_lists = builds.map(b => selectPhaseAffixes(b, ctx.phase));
  const phaseAffixes = mergeAffixLists(affix_lists);

  // Confidence: best among matched builds (high > medium > low)
  const confidence =
    builds.length > 0 ? highestConfidence(builds) : 'low';

  // Recommendations
  const { uniques, bases, idols } = matchRecommendations(ctx, recs);

  return {
    specificityScore: specificity,
    dataSourceLayer: dataSourceLayer(specificity),
    confidence,
    phaseAffixes,
    recommendedUniques: uniques,
    recommendedBases: bases,
    idolAffixes: idols,
    matchedBuilds: slugs,
  };
}
