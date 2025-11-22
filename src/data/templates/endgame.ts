import type { ItemFilter } from '../../lib/filters/types';
import { FILTER_VERSION, GAME_VERSION } from '../../lib/filters/types';

export const endgameFilter: ItemFilter = {
  name: 'Endgame Strict Filter',
  filterIcon: 2,
  filterIconColor: 7,
  description: 'Strict filter for corruption farming. Hides most items, highlights valuable drops.',
  lastModifiedInVersion: GAME_VERSION.CURRENT,
  lootFilterVersion: FILTER_VERSION.CURRENT,
  rules: [
    // Hide everything by default (catch-all at the end)
    {
      id: crypto.randomUUID(),
      type: 'HIDE',
      conditions: [],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 99,
    },
    // Highlight Legendary items with big beam
    {
      id: crypto.randomUUID(),
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['LEGENDARY'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 5, // Orange
      isEnabled: true,
      emphasized: true,
      nameOverride: '',
      soundId: 7, // Legendary sound
      beamId: 4, // Orange beam
      order: 0,
    },
    // Highlight Unique/Set items
    {
      id: crypto.randomUUID(),
      type: 'HIGHLIGHT',
      conditions: [
        {
          type: 'RarityCondition',
          rarity: ['UNIQUE', 'SET'],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        },
      ],
      color: 5, // Orange
      isEnabled: true,
      emphasized: true,
      nameOverride: '',
      soundId: 6, // Epic sound
      beamId: 3, // Yellow beam
      order: 1,
    },
    // Highlight Exalted items
    {
      id: crypto.randomUUID(),
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
      color: 10, // Dark Purple
      isEnabled: true,
      emphasized: true,
      nameOverride: '',
      soundId: 5, // Fanfare
      beamId: 5, // Purple beam
      order: 2,
    },
    // Show Rare items (no highlight, just visible)
    {
      id: crypto.randomUUID(),
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
      order: 3,
    },
    // Show all Idols
    {
      id: crypto.randomUUID(),
      type: 'SHOW',
      conditions: [
        {
          type: 'SubTypeCondition',
          equipmentTypes: [
            'IDOL_1x1_ETERRA',
            'IDOL_1x1_LAGON',
            'IDOL_1x2',
            'IDOL_2x1',
            'IDOL_1x3',
            'IDOL_3x1',
            'IDOL_1x4',
            'IDOL_4x1',
            'IDOL_2x2',
          ],
          subTypes: [],
        },
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '',
      soundId: 0,
      beamId: 0,
      order: 4,
    },
  ],
};
