import type { Rule, CharacterClass, EquipmentType } from '../../lib/filters/types';

// ============================================================================
// Types
// ============================================================================

export interface FilterModule {
  id: string;
  name: string;
  category: 'Ascendancy' | 'Strictness' | 'Playstyle' | 'Build';
  subcategory?: string; // For grouping within category (e.g., class name for ascendancies)
  description: string;
  rules: Omit<Rule, 'id'>[];
  // For multi-class handling
  classRestriction?: string[]; // Classes this module is for (for smart merging)
  conflictsWith?: string[]; // Module IDs this conflicts with
  priority?: number; // Rule ordering priority (higher = earlier in filter)
}

export interface StrictnessLevel {
  id: string;
  name: string;
  description: string;
  order: number;
}

// ============================================================================
// Strictness Levels - Official Descriptions
// ============================================================================

export const STRICTNESS_LEVELS: StrictnessLevel[] = [
  {
    id: 'regular',
    name: 'Regular',
    description: 'Recommended filter-strictness for leveling season-starters. Progressively hides the worst items & highlights potential upgrades.',
    order: 0,
  },
  {
    id: 'strict',
    name: 'Strict',
    description: 'Recommended for start of Empowered Monolith. Hides most Uniques without significant LP/WW. Hides most Rares. Hides Set Items.',
    order: 1,
  },
  {
    id: 'very-strict',
    name: 'Very Strict',
    description: 'Recommended to focus on Tier 7 Items. High LP Uniques. Hides most Tier 6 Exalteds. Shows best Exalted Bases. Hides Sets.',
    order: 2,
  },
  {
    id: 'uber-strict',
    name: 'Uber Strict',
    description: 'Recommended for Endgame: High LP Uniques. Strict Idols. Hides Tier 6 Exalteds. Designed for optimized gameplay.',
    order: 3,
  },
  {
    id: 'giga-strict',
    name: 'GIGA Strict',
    description: 'Multi Exalt Imprint Farm. High LP Uniques. Strict Planner Idols. Double Tier 7. Triple+ Exalteds. Designed for maximum efficiency.',
    order: 4,
  },
];

// ============================================================================
// Ascendancy Modules (Base Class Focus)
// ============================================================================

const sentinelModule: FilterModule = {
  id: 'ascendancy-sentinel',
  name: 'Sentinel',
  category: 'Ascendancy',
  subcategory: 'Sentinel',
  description: 'Shows Sentinel-usable items. Includes Void Knight, Forge Guard, and Paladin gear.',
  classRestriction: ['Sentinel'],
  rules: [
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'ClassCondition',
          classes: ['Mage', 'Primalist', 'Rogue', 'Acolyte'],
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '[Ascendancy] Non-Sentinel Items',
      soundId: 0,
      beamId: 0,
      order: 100,
    },
  ],
  priority: 100,
};

const mageModule: FilterModule = {
  id: 'ascendancy-mage',
  name: 'Mage',
  category: 'Ascendancy',
  subcategory: 'Mage',
  description: 'Shows Mage-usable items. Includes Sorcerer, Spellblade, and Runemaster gear.',
  classRestriction: ['Mage'],
  rules: [
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'ClassCondition',
          classes: ['Sentinel', 'Primalist', 'Rogue', 'Acolyte'],
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '[Ascendancy] Non-Mage Items',
      soundId: 0,
      beamId: 0,
      order: 100,
    },
  ],
  priority: 100,
};

const primalistModule: FilterModule = {
  id: 'ascendancy-primalist',
  name: 'Primalist',
  category: 'Ascendancy',
  subcategory: 'Primalist',
  description: 'Shows Primalist-usable items. Includes Beastmaster, Shaman, and Druid gear.',
  classRestriction: ['Primalist'],
  rules: [
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'ClassCondition',
          classes: ['Sentinel', 'Mage', 'Rogue', 'Acolyte'],
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '[Ascendancy] Non-Primalist Items',
      soundId: 0,
      beamId: 0,
      order: 100,
    },
  ],
  priority: 100,
};

