/**
 * budget.ts — Stage 4
 *
 * allocateRuleBudget() decides how many rules each section of the filter
 * is allowed to emit, respecting MAX_RULES = 75.
 *
 * Sections are filled in priority order:
 *   1. Fixed structural sections (legendary, unique LP tiers, threshold, ...)
 *   2. Affix weight tiers (essential ≥75 → strong 50-74 → useful 25-49)
 *   Filler affixes (weight 1-24) are always excluded.
 */

import { getStrictnessConfig, getDefaultStrictness } from '@filter-site/lib/templates/schemas/strictness.js';
import { THRESHOLD_AFFIXES } from '../knowledge/game/threshold-affixes.js';
import type { AffixWeight } from '../types/knowledge-base.js';
import type { ResolvedProfile, RuleSection, RuleSchedule } from '../types/resolved-profile.js';
import type { BuildContext } from '../types/build-context.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RULES = 75;

// Rules consumed by each affix weight tier per rarity that a generator touches.
// Each tier → up to 2 rules (one SHOW on exalted, one SHOW on rare).
// This is a conservative estimate used for budget accounting only.
const RULES_PER_AFFIX_TIER = 2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countThresholdSections(ctx: BuildContext): number {
  if (ctx.resistancesCapped || ctx.phase === 'aspirational') return 0;

  const seen = new Set<string>();
  for (const affix of THRESHOLD_AFFIXES) {
    if (affix.relevantPhases.includes(ctx.phase)) {
      seen.add(affix.toggleKey);
    }
  }
  return seen.size; // one rule per unique toggleKey group
}

function countIdolSections(profile: ResolvedProfile, ctx: BuildContext): number {
  const seen = new Set<string>();
  for (const idol of profile.idolAffixes) {
    if (idol.phases.includes(ctx.phase)) {
      seen.add(`${idol.itemType}::${idol.subType}`);
    }
  }
  return Math.min(seen.size, 6);
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export function allocateRuleBudget(
  ctx: BuildContext,
  profile: ResolvedProfile,
  filteredAffixes: AffixWeight[],
): RuleSchedule {
  const strictness = getStrictnessConfig(ctx.strictnessId) ?? getDefaultStrictness();

  const sections: RuleSection[] = [];
  let budgetUsed = 0;

  function reserve(name: string, priority: number, count: number): void {
    if (count <= 0) return;
    sections.push({ name, priority, estimatedRules: count });
    budgetUsed += count;
  }

  // ── 1. Legendary ───────────────────────────────────────────────────────────
  reserve('legendary', 10, 1);

  // ── 2. Unique LP tiers ────────────────────────────────────────────────────
  // regular(0)→5 rules, strict(1)→4, very-strict(2)→3, uber-strict(3)→2, giga-strict(4)→1
  const uniqueLpRules = Math.max(1, 5 - strictness.minLegendaryPotential);
  reserve('unique_lp_tiers', 20, uniqueLpRules);

  // ── 3. Threshold affixes (resistances) ────────────────────────────────────
  const thresholdCount = countThresholdSections(ctx);
  reserve('threshold_affixes', 45, thresholdCount);

  // ── 4. Recommended uniques ────────────────────────────────────────────────
  const recommendedUniqueCount = Math.min(
    profile.recommendedUniques.filter(u => u.phases.includes(ctx.phase)).length,
    6,
  );
  reserve('recommended_uniques', 48, recommendedUniqueCount);

  // ── 5. Exalted section ────────────────────────────────────────────────────
  // 1 SHOW rule (build-specific affixes on exalted) + 0-1 HIDE (low-tier)
  // + one SHOW per recommended base (capped at 6)
  const exaltedBuildShow = 1;
  const exaltedHide = strictness.order >= 1 ? 1 : 0; // strict+ hides low-tier exalted
  const recommendedBaseCount = Math.min(
    profile.recommendedBases.filter(b => b.phases.includes(ctx.phase)).length,
    6,
  );
  const exaltedTotal = Math.min(exaltedBuildShow + exaltedHide + recommendedBaseCount, 8);
  reserve('exalted', 50, exaltedTotal);

  // ── 6. Idol rules ─────────────────────────────────────────────────────────
  const idolCount = countIdolSections(profile, ctx);
  reserve('idol_rules', 60, idolCount);

  // ── 7. Rare rules ─────────────────────────────────────────────────────────
  // 0 if very-strict or stricter (order >= 2); else 1 SHOW + 1 HIDE = 2
  const rareRules = strictness.showRaresWithAffixes ? 2 : 0;
  reserve('rare_rules', 100, rareRules);

  // ── 8. Leveling rules ─────────────────────────────────────────────────────
  // 0 if strict+ (order >= 1); else ~4 rules (normal/magic/rare leveling + hide)
  const levelingRules = strictness.order >= 1 ? 0 : 4;
  reserve('leveling_rules', 105, levelingRules);

  // ── 9. Cross-class show / class hide ──────────────────────────────────────
  if (ctx.showCrossClassItems) {
    reserve('cross_class_show', 150, 1);
  } else {
    reserve('class_hide', 300, 1);
  }

  // ── 10. Affix weight tiers (remaining budget) ─────────────────────────────
  const remaining = MAX_RULES - budgetUsed;

  // Separate affixes into weight buckets (only weight > 0 considered)
  const essential = filteredAffixes.filter(a => a.weight >= 75);
  const strong    = filteredAffixes.filter(a => a.weight >= 50 && a.weight < 75);
  const useful    = filteredAffixes.filter(a => a.weight >= 25 && a.weight < 50);
  const filler    = filteredAffixes.filter(a => a.weight > 0  && a.weight < 25);

  let affixBudget = remaining;
  let essentialAffixes: AffixWeight[] = [];
  let strongAffixes: AffixWeight[] = [];
  let usefulAffixes: AffixWeight[] = [];

  // Include each tier only if it fits in the remaining affix budget
  if (essential.length > 0 && affixBudget >= RULES_PER_AFFIX_TIER) {
    essentialAffixes = essential;
    reserve('affix_essential', 55, RULES_PER_AFFIX_TIER);
    affixBudget -= RULES_PER_AFFIX_TIER;
  }

  if (strong.length > 0 && affixBudget >= RULES_PER_AFFIX_TIER) {
    strongAffixes = strong;
    reserve('affix_strong', 70, RULES_PER_AFFIX_TIER);
    affixBudget -= RULES_PER_AFFIX_TIER;
  }

  if (useful.length > 0 && affixBudget >= RULES_PER_AFFIX_TIER) {
    usefulAffixes = useful;
    reserve('affix_useful', 80, RULES_PER_AFFIX_TIER);
    // affixBudget -= RULES_PER_AFFIX_TIER; // not needed after this
  }

  // ── Accounting ────────────────────────────────────────────────────────────
  const affixesIncluded =
    essentialAffixes.length + strongAffixes.length + usefulAffixes.length;

  // Dropped = filler (never shown) + any essential/strong/useful that didn't fit
  const droppedEssential = essentialAffixes.length === 0 ? essential.length : 0;
  const droppedStrong    = strongAffixes.length    === 0 ? strong.length    : 0;
  const droppedUseful    = usefulAffixes.length    === 0 ? useful.length    : 0;
  const affixesDropped   = filler.length + droppedEssential + droppedStrong + droppedUseful;

  return {
    sections,
    totalEstimated: budgetUsed,
    budgetUsed,
    affixesIncluded,
    affixesDropped,
    essentialAffixes,
    strongAffixes,
    usefulAffixes,
  };
}
