/**
 * Auto-generated Module: Bear BeastMaster
 * Base Class: Unknown
 *
 * This module adds Bear-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const bear_beastmasterModule = {
  id: 'bear-beastmaster',
  name: 'Bear (BeastMaster)',
  category: 'Build',
  description: 'Optimized rules for Bear BeastMaster build. Hides items for other classes and highlights valuable Unknown gear.',
  rules: [
    // Hide items not usable by Unknown
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
      nameOverride: '[Bear] Other Class Items',
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
                              828,
                              836
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
                              837
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
                              629,
                              501,
                              52,
                              348,
                              64,
                              643,
                              2,
                              36,
                              429,
                              75,
                              28,
                              679,
                              25,
                              5,
                              6,
                              26,
                              555,
                              92,
                              80,
                              27,
                              336,
                              353,
                              86,
                              769,
                              45,
                              19,
                              81,
                              862,
                              837,
                              148,
                              925,
                              226,
                              893,
                              257,
                              899,
                              840,
                              828,
                              162,
                              836
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
                      "type": "SubTypeCondition",
                      "equipmentTypes": [
                              "IDOL_1x4"
                      ],
                      "subTypes": [
                              5,
                              0
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              148,
                              925,
                              226,
                              893
                      ],
                      "comparison": "ANY",
                      "comparisonValue": 1,
                      "minOnTheSameItem": 2
              }
      ],
      color: 15,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Strict - Huge Idols',
      soundId: 0,
      beamId: 0,
      order: 4,
    },
    {
      type: 'SHOW',
      conditions: [
              {
                      "type": "AffixCondition",
                      "affixes": [
                              769
                      ],
                      "comparison": "ANY",
                      "comparisonValue": 1,
                      "minOnTheSameItem": 1
              }
      ],
      color: 9,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Shatter / Removal / Important Affixes (Edit Affixes)',
      soundId: 0,
      beamId: 0,
      order: 5,
    }
  ] as Omit<Rule, 'id'>[],
};
