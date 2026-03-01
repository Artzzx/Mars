/**
 * classhide.ts — Class-based item hide rule generator.
 *
 * Only emitted when ctx.showCrossClassItems === false.
 * Hides all items that drop only for other base classes.
 *
 * Maps ctx.baseClass (lowercase BaseClass) to the filter engine's
 * CharacterClass (title-case), then delegates to the existing
 * generateClassHideRules() which computes the complement set.
 */

import { generateClassHideRules as _generateClassHideRules } from '@filter-site/lib/templates/core/rule-builder.js';
import type { CharacterClass } from '@filter-site/lib/filters/types.js';
import type { CompiledRule } from '@filter-site/lib/templates/core/types.js';
import type { BuildContext } from '../types/build-context.js';

// BaseClass (lowercase) → CharacterClass (title-case used by the filter engine)
const BASE_TO_CHARACTER_CLASS: Record<string, CharacterClass> = {
  primalist: 'Primalist',
  mage:      'Mage',
  sentinel:  'Sentinel',
  rogue:     'Rogue',
  acolyte:   'Acolyte',
};

export function generateClassHideRules(ctx: BuildContext): CompiledRule[] {
  if (ctx.showCrossClassItems) return [];

  const characterClass = BASE_TO_CHARACTER_CLASS[ctx.baseClass];
  if (!characterClass) {
    // Unknown base class — skip hiding to avoid hiding valid items
    console.warn(`[classhide] Unknown baseClass: ${ctx.baseClass}, skipping class hide.`);
    return [];
  }

  // generateClassHideRules hides every class NOT in selectedClasses
  return _generateClassHideRules([characterClass]);
}
