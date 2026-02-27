import { describe, it, expect } from 'vitest';
import { encodeFilter, decodeFilter } from './sharing';
import type { ItemFilter } from './filters/types';
import { createEmptyFilter, createEmptyRule } from './filters/types';

describe('Filter sharing encode/decode', () => {
  it('round-trips an empty filter', () => {
    const filter = createEmptyFilter();
    const encoded = encodeFilter(filter);
    const decoded = decodeFilter(encoded);

    expect(decoded.name).toBe(filter.name);
    expect(decoded.filterIcon).toBe(filter.filterIcon);
    expect(decoded.lootFilterVersion).toBe(filter.lootFilterVersion);
    expect(decoded.rules).toHaveLength(0);
  });

  it('round-trips a filter with rules', () => {
    const filter: ItemFilter = {
      ...createEmptyFilter(),
      name: 'Shared Filter',
      description: 'A filter for sharing',
      rules: [
        {
          ...createEmptyRule(),
          type: 'SHOW',
          color: 7,
          emphasized: true,
          nameOverride: 'Important',
          conditions: [
            {
              type: 'RarityCondition',
              rarity: ['EXALTED', 'UNIQUE'],
              minLegendaryPotential: null,
              maxLegendaryPotential: null,
              minWeaversWill: null,
              maxWeaversWill: null,
            },
          ],
        },
        {
          ...createEmptyRule(),
          type: 'HIDE',
          conditions: [
            {
              type: 'SubTypeCondition',
              equipmentTypes: ['HELMET', 'BOOTS'],
              subTypes: [],
            },
          ],
        },
      ],
    };

    const encoded = encodeFilter(filter);
    const decoded = decodeFilter(encoded);

    expect(decoded.name).toBe('Shared Filter');
    expect(decoded.description).toBe('A filter for sharing');
    expect(decoded.rules).toHaveLength(2);
    expect(decoded.rules[0].type).toBe('SHOW');
    expect(decoded.rules[0].color).toBe(7);
    expect(decoded.rules[0].nameOverride).toBe('Important');
    expect(decoded.rules[1].type).toBe('HIDE');
  });

  it('strips rule IDs during encoding to reduce size', () => {
    const filter: ItemFilter = {
      ...createEmptyFilter(),
      rules: [createEmptyRule()],
    };

    const encoded = encodeFilter(filter);
    // After decoding, IDs should exist but be different (regenerated)
    const decoded = decodeFilter(encoded);
    expect(decoded.rules[0].id).toBeDefined();
    expect(decoded.rules[0].id).not.toBe(filter.rules[0].id);
  });

  it('produces a compact encoding (smaller than JSON)', () => {
    const filter: ItemFilter = {
      ...createEmptyFilter(),
      rules: Array.from({ length: 5 }, () => ({
        ...createEmptyRule(),
        conditions: [
          {
            type: 'RarityCondition' as const,
            rarity: ['RARE' as const, 'EXALTED' as const],
            minLegendaryPotential: null,
            maxLegendaryPotential: null,
            minWeaversWill: null,
            maxWeaversWill: null,
          },
        ],
      })),
    };

    const encoded = encodeFilter(filter);
    const jsonSize = JSON.stringify(filter).length;
    expect(encoded.length).toBeLessThan(jsonSize);
  });

  it('preserves condition data through round-trip', () => {
    const filter: ItemFilter = {
      ...createEmptyFilter(),
      rules: [
        {
          ...createEmptyRule(),
          conditions: [
            {
              type: 'AffixCondition',
              affixes: [25, 52, 505],
              comparison: 'MORE_OR_EQUAL',
              comparisonValue: 2,
              minOnTheSameItem: 1,
              combinedComparison: 'ANY',
              combinedComparisonValue: 1,
              advanced: true,
            },
          ],
        },
      ],
    };

    const decoded = decodeFilter(encodeFilter(filter));
    const cond = decoded.rules[0].conditions[0];
    expect(cond.type).toBe('AffixCondition');
    if (cond.type === 'AffixCondition') {
      expect(cond.affixes).toEqual([25, 52, 505]);
      expect(cond.comparison).toBe('MORE_OR_EQUAL');
      expect(cond.comparisonValue).toBe(2);
    }
  });
});