const rogueModule: FilterModule = {
  id: 'ascendancy-rogue',
  name: 'Rogue',
  category: 'Ascendancy',
  subcategory: 'Rogue',
  description: 'Shows Rogue-usable items. Includes Bladedancer, Marksman, and Falconer gear.',
  classRestriction: ['Rogue'],
  rules: [
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'ClassCondition',
          classes: ['Sentinel', 'Mage', 'Primalist', 'Acolyte'],
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '[Ascendancy] Non-Rogue Items',
      soundId: 0,
      beamId: 0,
      order: 100,
    },
  ],
  priority: 100,
};

const acolyteModule: FilterModule = {
  id: 'ascendancy-acolyte',
  name: 'Acolyte',
  category: 'Ascendancy',
  subcategory: 'Acolyte',
  description: 'Shows Acolyte-usable items. Includes Necromancer, Lich, and Warlock gear.',
  classRestriction: ['Acolyte'],
  rules: [
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'ClassCondition',
          classes: ['Sentinel', 'Mage', 'Primalist', 'Rogue'],
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '[Ascendancy] Non-Acolyte Items',
      soundId: 0,
      beamId: 0,
      order: 100,
    },
  ],
  priority: 100,
};

// ============================================================================
// Strictness Modules
// ============================================================================

const regularStrictness: FilterModule = {
  id: 'strictness-regular',
  name: 'Regular',
  category: 'Strictness',
  description: STRICTNESS_LEVELS[0].description,
  conflictsWith: ['strictness-strict', 'strictness-very-strict', 'strictness-uber-strict', 'strictness-giga-strict'],
  rules: [
    // Show all magic/rare items during leveling
    {
      type: 'SHOW',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['MAGIC', 'RARE'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 50,
    },
    // Highlight uniques
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['UNIQUE'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 5, // Orange
      isEnabled: true,
      emphasized: true,
      nameOverride: 'UNIQUE',
      soundId: 1,
      beamId: 1,
      order: 10,
    },
  ],
  priority: 50,
};

const strictStrictness: FilterModule = {
  id: 'strictness-strict',
  name: 'Strict',
  category: 'Strictness',
  description: STRICTNESS_LEVELS[1].description,
  conflictsWith: ['strictness-regular', 'strictness-very-strict', 'strictness-uber-strict', 'strictness-giga-strict'],
  rules: [
    // Hide normal/magic items
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['NORMAL', 'MAGIC'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 90,
    },
    // Hide set items
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['SET'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 89,
    },
    // Hide low LP uniques
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['UNIQUE'],
          minLegendaryPotential: 0,
          maxLegendaryPotential: 0,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 88,
    },
    // Highlight LP uniques
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['UNIQUE'],
          minLegendaryPotential: 1,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 5, // Orange
      isEnabled: true,
      emphasized: true,
      nameOverride: 'LP UNIQUE',
      soundId: 6,
      beamId: 4,
      order: 5,
    },
  ],
  priority: 50,
};

const veryStrictStrictness: FilterModule = {
  id: 'strictness-very-strict',
  name: 'Very Strict',
  category: 'Strictness',
  description: STRICTNESS_LEVELS[2].description,
  conflictsWith: ['strictness-regular', 'strictness-strict', 'strictness-uber-strict', 'strictness-giga-strict'],
  rules: [
    // Hide normal/magic/rare items
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['NORMAL', 'MAGIC', 'RARE'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 90,
    },
    // Hide set items
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['SET'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 89,
    },
    // Hide low LP uniques (< 2)
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['UNIQUE'],
          minLegendaryPotential: 0,
          maxLegendaryPotential: 1,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 88,
    },
    // Highlight high LP uniques
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['UNIQUE'],
          minLegendaryPotential: 2,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 5, // Orange
      isEnabled: true,
      emphasized: true,
      nameOverride: 'HIGH LP UNIQUE',
      soundId: 6,
      beamId: 4,
      order: 5,
    },
    // Show exalted items
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 14, // Purple
      isEnabled: true,
      emphasized: true,
      nameOverride: 'EXALTED',
      soundId: 2,
      beamId: 2,
      order: 8,
    },
  ],
  priority: 50,
};

