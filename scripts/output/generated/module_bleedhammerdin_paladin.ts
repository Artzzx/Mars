/**
 * Auto-generated Module: BleedHammerdin Paladin
 * Base Class: Sentinel
 *
 * This module adds BleedHammerdin-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const bleedhammerdin_paladinModule = {
  id: 'bleedhammerdin-paladin',
  name: 'BleedHammerdin (Paladin)',
  category: 'Build',
  description: 'Optimized rules for BleedHammerdin Paladin build. Hides items for other classes and highlights valuable Sentinel gear.',
  rules: [
    // Hide items not usable by Sentinel
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
      nameOverride: '[BleedHammerdin] Other Class Items',
      soundId: 0,
      beamId: 0,
      order: 0,
    },
    {
      type: 'HIGHLIGHT',
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
                              870,
                              869
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
      type: 'HIGHLIGHT',
      conditions: [
              {
                      "type": "SubTypeCondition",
                      "equipmentTypes": [
                              "IDOL_1x3"
                      ],
                      "subTypes": [
                              7,
                              2
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              28,
                              36,
                              25,
                              501,
                              358,
                              360,
                              52,
                              803,
                              715,
                              802,
                              75,
                              30,
                              87,
                              825,
                              507,
                              29,
                              72,
                              68,
                              3,
                              81,
                              74,
                              719,
                              56,
                              363,
                              804,
                              426,
                              276,
                              193,
                              923,
                              921,
                              128,
                              862,
                              870,
                              869,
                              197
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
      order: 2,
    },
    {
      type: 'HIGHLIGHT',
      conditions: [
              {
                      "type": "SubTypeCondition",
                      "equipmentTypes": [
                              "IDOL_2x2"
                      ],
                      "subTypes": [
                              9,
                              2
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              276,
                              193,
                              923,
                              921,
                              197
                      ],
                      "comparison": "ANY",
                      "comparisonValue": 1,
                      "minOnTheSameItem": 2
              }
      ],
      color: 15,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Strict - Adorned Idols',
      soundId: 0,
      beamId: 0,
      order: 3,
    },
    {
      type: 'HIGHLIGHT',
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
      type: 'HIGHLIGHT',
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
