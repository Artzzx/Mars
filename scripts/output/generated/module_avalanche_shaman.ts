/**
 * Auto-generated Module: Avalanche Shaman
 * Base Class: Primalist
 *
 * This module adds Avalanche-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const avalanche_shamanModule = {
  id: 'avalanche-shaman',
  name: 'Avalanche (Shaman)',
  category: 'Build',
  description: 'Optimized rules for Avalanche Shaman build. Hides items for other classes and highlights valuable Primalist gear.',
  rules: [
    // Hide items not usable by Primalist
    {
      type: 'HIDE',
      conditions: [
              {
                      "type": "ClassCondition",
                      "classes": []
              }
      ],
      color: 0,
      isEnabled: true,
      emphasized: false,
      nameOverride: '[Avalanche] Other Class Items',
      soundId: 0,
      beamId: 0,
      order: 0,
    },
    {
      type: 'SHOW',
      conditions: [
              {
                      "type": "SubTypeCondition",
                      "equipmentTypes": [
                              "IDOL_1x1_ETERRA"
                      ],
                      "subTypes": [
                              2
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              835,
                              828,
                              838
                      ],
                      "comparison": "ANY",
                      "comparisonValue": 1,
                      "minOnTheSameItem": 2
              }
      ],
      color: 15,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Strict - Small Idols',
      soundId: 0,
      beamId: 0,
      order: 1,
    },
    {
      type: 'SHOW',
      conditions: [
              {
                      "type": "SubTypeCondition",
                      "equipmentTypes": [
                              "IDOL_1x2"
                      ],
                      "subTypes": [
                              1
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              880,
                              891
                      ],
                      "comparison": "ANY",
                      "comparisonValue": 1,
                      "minOnTheSameItem": 2
              }
      ],
      color: 15,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Strict - Stout Idols',
      soundId: 0,
      beamId: 0,
      order: 2,
    },
    {
      type: 'SHOW',
      conditions: [
              {
                      "type": "SubTypeCondition",
                      "equipmentTypes": [
                              "IDOL_3x1"
                      ],
                      "subTypes": [
                              5,
                              0
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              109,
                              234,
                              892
                      ],
                      "comparison": "ANY",
                      "comparisonValue": 1,
                      "minOnTheSameItem": 2
              }
      ],
      color: 15,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Strict - Grand Idols',
      soundId: 0,
      beamId: 0,
      order: 3,
    },
    {
      type: 'SHOW',
      conditions: [
              {
                      "type": "SubTypeCondition",
                      "equipmentTypes": [
                              "IDOL_1x3"
                      ],
                      "subTypes": [
                              5,
                              0
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              6,
                              506,
                              721,
                              504,
                              49,
                              86,
                              501,
                              52,
                              715,
                              27,
                              75,
                              36,
                              4,
                              330,
                              28,
                              25,
                              38,
                              16,
                              109,
                              234,
                              892,
                              218,
                              235,
                              257,
                              321,
                              835,
                              828,
                              880,
                              891,
                              838
                      ],
                      "comparison": "ANY",
                      "comparisonValue": 1,
                      "minOnTheSameItem": 2
              }
      ],
      color: 15,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Strict - Large Idols',
      soundId: 0,
      beamId: 0,
      order: 4,
    },
    {
      type: 'SHOW',
      conditions: [
              {
                      "type": "SubTypeCondition",
                      "equipmentTypes": [
                              "IDOL_4x1"
                      ],
                      "subTypes": [
                              5,
                              0
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              218,
                              235,
                              892
                      ],
                      "comparison": "ANY",
                      "comparisonValue": 1,
                      "minOnTheSameItem": 2
              }
      ],
      color: 15,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Strict - Ornate Idols',
      soundId: 0,
      beamId: 0,
      order: 5,
    }
  ] as Omit<Rule, 'id'>[],
};
