/**
 * uniques.ts — Unique item LP-tiered rule generator.
 *
 * LP thresholds by strictness:
 *   regular:     show 0LP+  (5 SHOW rules)
 *   strict:      show 1LP+, hide 0LP
 *   very-strict: show 2LP+, hide 0-1LP
 *   uber-strict: show 3LP+, hide 0-2LP
 *   giga-strict: show 4LP+, hide 0-3LP
 *
 * Delegates to the existing generator in rule-builder.ts.
 */

import { getStrictnessConfig, getDefaultStrictness } from '@filter-site/lib/templates/schemas/strictness.js';
import { generateUniqueRules as _generateUniqueRules } from '@filter-site/lib/templates/core/rule-builder.js';
import type { CompiledRule } from '@filter-site/lib/templates/core/types.js';
import type { BuildContext } from '../types/build-context.js';

export function generateUniqueRules(ctx: BuildContext): CompiledRule[] {
  const strictness = getStrictnessConfig(ctx.strictnessId) ?? getDefaultStrictness();
  return _generateUniqueRules(strictness);
}
