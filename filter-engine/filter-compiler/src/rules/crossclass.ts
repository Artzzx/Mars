/**
 * crossclass.ts — Cross-class affix SHOW rule generator.
 *
 * Only emitted when ctx.showCrossClassItems === true.
 * Shows items from other classes that have high-weight affixes for this
 * build, so the player can still pick them up for rerolling or trading.
 *
 * Uses filteredAffixes (post-prerequisites) so affixes already zeroed for
 * this build are not erroneously included in the cross-class highlight.
 */

import { PRIORITY, buildAffixCondition } from '@filter-site/lib/templates/core/rule-builder.js';
import { makeRule } from './_factory.js';
import type { CompiledRule } from '@filter-site/lib/templates/core/types.js';
import type { AffixWeight } from '../types/knowledge-base.js';
import type { BuildContext } from '../types/build-context.js';

export function generateCrossClassRules(
  ctx: BuildContext,
  filteredAffixes: AffixWeight[],
): CompiledRule[] {
  if (!ctx.showCrossClassItems) return [];

  // Only include affixes at or above the user-defined threshold
  const highWeightIds = filteredAffixes
    .filter(a => a.weight >= ctx.crossClassWeightThreshold)
    .map(a => a.id);

  if (highWeightIds.length === 0) return [];

  return [
    makeRule(
      'SHOW',
      '[Cross-Class] Strong Affixes',
      [buildAffixCondition(highWeightIds, 'ANY', 1)],
      { color: 0, emphasized: false, priority: PRIORITY.CROSS_CLASS_AFFIX },
    ),
  ];
}
