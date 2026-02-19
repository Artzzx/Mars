/**
 * Auto-generated Module: Tornado Druid
 * Base Class: Primalist
 *
 * This module adds Tornado-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const tornado_druidModule = {
  id: 'tornado-druid',
  name: 'Tornado (Druid)',
  category: 'Build',
  description: 'Optimized rules for Tornado Druid build. Hides items for other classes and highlights valuable Primalist gear.',
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
      nameOverride: '[Tornado] Other Class Items',
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
                              837,
                              830
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
                              157,
                              169,
                              892,
                              912
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
      order: 2,
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
                              4,
                              6,
                              722,
                              58,
                              52,
                              97,
                              338,
                              350,
                              75,
                              23,
                              36,
                              27,
                              19,
                              541,
                              86,
                              34,
                              10,
                              504,
                              501,
                              13,
                              45,
                              28,
                              38,
                              718,
                              157,
                              169,
                              892,
                              912,
                              162,
                              257,
                              170,
                              837,
                              830
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
      order: 3,
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
      order: 4,
    },
    {
      type: 'SHOW',
      conditions: [
              {
                      "type": "UniquesCondition"
              }
      ],
      color: 15,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Harbinger's Needle',
      soundId: 0,
      beamId: 0,
      order: 5,
    }
  ] as Omit<Rule, 'id'>[],
};