const uberStrictStrictness: FilterModule = {
  id: 'strictness-uber-strict',
  name: 'Uber Strict',
  category: 'Strictness',
  description: STRICTNESS_LEVELS[3].description,
  conflictsWith: ['strictness-regular', 'strictness-strict', 'strictness-very-strict', 'strictness-giga-strict'],
  rules: [
    // Hide almost everything
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['NORMAL', 'MAGIC', 'RARE', 'SET'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 90,
    },
    // Hide low LP uniques (< 3)
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['UNIQUE'],
          minLegendaryPotential: 0,
          maxLegendaryPotential: 2,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 88,
    },
    // Highlight 3+ LP uniques
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['UNIQUE'],
          minLegendaryPotential: 3,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 5, // Orange
      isEnabled: true,
      emphasized: true,
      nameOverride: '3+ LP UNIQUE',
      soundId: 6,
      beamId: 4,
      order: 5,
    },
    // Show exalted items
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 14, // Purple
      isEnabled: true,
      emphasized: true,
      nameOverride: 'EXALTED',
      soundId: 2,
      beamId: 2,
      order: 8,
    },
  ],
  priority: 50,
};

const gigaStrictStrictness: FilterModule = {
  id: 'strictness-giga-strict',
  name: 'GIGA Strict',
  category: 'Strictness',
  description: STRICTNESS_LEVELS[4].description,
  conflictsWith: ['strictness-regular', 'strictness-strict', 'strictness-very-strict', 'strictness-uber-strict'],
  rules: [
    // Hide everything except legendary potential items
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['NORMAL', 'MAGIC', 'RARE', 'SET', 'EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 90,
    },
    // Hide low LP uniques (< 4)
    {
      type: 'HIDE',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['UNIQUE'],
          minLegendaryPotential: 0,
          maxLegendaryPotential: 3,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 88,
    },
    // Highlight 4LP uniques
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['UNIQUE'],
          minLegendaryPotential: 4,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 5, // Orange
      isEnabled: true,
      emphasized: true,
      nameOverride: '4LP UNIQUE',
      soundId: 6,
      beamId: 4,
      order: 5,
    },
  ],
  priority: 50,
};

// ============================================================================
// Playstyle Modules
// ============================================================================

const tradeModule: FilterModule = {
  id: 'playstyle-trade',
  name: 'Trade League',
  category: 'Playstyle',
  description: 'Highlights items valuable for trading: high LP uniques, exalted items with good rolls.',
  rules: [
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['UNIQUE'],
          minLegendaryPotential: 2,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 5, // Orange
      isEnabled: true,
      emphasized: true,
      nameOverride: 'TRADE: HIGH LP',
      soundId: 6,
      beamId: 4,
      order: 1,
    },
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 14, // Purple
      isEnabled: true,
      emphasized: true,
      nameOverride: 'TRADE: EXALTED',
      soundId: 2,
      beamId: 2,
      order: 2,
    },
  ],
  priority: 10,
};

