/**
 * Auto-generated Module: wraith Necromancer
 * Base Class: Acolyte
 *
 * This module adds wraith-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const wraith_necromancerModule = {
  id: 'wraith-necromancer',
  name: 'wraith (Necromancer)',
  category: 'Build',
  description: 'Optimized rules for wraith Necromancer build. Hides items for other classes and highlights valuable Acolyte gear.',
  rules: [
    // Hide items not usable by Acolyte
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
      nameOverride: '[wraith] Other Class Items',
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
                              "IDOL_1x3"
                      ],
                      "subTypes": [
                              8,
                              3
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              52,
                              715,
                              416,
                              502,
                              4,
                              643,
                              102,
                              759,
                              675,
                              429,
                              36,
                              75,
                              28,
                              679,
                              70,
                              45,
                              25,
                              26,
                              27,
                              297,
                              897,
                              941,
                              895,
                              316,
                              906,
                              287,
                              105
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
      order: 1,
    },
    {
      type: 'SHOW',
      conditions: [
              {
                      "type": "SubTypeCondition",
                      "equipmentTypes": [
                              "IDOL_2x2"
                      ],
                      "subTypes": [
                              10,
                              3
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              316,
                              897,
                              906,
                              287,
                              297
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
      order: 2,
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
      order: 3,
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
      order: 4,
    },
    {
      type: 'SHOW',
      conditions: [
              {
                      "type": "AffixCondition",
                      "affixes": [
                              52,
                              715,
                              416,
                              502,
                              4,
                              643,
                              102,
                              759,
                              675,
                              429,
                              36,
                              75,
                              28,
                              679,
                              70,
                              45,
                              25,
                              26,
                              27
                      ],
                      "comparison": "MORE_OR_EQUAL",
                      "comparisonValue": 7,
                      "minOnTheSameItem": 1
              },
              {
                      "type": "SubTypeCondition",
                      "equipmentTypes": [
                              "TWO_HANDED_STAFF",
                              "HELMET",
                              "BODY_ARMOR",
                              "BELT",
                              "BOOTS",
                              "GLOVES",
                              "AMULET",
                              "RING",
                              "RELIC"
                      ],
                      "subTypes": []
              }
      ],
      color: 7,
      isEnabled: true,
      emphasized: true,
      nameOverride: 'Wanted Tier 7 (Can Edit Affixes & Item Type)',
      soundId: 0,
      beamId: 0,
      order: 5,
    }
  ] as Omit<Rule, 'id'>[],
};
