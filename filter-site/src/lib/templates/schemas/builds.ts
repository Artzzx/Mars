/**
 * Build Profile Definitions
 *
 * Each build profile contains the complete configuration
 * for generating a build-specific filter.
 */

import type { BuildProfile } from '../core/types';

// ============================================================================
// Sentinel Builds
// ============================================================================

export const WARPATH_VOID_KNIGHT: BuildProfile = {
  id: 'warpath-voidknight',
  name: 'warpath-voidknight',
  displayName: 'Warpath Void Knight',
  class: 'Sentinel',
  ascendancy: 'Void Knight',

  primaryStats: ['strength', 'vitality'],
  damageTypes: ['void', 'physical'],

  valuedAffixes: {
    essential: [21, 22, 23, 60, 63], // Void damage, Strength, Vitality
    high: [27, 28, 31, 32, 87], // Physical, Health, Melee Attack Speed
    medium: [50, 51, 40, 41, 42], // Armor, Resistances
    low: [6, 7, 100], // Crit, Movement Speed
  },

  weapons: ['ONE_HANDED_SWORD', 'TWO_HANDED_SWORD', 'ONE_HANDED_AXE', 'TWO_HANDED_AXE'],
  offhand: ['SHIELD'],

  idolAffixes: {
    small: [837, 831], // Void/Str, Block on Hit
    humble: [872, 862, 867, 869], // Double Damage, Inc HP, Channel Dmg, Melee Void
    stout: [894, 892], // Inc Phys, Stun Duration
    grand: [124, 326, 894, 892],
    large: [862, 872],
  },
};

export const JUDGEMENT_PALADIN: BuildProfile = {
  id: 'judgement-paladin',
  name: 'judgement-paladin',
  displayName: 'Judgement Paladin',
  class: 'Sentinel',
  ascendancy: 'Paladin',

  primaryStats: ['strength', 'vitality', 'attunement'],
  damageTypes: ['physical', 'fire'],

  valuedAffixes: {
    essential: [27, 28, 10, 11, 60], // Physical, Fire, Strength
    high: [52, 53, 31, 32, 50], // Block, Health, Armor
    medium: [40, 41, 42, 43, 44], // Resistances
    low: [6, 7, 100],
  },

  weapons: ['ONE_HANDED_MACES', 'TWO_HANDED_MACE', 'ONE_HANDED_SCEPTRE'],
  offhand: ['SHIELD'],

  idolAffixes: {
    small: [831, 837],
    humble: [862, 872],
    stout: [],
    grand: [],
    large: [],
  },
};

// ============================================================================
// Mage Builds
// ============================================================================

export const FROSTBITE_SORCERER: BuildProfile = {
  id: 'frostbite-sorcerer',
  name: 'frostbite-sorcerer',
  displayName: 'Frostbite Sorcerer',
  class: 'Mage',
  ascendancy: 'Sorcerer',

  primaryStats: ['intelligence', 'attunement'],
  damageTypes: ['cold'],

  valuedAffixes: {
    essential: [13, 14, 15, 16, 62], // Cold damage, Freeze, Intelligence
    high: [4, 5, 88, 9], // Spell damage, Cast Speed, Spell Crit
    medium: [31, 32, 40, 41, 42], // Health, Resistances
    low: [70, 71, 100], // Mana, Movement Speed
  },

  weapons: ['TWO_HANDED_STAFF', 'WAND'],
  offhand: ['CATALYST'],

  idolAffixes: {
    small: [],
    humble: [],
    stout: [],
    grand: [],
    large: [],
  },
};

export const LIGHTNING_BLAST_RUNEMASTER: BuildProfile = {
  id: 'lightningblast-runemaster',
  name: 'lightningblast-runemaster',
  displayName: 'Lightning Blast Runemaster',
  class: 'Mage',
  ascendancy: 'Runemaster',

  primaryStats: ['intelligence', 'attunement'],
  damageTypes: ['lightning'],

  valuedAffixes: {
    essential: [17, 18, 19, 20, 62], // Lightning, Shock, Intelligence
    high: [4, 5, 88, 9], // Spell damage, Cast Speed
    medium: [31, 32, 70, 71], // Health, Mana
    low: [40, 41, 42, 100],
  },

  weapons: ['ONE_HANDED_SCEPTRE', 'WAND', 'TWO_HANDED_STAFF'],
  offhand: ['CATALYST'],

  idolAffixes: {
    small: [],
    humble: [],
    stout: [],
    grand: [],
    large: [],
  },
};

// ============================================================================
// Primalist Builds
// ============================================================================

export const BEAR_BEASTMASTER: BuildProfile = {
  id: 'bear-beastmaster',
  name: 'bear-beastmaster',
  displayName: 'Bear Beastmaster',
  class: 'Primalist',
  ascendancy: 'Beastmaster',

  primaryStats: ['strength', 'attunement', 'vitality'],
  damageTypes: ['physical'],

  valuedAffixes: {
    essential: [80, 81, 82, 83, 84], // All minion affixes
    high: [31, 32, 60, 63], // Health, Strength, Vitality
    medium: [50, 51, 40, 41, 42], // Armor, Resistances
    low: [100],
  },

  weapons: ['TWO_HANDED_AXE', 'TWO_HANDED_MACE'],
  offhand: undefined,

  idolAffixes: {
    small: [],
    humble: [],
    stout: [],
    grand: [],
    large: [],
  },
};

