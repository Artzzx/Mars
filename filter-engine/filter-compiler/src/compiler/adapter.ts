// Converts CompiledRule (filter-site template engine internal type)
// to Rule (filter-site/filters/types.ts serializable type).
//
// CompiledRule is produced by the existing rule generators in rule-builder.ts.
// Rule is what ItemFilter.rules[] expects, and what generateXML() serializes.

import type { Rule, Condition } from '@filter-site/lib/filters/types';
import type { CompiledRule } from '@filter-site/lib/templates/core/types';

export function compiledToRule(cr: CompiledRule): Rule {
  return {
    id: cr.id,
    type: cr.type,
    // CompiledCondition is structurally compatible with Condition
    // (both are discriminated unions on the `type` field)
    conditions: cr.conditions as unknown as Condition[],
    color: cr.color,
    isEnabled: cr.isEnabled,
    emphasized: cr.emphasized,
    nameOverride: cr.name,
    soundId: cr.soundId,
    beamId: cr.beamId,
    order: cr.order,
  };
}

export function compiledToRules(crs: CompiledRule[]): Rule[] {
  return crs.map(compiledToRule);
}
