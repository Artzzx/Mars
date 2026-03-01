/**
 * rules/index.ts — Rule generation orchestrator.
 *
 * generateRules() is the single entry point that maps RuleSchedule sections
 * to their generator functions and collects all CompiledRule objects.
 *
 * Section → generator mapping:
 *   legendary          → generateLegendaryRules()
 *   unique_lp_tiers    → generateUniqueRules(ctx)
 *   threshold_affixes  → generateThresholdRules(ctx)
 *   recommended_uniques→ generateRecommendedUniqueRules(ctx, profile)
 *   exalted            → generateExaltedRules(ctx, schedule, profile)
 *   idol_rules         → generateIdolRules(ctx, profile)
 *   rare_rules         → generateRareRules(ctx, schedule)
 *   leveling_rules     → generateLevelingRules(ctx)
 *   cross_class_show   → generateCrossClassRules(ctx, filteredAffixes)
 *   class_hide         → generateClassHideRules(ctx)
 *
 * Sections registered only for budget accounting
 * (affix_essential, affix_strong, affix_useful) are consumed by
 * generateExaltedRules/generateRareRules via schedule.essentialAffixes etc.
 * They have no dedicated generator entry in this map.
 */

import type { CompiledRule } from '@filter-site/lib/templates/core/types.js';
import type { AffixWeight } from '../types/knowledge-base.js';
import type { BuildContext } from '../types/build-context.js';
import type { ResolvedProfile, RuleSchedule } from '../types/resolved-profile.js';

import { generateLegendaryRules }           from './legendary.js';
import { generateUniqueRules }              from './uniques.js';
import { generateThresholdRules }           from './threshold.js';
import { generateRecommendedUniqueRules }   from './recommended.js';
import { generateExaltedRules }             from './exalted.js';
import { generateIdolRules }                from './idols.js';
import { generateRareRules }                from './rares.js';
import { generateLevelingRules }            from './leveling.js';
import { generateCrossClassRules }          from './crossclass.js';
import { generateClassHideRules }           from './classhide.js';

export function generateRules(
  schedule: RuleSchedule,
  ctx: BuildContext,
  profile: ResolvedProfile,
  filteredAffixes: AffixWeight[],
): CompiledRule[] {
  // Lazy generators keyed by section name
  const generators: Record<string, () => CompiledRule[]> = {
    legendary:           () => generateLegendaryRules(),
    unique_lp_tiers:     () => generateUniqueRules(ctx),
    threshold_affixes:   () => generateThresholdRules(ctx),
    recommended_uniques: () => generateRecommendedUniqueRules(ctx, profile),
    exalted:             () => generateExaltedRules(ctx, schedule, profile),
    idol_rules:          () => generateIdolRules(ctx, profile),
    rare_rules:          () => generateRareRules(ctx, schedule),
    leveling_rules:      () => generateLevelingRules(ctx),
    cross_class_show:    () => generateCrossClassRules(ctx, filteredAffixes),
    class_hide:          () => generateClassHideRules(ctx),
    // affix_essential / affix_strong / affix_useful: consumed internally
  };

  const all: CompiledRule[] = [];

  for (const section of schedule.sections) {
    const gen = generators[section.name];
    if (gen) {
      all.push(...gen());
    }
    // Sections without a generator (affix budget accounting) are silently skipped
  }

  return all;
}

// Re-export individual generators for direct use in tests and step 6
export { generateLegendaryRules }         from './legendary.js';
export { generateUniqueRules }            from './uniques.js';
export { generateThresholdRules }         from './threshold.js';
export { generateRecommendedUniqueRules, generateBaseRules } from './recommended.js';
export { generateExaltedRules }           from './exalted.js';
export { generateIdolRules }              from './idols.js';
export { generateRareRules }              from './rares.js';
export { generateLevelingRules }          from './leveling.js';
export { generateCrossClassRules }        from './crossclass.js';
export { generateClassHideRules }         from './classhide.js';
