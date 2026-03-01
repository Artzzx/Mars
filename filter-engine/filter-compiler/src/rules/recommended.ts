/**
 * recommended.ts — Build recommendation rule generators.
 *
 * Generates SHOW rules for:
 *  - Specific unique items identified in build-recommendations.json
 *  - Specific exalted bases flagged as is_exalted_target
 *
 * Rules are filtered to the active game phase before emission.
 */

import {
  PRIORITY,
  buildRarityCondition,
  buildEquipmentCondition,
} from '@filter-site/lib/templates/core/rule-builder.js';
import { makeRule } from './_factory.js';
import type { CompiledRule } from '@filter-site/lib/templates/core/types.js';
import type { BuildContext } from '../types/build-context.js';
import type { ResolvedProfile } from '../types/resolved-profile.js';

// ---------------------------------------------------------------------------
// Unique item rules
// ---------------------------------------------------------------------------

/**
 * One SHOW rule per recommended unique item for the active phase.
 * Placed just above BUILD_EXALTED_WEAPON so specific uniques are always shown.
 */
export function generateRecommendedUniqueRules(
  ctx: BuildContext,
  profile: ResolvedProfile,
): CompiledRule[] {
  const rules: CompiledRule[] = [];

  for (const rec of profile.recommendedUniques) {
    if (!rec.phases.includes(ctx.phase)) continue;

    const name = rec.uniqueName || `Unique (ID ${rec.uniqueID})`;

    rules.push(
      makeRule(
        'SHOW',
        `[Build] ${name} (Unique)`,
        [
          buildEquipmentCondition([], [rec.subType]),
          buildRarityCondition(['UNIQUE'], { minLP: 0 }),
        ],
        { color: 5, emphasized: true, sound: 6, beam: 4, priority: PRIORITY.RECOMMENDED_UNIQUE },
      ),
    );
  }

  return rules;
}

// ---------------------------------------------------------------------------
// Exalted base rules
// ---------------------------------------------------------------------------

/**
 * One SHOW rule per recommended exalted base for the active phase.
 * Only emits rules for entries where is_exalted_target is true.
 */
export function generateBaseRules(
  ctx: BuildContext,
  profile: ResolvedProfile,
): CompiledRule[] {
  const rules: CompiledRule[] = [];

  for (const rec of profile.recommendedBases) {
    if (!rec.phases.includes(ctx.phase)) continue;
    if (!rec.is_exalted_target) continue;

    const name = rec.baseName || `Base (Type ${rec.itemType}/${rec.subType})`;

    rules.push(
      makeRule(
        'SHOW',
        `[Build] ${name} (Exalted)`,
        [
          buildEquipmentCondition([], [rec.subType]),
          buildRarityCondition(['EXALTED']),
        ],
        { color: 14, emphasized: true, sound: 2, beam: 2, priority: PRIORITY.BUILD_EXALTED_BASE },
      ),
    );
  }

  return rules;
}