const ssfModule: FilterModule = {
  id: 'playstyle-ssf',
  name: 'Solo Self-Found',
  category: 'Playstyle',
  description: 'Shows more crafting materials and items for self-progression. Less strict on rares.',
  rules: [
    {
      type: 'SHOW',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['RARE'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 20,
    },
    {
      type: 'SHOW',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['MAGIC'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 21,
    },
  ],
  priority: 10,
};

// ============================================================================
// Build Modules (Specific Builds)
// ============================================================================

// Sentinel Builds
const warpathVoidKnight: FilterModule = {
  id: 'build-warpath-voidknight',
  name: 'Warpath Void Knight',
  category: 'Build',
  subcategory: 'Sentinel',
  description: 'Optimized for Warpath Void Knight. Highlights valuable Sentinel gear and specific idol affixes.',
  classRestriction: ['Sentinel'],
  rules: [
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'SubTypeCondition',
          equipmentTypes: ['ONE_HANDED_SWORD', 'TWO_HANDED_SWORD'] as EquipmentType[],
          subTypes: [],
        },
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 14, // Purple
      isEnabled: true,
      emphasized: true,
      nameOverride: '[Warpath] Sword',
      soundId: 2,
      beamId: 2,
      order: 3,
    },
  ],
  priority: 5,
};

const judgementPaladin: FilterModule = {
  id: 'build-judgement-paladin',
  name: 'Judgement Paladin',
  category: 'Build',
  subcategory: 'Sentinel',
  description: 'Optimized for Judgement Paladin. Highlights mace weapons and block gear.',
  classRestriction: ['Sentinel'],
  rules: [
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'SubTypeCondition',
          equipmentTypes: ['ONE_HANDED_MACES', 'TWO_HANDED_MACE'] as EquipmentType[],
          subTypes: [],
        },
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 14,
      isEnabled: true,
      emphasized: true,
      nameOverride: '[Judgement] Mace',
      soundId: 2,
      beamId: 2,
      order: 3,
    },
  ],
  priority: 5,
};

// Mage Builds
const frostbiteSorcerer: FilterModule = {
  id: 'build-frostbite-sorcerer',
  name: 'Frostbite Sorcerer',
  category: 'Build',
  subcategory: 'Mage',
  description: 'Optimized for Frostbite Sorcerer. Highlights cold damage gear and cast speed.',
  classRestriction: ['Mage'],
  rules: [
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'SubTypeCondition',
          equipmentTypes: ['TWO_HANDED_STAFF', 'WAND'] as EquipmentType[],
          subTypes: [],
        },
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 10, // Light Blue
      isEnabled: true,
      emphasized: true,
      nameOverride: '[Frostbite] Weapon',
      soundId: 2,
      beamId: 2,
      order: 3,
    },
  ],
  priority: 5,
};

const lightningBlastRunemaster: FilterModule = {
  id: 'build-lightningblast-runemaster',
  name: 'Lightning Blast Runemaster',
  category: 'Build',
  subcategory: 'Mage',
  description: 'Optimized for Lightning Blast Runemaster. Highlights lightning gear and rune affixes.',
  classRestriction: ['Mage'],
  rules: [
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'SubTypeCondition',
          equipmentTypes: ['ONE_HANDED_SCEPTRE', 'WAND'] as EquipmentType[],
          subTypes: [],
        },
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 8, // Yellow
      isEnabled: true,
      emphasized: true,
      nameOverride: '[LBlast] Weapon',
      soundId: 2,
      beamId: 2,
      order: 3,
    },
  ],
  priority: 5,
};

// Primalist Builds
const bearBeastmaster: FilterModule = {
  id: 'build-bear-beastmaster',
  name: 'Bear Beastmaster',
  category: 'Build',
  subcategory: 'Primalist',
  description: 'Optimized for Bear Beastmaster. Highlights minion gear and health affixes.',
  classRestriction: ['Primalist'],
  rules: [
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'SubTypeCondition',
          equipmentTypes: ['TWO_HANDED_AXE', 'TWO_HANDED_MACE'] as EquipmentType[],
          subTypes: [],
        },
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 17, // Dark Green
      isEnabled: true,
      emphasized: true,
      nameOverride: '[Bear] Weapon',
      soundId: 2,
      beamId: 2,
      order: 3,
    },
  ],
  priority: 5,
};

