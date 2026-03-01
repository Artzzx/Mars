/**
 * leveling.ts — Magic/Normal leveling rule generator.
 *
 * Returns empty array at strict+ (strictness.order >= 1) — players at
 * that point no longer need to pick up white/blue items.
 * Delegates to the existing generator in rule-builder.ts.
 */

import { getStrictnessConfig, getDefaultStrictness } from '@filter-site/lib/templates/schemas/strictness.js';
import { generateLevelingRules as _generateLevelingRules } from '@filter-site/lib/templates/core/rule-builder.js';
import type { CompiledRule } from '@filter-site/lib/templates/core/types.js';
import type { BuildContext } from '../types/build-context.js';

export function generateLevelingRules(ctx: BuildContext): CompiledRule[] {
  const strictness = getStrictnessConfig(ctx.strictnessId) ?? getDefaultStrictness();

  // Leveling rules are irrelevant at strict+
  if (strictness.order >= 1) return [];

  return _generateLevelingRules(strictness);
}