export const TORNADO_DRUID: BuildProfile = {
  id: 'tornado-druid',
  name: 'tornado-druid',
  displayName: 'Tornado Druid',
  class: 'Primalist',
  ascendancy: 'Druid',

  primaryStats: ['attunement', 'vitality'],
  damageTypes: ['physical', 'cold'],

  valuedAffixes: {
    essential: [27, 28, 13, 14, 64], // Physical, Cold, Attunement
    high: [4, 5, 88, 31, 32], // Spell, Cast Speed, Health
    medium: [40, 41, 42, 43, 44],
    low: [100],
  },

  weapons: ['TWO_HANDED_STAFF'],
  offhand: undefined,

  idolAffixes: {
    small: [],
    humble: [],
    stout: [],
    grand: [],
    large: [],
  },
};

// ============================================================================
// Rogue Builds
// ============================================================================

export const SHADOW_CASCADE_BLADEDANCER: BuildProfile = {
  id: 'shadowcascade-bladedancer',
  name: 'shadowcascade-bladedancer',
  displayName: 'Shadow Cascade Bladedancer',
  class: 'Rogue',
  ascendancy: 'Bladedancer',

  primaryStats: ['dexterity'],
  damageTypes: ['physical'],

  valuedAffixes: {
    essential: [27, 28, 1, 2, 61], // Physical, Melee, Dexterity
    high: [6, 7, 8, 87], // Crit, Melee Attack Speed
    medium: [31, 32, 54], // Health, Dodge
    low: [100],
  },

  weapons: ['ONE_HANDED_DAGGER', 'ONE_HANDED_SWORD'],
  offhand: ['ONE_HANDED_DAGGER', 'ONE_HANDED_SWORD'],

  idolAffixes: {
    small: [],
    humble: [],
    stout: [],
    grand: [],
    large: [],
  },
};

export const HEARTSEEKER_MARKSMAN: BuildProfile = {
  id: 'heartseeker-marksman',
  name: 'heartseeker-marksman',
  displayName: 'Heartseeker Marksman',
  class: 'Rogue',
  ascendancy: 'Marksman',

  primaryStats: ['dexterity'],
  damageTypes: ['physical'],

  valuedAffixes: {
    essential: [27, 28, 61], // Physical, Dexterity
    high: [6, 7], // Crit
    medium: [31, 32, 54],
    low: [100],
  },

  weapons: ['BOW'],
  offhand: ['QUIVER'],

  idolAffixes: {
    small: [],
    humble: [],
    stout: [],
    grand: [],
    large: [],
  },
};

// ============================================================================
// Acolyte Builds
// ============================================================================

export const WRAITH_NECROMANCER: BuildProfile = {
  id: 'wraith-necromancer',
  name: 'wraith-necromancer',
  displayName: 'Wraith Necromancer',
  class: 'Acolyte',
  ascendancy: 'Necromancer',

  primaryStats: ['intelligence', 'vitality'],
  damageTypes: ['necrotic'],

  valuedAffixes: {
    essential: [80, 81, 82, 83, 84, 24, 25], // Minion affixes, Necrotic
    high: [31, 32, 62, 63], // Health, Intelligence, Vitality
    medium: [40, 41, 42, 43, 44],
    low: [100],
  },

  weapons: ['WAND', 'ONE_HANDED_SCEPTRE'],
  offhand: ['CATALYST'],

  idolAffixes: {
    small: [],
    humble: [],
    stout: [],
    grand: [],
    large: [],
  },
};

export const HARVEST_LICH: BuildProfile = {
  id: 'harvest-lich',
  name: 'harvest-lich',
  displayName: 'Harvest Lich',
  class: 'Acolyte',
  ascendancy: 'Lich',

  primaryStats: ['intelligence', 'vitality'],
  damageTypes: ['necrotic'],

  valuedAffixes: {
    essential: [24, 25, 26, 62, 63], // Necrotic, Intelligence, Vitality
    high: [35, 31, 32], // Health Leech, Health
    medium: [4, 5, 88],
    low: [40, 41, 42, 43, 44, 100],
  },

  weapons: ['TWO_HANDED_STAFF', 'WAND'],
  offhand: ['CATALYST'],

  idolAffixes: {
    small: [],
    humble: [],
    stout: [],
    grand: [],
    large: [],
  },
};

// ============================================================================
// Build Registry
// ============================================================================

export const ALL_BUILDS: BuildProfile[] = [
  // Sentinel
  WARPATH_VOID_KNIGHT,
  JUDGEMENT_PALADIN,
  // Mage
  FROSTBITE_SORCERER,
  LIGHTNING_BLAST_RUNEMASTER,
  // Primalist
  BEAR_BEASTMASTER,
  TORNADO_DRUID,
  // Rogue
  SHADOW_CASCADE_BLADEDANCER,
  HEARTSEEKER_MARKSMAN,
  // Acolyte
  WRAITH_NECROMANCER,
  HARVEST_LICH,
];

export const BUILD_BY_ID = new Map<string, BuildProfile>(ALL_BUILDS.map((b) => [b.id, b]));

export const BUILDS_BY_CLASS = new Map<string, BuildProfile[]>();
for (const build of ALL_BUILDS) {
  if (!BUILDS_BY_CLASS.has(build.class)) {
    BUILDS_BY_CLASS.set(build.class, []);
  }
  BUILDS_BY_CLASS.get(build.class)!.push(build);
}

export function getBuildById(id: string): BuildProfile | undefined {
  return BUILD_BY_ID.get(id);
}

export function getBuildsByClass(className: string): BuildProfile[] {
  return BUILDS_BY_CLASS.get(className) || [];
}
