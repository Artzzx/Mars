/**
 * exalted.ts — Exalted item rule generator.
 *
 * Emits rules in this order (all at lower priority numbers = higher in filter):
 *  1. Build-specific SHOW  — essential affixes on EXALTED rarity
 *  2. Recommended base SHOW — specific bases flagged as exalted targets
 *  3. Generic SHOW or HIDE  — catch-all for remaining exalted items
 *     - regular: generic SHOW (player still wants to see all exalted)
 *     - strict+:  generic HIDE (only specifically matched exalted are shown)
 */

import {
  PRIORITY,
  buildRarityCondition,
  buildAffixCondition,
} from '@filter-site/lib/templates/core/rule-builder.js';
import { getStrictnessConfig, getDefaultStrictness } from '@filter-site/lib/templates/schemas/strictness.js';
import { makeRule } from './_factory.js';
import { generateBaseRules } from './recommended.js';
import type { CompiledRule } from '@filter-site/lib/templates/core/types.js';
import type { BuildContext } from '../types/build-context.js';
import type { ResolvedProfile } from '../types/resolved-profile.js';
import type { RuleSchedule } from '../types/resolved-profile.js';

export function generateExaltedRules(
  ctx: BuildContext,
  schedule: RuleSchedule,
  profile: ResolvedProfile,
): CompiledRule[] {
  const strictness = getStrictnessConfig(ctx.strictnessId) ?? getDefaultStrictness();
  const rules: CompiledRule[] = [];

  // ── 1. Build-specific SHOW (essential affixes on EXALTED) ─────────────────
  if (schedule.essentialAffixes.length > 0) {
    const essentialIds = schedule.essentialAffixes.map(a => a.id);
    rules.push(
      makeRule(
        'SHOW',
        '[Build] Exalted w/ essential affix',
        [
          buildRarityCondition(['EXALTED']),
          buildAffixCondition(essentialIds, 'ANY', 1),
        ],
        { color: 14, emphasized: true, sound: 2, beam: 2, priority: PRIORITY.BUILD_EXALTED_WEAPON },
      ),
    );
  }

  // ── 2. Recommended exalted bases ──────────────────────────────────────────
  rules.push(...generateBaseRules(ctx, profile));

  // ── 3. Generic catch-all ──────────────────────────────────────────────────
  if (strictness.order === 0) {
    // regular: show all exalted that didn't match specific rules above
    rules.push(
      makeRule(
        'SHOW',
        'Exalted',
        [buildRarityCondition(['EXALTED'])],
        { color: 14, emphasized: false, sound: 2, beam: 1, priority: PRIORITY.EXALTED_GENERIC },
      ),
    );
  } else {
    // strict+: hide exalted items not highlighted by specific rules
    rules.push(
      makeRule(
        'HIDE',
        'HIDE Exalted (no build match)',
        [buildRarityCondition(['EXALTED'])],
        { priority: PRIORITY.HIDE_EXALTED },
      ),
    );
  }

  return rules;
}
