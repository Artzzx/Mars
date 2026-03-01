/**
 * threshold.ts — Resistance / threshold affix rule generator.
 *
 * Emits one SHOW rule per toggleKey group of THRESHOLD_AFFIXES, so players
 * can stop picking up resistance gear once caps are reached. Rules are
 * skipped when:
 *   - ctx.resistancesCapped === true (user flagged caps as met)
 *   - ctx.phase === 'aspirational' (high-corruption players handle this gear-side)
 */

import { THRESHOLD_AFFIXES } from '../knowledge/game/threshold-affixes.js';
import { PRIORITY, buildAffixCondition } from '@filter-site/lib/templates/core/rule-builder.js';
import { makeRule } from './_factory.js';
import type { CompiledRule } from '@filter-site/lib/templates/core/types.js';
import type { BuildContext } from '../types/build-context.js';

export function generateThresholdRules(ctx: BuildContext): CompiledRule[] {
  if (ctx.resistancesCapped || ctx.phase === 'aspirational') return [];

  // Group affix IDs by toggleKey, filtering to phases relevant for this build phase
  const groups = new Map<string, { name: string; ids: number[] }>();

  for (const affix of THRESHOLD_AFFIXES) {
    if (!affix.relevantPhases.includes(ctx.phase)) continue;

    const existing = groups.get(affix.toggleKey);
    if (existing) {
      existing.ids.push(affix.affixId);
    } else {
      // Derive a display name from the toggleKey
      const displayName = affix.name.replace(/^(Idol\s+)/, ''); // strip "Idol " prefix for grouping label
      groups.set(affix.toggleKey, { name: displayName, ids: [affix.affixId] });
    }
  }

  const rules: CompiledRule[] = [];

  for (const [toggleKey, { name, ids }] of groups) {
    const label = toggleKeyToLabel(toggleKey);
    rules.push(
      makeRule(
        'SHOW',
        `[Threshold] ${label}`,
        [buildAffixCondition(ids, 'ANY', 1)],
        { color: 12, emphasized: false, priority: PRIORITY.THRESHOLD_AFFIX },
      ),
    );
  }

  return rules;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toggleKeyToLabel(toggleKey: string): string {
  const labels: Record<string, string> = {
    elemental_resistance_capped:     'Elemental Resistance',
    all_resistances_capped:          'All Resistances',
    necrotic_resistance_capped:      'Necrotic Resistance',
    void_resistance_capped:          'Void Resistance',
    poison_resistance_capped:        'Poison Resistance',
    physical_resistance_capped:      'Physical Resistance',
  };
  return labels[toggleKey] ?? toggleKey.replace(/_/g, ' ');
}