const tornadoDruid: FilterModule = {
  id: 'build-tornado-druid',
  name: 'Tornado Druid',
  category: 'Build',
  subcategory: 'Primalist',
  description: 'Optimized for Tornado Druid. Highlights attunement and cast speed gear.',
  classRestriction: ['Primalist'],
  rules: [
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'SubTypeCondition',
          equipmentTypes: ['TWO_HANDED_STAFF'] as EquipmentType[],
          subTypes: [],
        },
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 12, // Green
      isEnabled: true,
      emphasized: true,
      nameOverride: '[Tornado] Staff',
      soundId: 2,
      beamId: 2,
      order: 3,
    },
  ],
  priority: 5,
};

// Rogue Builds
const shadowCascadeBladedancer: FilterModule = {
  id: 'build-shadowcascade-bladedancer',
  name: 'Shadow Cascade Bladedancer',
  category: 'Build',
  subcategory: 'Rogue',
  description: 'Optimized for Shadow Cascade Bladedancer. Highlights melee weapons and shadow gear.',
  classRestriction: ['Rogue'],
  rules: [
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'SubTypeCondition',
          equipmentTypes: ['ONE_HANDED_DAGGER', 'ONE_HANDED_SWORD'] as EquipmentType[],
          subTypes: [],
        },
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 14, // Purple
      isEnabled: true,
      emphasized: true,
      nameOverride: '[Shadow] Weapon',
      soundId: 2,
      beamId: 2,
      order: 3,
    },
  ],
  priority: 5,
};

const heartseekerMarksman: FilterModule = {
  id: 'build-heartseeker-marksman',
  name: 'Heartseeker Marksman',
  category: 'Build',
  subcategory: 'Rogue',
  description: 'Optimized for Heartseeker Marksman. Highlights bows and dexterity gear.',
  classRestriction: ['Rogue'],
  rules: [
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'SubTypeCondition',
          equipmentTypes: ['BOW'] as EquipmentType[],
          subTypes: [],
        },
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 12, // Green
      isEnabled: true,
      emphasized: true,
      nameOverride: '[Heartseeker] Bow',
      soundId: 2,
      beamId: 2,
      order: 3,
    },
  ],
  priority: 5,
};

// Acolyte Builds
const wraithNecromancer: FilterModule = {
  id: 'build-wraith-necromancer',
  name: 'Wraith Necromancer',
  category: 'Build',
  subcategory: 'Acolyte',
  description: 'Optimized for Wraith Necromancer. Highlights minion gear and intelligence.',
  classRestriction: ['Acolyte'],
  rules: [
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'SubTypeCondition',
          equipmentTypes: ['WAND', 'ONE_HANDED_SCEPTRE'] as EquipmentType[],
          subTypes: [],
        },
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 14, // Purple
      isEnabled: true,
      emphasized: true,
      nameOverride: '[Wraith] Weapon',
      soundId: 2,
      beamId: 2,
      order: 3,
    },
  ],
  priority: 5,
};

