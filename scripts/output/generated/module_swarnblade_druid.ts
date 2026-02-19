/**
 * Auto-generated Module: Swarnblade Druid
 * Base Class: Primalist
 *
 * This module adds Swarnblade-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const swarnblade_druidModule = {
  id: 'swarnblade-druid',
  name: 'Swarnblade (Druid)',
  category: 'Build',
  description: 'Optimized rules for Swarnblade Druid build. Hides items for other classes and highlights valuable Primalist gear.',
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
      nameOverride: '[Swarnblade] Other Class Items',
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
                              "IDOL_2x1"
                      ],
                      "subTypes": [
                              1
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              862,
                              868
                      ],
                      "comparison": "ANY",
                      "comparisonValue": 1,
                      "minOnTheSameItem": 2
              }
      ],
      color: 15,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Strict - Humble Idols',
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
                              891,
                              880
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
                              140,
                              116,
                              901
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
                              504,
                              100,
                              25,
                              45,
                              75,
                              36,
                              52,
                              10,
                              2,
                              72,
                              54,
                              68,
                              34,
                              19,
                              718,
                              28,
                              541,
                              16,
                              11,
                              29,
                              140,
                              116,
                              901,
                              257,
                              125,
                              862,
                              868,
                              891,
                              880,
                              162
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
                      "type": "UniquesCondition"
              }
      ],
      color: 14,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Primordial Uniques',
      soundId: 0,
      beamId: 0,
      order: 5,
    }
  ] as Omit<Rule, 'id'>[],
};
