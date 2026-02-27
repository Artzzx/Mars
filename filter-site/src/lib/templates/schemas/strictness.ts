/**
 * Strictness Level Definitions
 *
 * Each strictness level defines how items are filtered.
 * Higher strictness = fewer items shown.
 */

import type { StrictnessConfig } from '../core/types';

export const STRICTNESS_CONFIGS: StrictnessConfig[] = [
  {
    id: 'regular',
    name: 'Regular',
    description: 'Recommended filter-strictness for leveling season-starters. Progressively hides the worst items & highlights potential upgrades.',
    order: 0,

    showRarities: ['NORMAL', 'MAGIC', 'RARE', 'EXALTED', 'UNIQUE', 'SET', 'LEGENDARY'],
    hideRarities: [],

    minLegendaryPotential: 0,
    minWeaversWill: 0,

    minExaltedTier: 5,
    showRaresWithAffixes: true,
    minAffixMatches: 1,

    idolAffixRequirement: 'any',

    showNormalBases: true,
    showMagicItems: true,

    hideNormalAfterLevel: 25,
    hideMagicAfterLevel: 50,
    hideRareAfterLevel: 100,
  },
  {
    id: 'strict',
    name: 'Strict',
    description: 'Recommended for start of Empowered Monolith. Hides most Uniques without significant LP/WW. Hides most Rares. Hides Set Items.',
    order: 1,

    showRarities: ['EXALTED', 'UNIQUE', 'LEGENDARY'],
    hideRarities: ['NORMAL', 'MAGIC', 'SET'],

    minLegendaryPotential: 1,
    minWeaversWill: 5,

    minExaltedTier: 6,
    showRaresWithAffixes: true,
    minAffixMatches: 2,

    idolAffixRequirement: 'one_valued',

    showNormalBases: false,
    showMagicItems: false,

    hideNormalAfterLevel: 1,
    hideMagicAfterLevel: 1,
    hideRareAfterLevel: 75,
  },
  {
    id: 'very-strict',
    name: 'Very Strict',
    description: 'Recommended to focus on Tier 7 Items. High LP Uniques. Hides most Tier 6 Exalteds. Shows best Exalted Bases. Hides Sets.',
    order: 2,

    showRarities: ['EXALTED', 'UNIQUE', 'LEGENDARY'],
    hideRarities: ['NORMAL', 'MAGIC', 'RARE', 'SET'],

    minLegendaryPotential: 2,
    minWeaversWill: 10,

    minExaltedTier: 7,
    showRaresWithAffixes: false,
    minAffixMatches: 3,

    idolAffixRequirement: 'two_valued',

    showNormalBases: false,
    showMagicItems: false,

    hideNormalAfterLevel: 1,
    hideMagicAfterLevel: 1,
    hideRareAfterLevel: 1,
  },
  {
    id: 'uber-strict',
    name: 'Uber Strict',
    description: 'Recommended for Endgame: High LP Uniques. Strict Idols. Hides Tier 6 Exalteds. Designed for optimized gameplay.',
    order: 3,

    showRarities: ['EXALTED', 'UNIQUE', 'LEGENDARY'],
    hideRarities: ['NORMAL', 'MAGIC', 'RARE', 'SET'],

    minLegendaryPotential: 3,
    minWeaversWill: 15,

    minExaltedTier: 7,
    showRaresWithAffixes: false,
    minAffixMatches: 4,

    idolAffixRequirement: 'perfect',

    showNormalBases: false,
    showMagicItems: false,

    hideNormalAfterLevel: 1,
    hideMagicAfterLevel: 1,
    hideRareAfterLevel: 1,
  },
  {
    id: 'giga-strict',
    name: 'GIGA Strict',
    description: 'Multi Exalt Imprint Farm. High LP Uniques. Strict Planner Idols. Double Tier 7. Triple+ Exalteds. Designed for maximum efficiency.',
    order: 4,

    showRarities: ['UNIQUE', 'LEGENDARY'],
    hideRarities: ['NORMAL', 'MAGIC', 'RARE', 'SET', 'EXALTED'],

    minLegendaryPotential: 4,
    minWeaversWill: 20,

    minExaltedTier: 7, // Only T7 with multiple
    showRaresWithAffixes: false,
    minAffixMatches: 5, // Basically perfect rolls

    idolAffixRequirement: 'perfect',

    showNormalBases: false,
    showMagicItems: false,

    hideNormalAfterLevel: 1,
    hideMagicAfterLevel: 1,
    hideRareAfterLevel: 1,
  },
];

// Lookup map
export const STRICTNESS_BY_ID = new Map<string, StrictnessConfig>(
  STRICTNESS_CONFIGS.map((s) => [s.id, s])
);

export function getStrictnessConfig(id: string): StrictnessConfig | undefined {
  return STRICTNESS_BY_ID.get(id);
}

export function getDefaultStrictness(): StrictnessConfig {
  return STRICTNESS_CONFIGS[0];
}

/**
 * Get the appropriate strictness based on character level
 */
export function getStrictnessForLevel(level: number): StrictnessConfig {
  if (level < 30) return STRICTNESS_CONFIGS[0]; // Regular
  if (level < 60) return STRICTNESS_CONFIGS[0]; // Still Regular
  if (level < 85) return STRICTNESS_CONFIGS[1]; // Strict
  if (level < 95) return STRICTNESS_CONFIGS[2]; // Very Strict
  return STRICTNESS_CONFIGS[3]; // Uber Strict
}