const harvestLich: FilterModule = {
  id: 'build-harvest-lich',
  name: 'Harvest Lich',
  category: 'Build',
  subcategory: 'Acolyte',
  description: 'Optimized for Harvest Lich. Highlights necrotic damage and health leech gear.',
  classRestriction: ['Acolyte'],
  rules: [
    {
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'SubTypeCondition',
          equipmentTypes: ['TWO_HANDED_STAFF', 'WAND'] as EquipmentType[],
          subTypes: [],
        },
        {
          type: 'RarityCondition',
          rarity: ['EXALTED'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 6, // Red
      isEnabled: true,
      emphasized: true,
      nameOverride: '[Harvest] Weapon',
      soundId: 2,
      beamId: 2,
      order: 3,
    },
  ],
  priority: 5,
};

// ============================================================================
// Module Collections
// ============================================================================

export const ASCENDANCY_MODULES: FilterModule[] = [
  sentinelModule,
  mageModule,
  primalistModule,
  rogueModule,
  acolyteModule,
];

export const STRICTNESS_MODULES: FilterModule[] = [
  regularStrictness,
  strictStrictness,
  veryStrictStrictness,
  uberStrictStrictness,
  gigaStrictStrictness,
];

export const PLAYSTYLE_MODULES: FilterModule[] = [
  tradeModule,
  ssfModule,
];

export const BUILD_MODULES: FilterModule[] = [
  // Sentinel
  warpathVoidKnight,
  judgementPaladin,
  // Mage
  frostbiteSorcerer,
  lightningBlastRunemaster,
  // Primalist
  bearBeastmaster,
  tornadoDruid,
  // Rogue
  shadowCascadeBladedancer,
  heartseekerMarksman,
  // Acolyte
  wraithNecromancer,
  harvestLich,
];

export const PRESET_MODULES: FilterModule[] = [
  ...ASCENDANCY_MODULES,
  ...STRICTNESS_MODULES,
  ...PLAYSTYLE_MODULES,
  ...BUILD_MODULES,
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getModuleById(id: string): FilterModule | undefined {
  return PRESET_MODULES.find((m) => m.id === id);
}

export function getModulesByCategory(category: FilterModule['category']): FilterModule[] {
  return PRESET_MODULES.filter((m) => m.category === category);
}

export function getModulesBySubcategory(subcategory: string): FilterModule[] {
  return PRESET_MODULES.filter((m) => m.subcategory === subcategory);
}

/**
 * Merges rules from multiple modules, handling multi-class scenarios
 * When multiple ascendancy modules are selected, creates a combined class hide rule
 */
export function mergeModuleRules(moduleIds: string[]): Omit<Rule, 'id'>[] {
  const modules = moduleIds.map(getModuleById).filter((m): m is FilterModule => !!m);

  // Separate ascendancy modules from others
  const ascendancyModules = modules.filter((m) => m.category === 'Ascendancy');
  const otherModules = modules.filter((m) => m.category !== 'Ascendancy');

  const allRules: Omit<Rule, 'id'>[] = [];

  // Handle multi-class: combine class restrictions into single rule
  if (ascendancyModules.length > 0) {
    const selectedClasses = ascendancyModules
      .flatMap((m) => m.classRestriction || [])
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    const allClasses: CharacterClass[] = ['Sentinel', 'Mage', 'Primalist', 'Rogue', 'Acolyte'];
    const hiddenClasses = allClasses.filter((c) => !selectedClasses.includes(c));

    if (hiddenClasses.length > 0 && hiddenClasses.length < 5) {
      allRules.push({
        type: 'HIDE',
        conditions: [
          {
            type: 'ClassCondition',
            classes: hiddenClasses as CharacterClass[],
          },
        ],
        color: 0,
        isEnabled: true,
        emphasized: false,
        nameOverride: `[Filter] Non-${selectedClasses.join('/')} Items`,
        soundId: 0,
        beamId: 0,
        order: 100,
      });
    }
  }

  // Add rules from other modules (sorted by priority)
  const sortedModules = [...otherModules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const module of sortedModules) {
    for (const rule of module.rules) {
      allRules.push({
        ...rule,
        nameOverride: rule.nameOverride || `[${module.name}]`,
      });
    }
  }

  // Sort by order
  return allRules.sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Check if modules conflict with each other
 */
export function getModuleConflicts(moduleIds: string[]): { id: string; conflictsWith: string }[] {
  const conflicts: { id: string; conflictsWith: string }[] = [];
  const modules = moduleIds.map(getModuleById).filter((m): m is FilterModule => !!m);

  for (const module of modules) {
    if (module.conflictsWith) {
      for (const conflictId of module.conflictsWith) {
        if (moduleIds.includes(conflictId)) {
          conflicts.push({ id: module.id, conflictsWith: conflictId });
        }
      }
    }
  }

  return conflicts;
}
