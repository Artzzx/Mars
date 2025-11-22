import type { Rule } from '../../lib/filters/types';

export interface FilterModule {
  id: string;
  name: string;
  category: string;
  description: string;
  rules: Omit<Rule, 'id'>[];
}

// Trade League Module - highlights valuable items for selling
const tradeModule: FilterModule = {
  id: 'trade',
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
      nameOverride: 'HIGH LP UNIQUE',
      soundId: 6,
      beamId: 4,
      order: 0,
    },
  ],
};

// SSF Module - shows more crafting materials
const ssfModule: FilterModule = {
  id: 'ssf',
  name: 'Solo Self-Found',
  category: 'Playstyle',
  description: 'Shows more crafting materials and items for self-progression.',
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
      order: 0,
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
      order: 0,
    },
  ],
};

// Class-specific modules
const sentinelModule: FilterModule = {
  id: 'sentinel',
  name: 'Sentinel Focus',
  category: 'Class',
  description: 'Hides items not usable by Sentinel.',
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
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 0,
    },
  ],
};

const mageModule: FilterModule = {
  id: 'mage',
  name: 'Mage Focus',
  category: 'Class',
  description: 'Hides items not usable by Mage.',
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
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 0,
    },
  ],
};

const primalistModule: FilterModule = {
  id: 'primalist',
  name: 'Primalist Focus',
  category: 'Class',
  description: 'Hides items not usable by Primalist.',
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
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 0,
    },
  ],
};

const rogueModule: FilterModule = {
  id: 'rogue',
  name: 'Rogue Focus',
  category: 'Class',
  description: 'Hides items not usable by Rogue.',
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
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 0,
    },
  ],
};

const acolyteModule: FilterModule = {
  id: 'acolyte',
  name: 'Acolyte Focus',
  category: 'Class',
  description: 'Hides items not usable by Acolyte.',
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
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 0,
    },
  ],
};

// Content modules
const monolithModule: FilterModule = {
  id: 'monolith',
  name: 'Monolith Farming',
  category: 'Content',
  description: 'Optimized for Monolith grinding with strict hiding.',
  rules: [
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
      order: 0,
    },
  ],
};

export const PRESET_MODULES: FilterModule[] = [
  tradeModule,
  ssfModule,
  sentinelModule,
  mageModule,
  primalistModule,
  rogueModule,
  acolyteModule,
  monolithModule,
];

export function getModuleById(id: string): FilterModule | undefined {
  return PRESET_MODULES.find((m) => m.id === id);
}
