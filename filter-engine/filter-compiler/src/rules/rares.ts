/**
 * rares.ts — Rare item rule generator.
 *
 * Only emits rules at regular (0) and strict (1) strictness.
 * At very-strict+ (order >= 2): returns empty — rare items are not worth
 * stopping for at that progression stage.
 *
 * Emitted rules:
 *  SHOW — rare with 2+ essential build affixes (if any essential affixes exist)
 *  HIDE — all other rares (only at strict; at regular, leveling.ts handles it)
 */

import {
  PRIORITY,
  buildRarityCondition,
  buildAffixCondition,
} from '@filter-site/lib/templates/core/rule-builder.js';
import { getStrictnessConfig, getDefaultStrictness } from '@filter-site/lib/templates/schemas/strictness.js';
import { makeRule } from './_factory.js';
import type { CompiledRule } from '@filter-site/lib/templates/core/types.js';
import type { BuildContext } from '../types/build-context.js';
import type { RuleSchedule } from '../types/resolved-profile.js';

export function generateRareRules(
  ctx: BuildContext,
  schedule: RuleSchedule,
): CompiledRule[] {
  const strictness = getStrictnessConfig(ctx.strictnessId) ?? getDefaultStrictness();

  // Not worth showing at very-strict+ — rares are irrelevant at high progression
  if (strictness.order >= 2) return [];

  const rules: CompiledRule[] = [];

  // SHOW rare with 2+ essential build affixes
  if (schedule.essentialAffixes.length > 0) {
    const essentialIds = schedule.essentialAffixes.map(a => a.id);
    rules.push(
      makeRule(
        'SHOW',
        '[Build] Rare w/ 2+ essential affixes',
        [
          buildRarityCondition(['RARE']),
          buildAffixCondition(essentialIds, 'MORE_OR_EQUAL', 2),
        ],
        { color: 0, emphasized: false, priority: PRIORITY.RARE_WITH_AFFIXES },
      ),
    );
  }

  // At strict: HIDE remaining rares (leveling.ts returns [] for strict,
  // so this HIDE covers all rares not matched by the SHOW rule above)
  if (strictness.order >= 1) {
    rules.push(
      makeRule(
        'HIDE',
        'HIDE Rare (no build match)',
        [buildRarityCondition(['RARE'])],
        { priority: PRIORITY.HIDE_RARE },
      ),
    );
  }

  return rules;
}
