/**
 * _factory.ts — Internal rule factory for filter-compiler generators.
 *
 * Mirrors the private createRule() in rule-builder.ts so that the
 * filter-compiler generators don't depend on unexported internals.
 * Not part of the public API — prefixed _ to signal package-private.
 */

import type { CompiledRule, CompiledCondition } from '@filter-site/lib/templates/core/types.js';
import type { RuleType } from '@filter-site/lib/filters/types.js';

let _counter = 0;

export interface RuleOptions {
  color?: number;
  emphasized?: boolean;
  sound?: number;
  beam?: number;
  priority?: number;
}

export function makeRule(
  type: RuleType,
  name: string,
  conditions: CompiledCondition[],
  options: RuleOptions = {},
): CompiledRule {
  const id = ++_counter;
  return {
    id: `fc-${id}-${Date.now()}`,
    name,
    type,
    conditions,
    color: options.color ?? 0,
    isEnabled: true,
    emphasized: options.emphasized ?? false,
    soundId: options.sound ?? 0,
    beamId: options.beam ?? 0,
    order: options.priority ?? id * 10,
    source: { templateId: 'filter-compiler', sectionId: '', ruleId: '' },
  };
}
