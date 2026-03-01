/**
 * idols.ts — Build-specific idol rule generator.
 *
 * Groups idol affixes from the recommendation data by itemType+subType (idol
 * size/slot). Emits one SHOW rule per group: a SubType condition targeting
 * that idol size, plus an AffixCondition requiring at least one valued affix.
 *
 * A generic catch-all SHOW rule (IDOL_GENERIC) is always appended so idols
 * not matched by specific affix rules remain visible.
 */

import {
  PRIORITY,
  buildEquipmentCondition,
  buildAffixCondition,
} from '@filter-site/lib/templates/core/rule-builder.js';
import { makeRule } from './_factory.js';
import type { CompiledRule } from '@filter-site/lib/templates/core/types.js';
import type { EquipmentType } from '@filter-site/lib/filters/types.js';
import type { BuildContext } from '../types/build-context.js';
import type { ResolvedProfile } from '../types/resolved-profile.js';

// All idol equipment types for the generic catch-all rule
const ALL_IDOLS: EquipmentType[] = [
  'IDOL_1x1_ETERRA',
  'IDOL_1x1_LAGON',
  'IDOL_1x2',
  'IDOL_2x1',
  'IDOL_1x3',
  'IDOL_3x1',
  'IDOL_1x4',
  'IDOL_4x1',
  'IDOL_2x2',
];

export function generateIdolRules(
  ctx: BuildContext,
  profile: ResolvedProfile,
): CompiledRule[] {
  const rules: CompiledRule[] = [];

  // ── Build-specific idol SHOW rules ────────────────────────────────────────
  // Group idol affixes by idol size/type (itemType::subType key)
  const groups = new Map<string, { subType: number; affixIds: number[] }>();

  for (const rec of profile.idolAffixes) {
    if (!rec.phases.includes(ctx.phase)) continue;

    const key = `${rec.itemType}::${rec.subType}`;
    const existing = groups.get(key);
    if (existing) {
      existing.affixIds.push(rec.affix_id);
    } else {
      groups.set(key, { subType: rec.subType, affixIds: [rec.affix_id] });
    }
  }

  let offset = 0;
  for (const { subType, affixIds } of groups.values()) {
    const conditions = [
      buildAffixCondition(affixIds, 'ANY', 1),
    ];

    // SubTypeCondition to restrict to this specific idol size (if subType > 0)
    if (subType > 0) {
      // Prepend so equipment filter is checked first
      conditions.unshift(buildEquipmentCondition([], [subType]));
    }

    rules.push(
      makeRule(
        'SHOW',
        `[Build] Idol w/ valued affix`,
        conditions,
        { color: 8, emphasized: true, sound: 1, beam: 1, priority: PRIORITY.BUILD_IDOL + offset },
      ),
    );
    offset++;
  }

  // ── Generic idol catch-all ────────────────────────────────────────────────
  // Always show idols not matched by specific affix rules above.
  rules.push(
    makeRule(
      'SHOW',
      'Idol',
      [buildEquipmentCondition(ALL_IDOLS)],
      { priority: PRIORITY.IDOL_GENERIC },
    ),
  );

  return rules;
}
