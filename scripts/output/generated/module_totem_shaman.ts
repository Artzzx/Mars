/**
 * Auto-generated Module: Totem Shaman
 * Base Class: Primalist
 *
 * This module adds Totem-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const totem_shamanModule = {
  id: 'totem-shaman',
  name: 'Totem (Shaman)',
  category: 'Build',
  description: 'Optimized rules for Totem Shaman build. Hides items for other classes and highlights valuable Primalist gear.',
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
      nameOverride: '[Totem] Other Class Items',
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
                              840,
                              828
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
                              "IDOL_1x1_LAGON"
                      ],
                      "subTypes": [
                              1
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              849,
                              320
                      ],
                      "comparison": "ANY",
                      "comparisonValue": 1,
                      "minOnTheSameItem": 2
              }
      ],
      color: 15,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Strict - Minor Idols',
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
                              151,
                              913,
                              914,
                              213
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
                              585,
                              352,
                              52,
                              19,
                              336,
                              342,
                              25,
                              28,
                              504,
                              36,
                              26,
                              59,
                              29,
                              34,
                              429,
                              75,
                              79,
                              718,
                              643,
                              102,
                              94,
                              679,
                              86,
                              85,
                              109,
                              151,
                              913,
                              914,
                              144,
                              926,
                              910,
                              257,
                              162,
                              849,
                              320,
                              840,
                              828,
                              213
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
                              144,
                              151,
                              926,
                              910
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
