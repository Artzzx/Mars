/**
 * Auto-generated Module: LethalMirage BladeDancer
 * Base Class: Unknown
 *
 * This module adds LethalMirage-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const lethalmirage_bladedancerModule = {
  id: 'lethalmirage-bladedancer',
  name: 'LethalMirage (BladeDancer)',
  category: 'Build',
  description: 'Optimized rules for LethalMirage BladeDancer build. Hides items for other classes and highlights valuable Unknown gear.',
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
      nameOverride: '[LethalMirage] Other Class Items',
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
                              "IDOL_1x1_LAGON"
                      ],
                      "subTypes": [
                              1
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              842,
                              854
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
                              9,
                              4
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              52,
                              487,
                              715,
                              437,
                              481,
                              503,
                              25,
                              63,
                              30,
                              91,
                              27,
                              28,
                              36,
                              330,
                              75,
                              6,
                              33,
                              92,
                              507,
                              45,
                              2,
                              641,
                              7,
                              10,
                              505,
                              24,
                              429,
                              537,
                              86,
                              17,
                              88,
                              675,
                              842,
                              854,
                              486,
                              117,
                              933,
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
      nameOverride: 'Strict - Large Idols',
      soundId: 0,
      beamId: 0,
      order: 2,
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
      order: 3,
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
      order: 4,
    },
    {
      type: 'HIGHLIGHT',
      conditions: [
              {
                      "type": "AffixCondition",
                      "affixes": [
                              52,
                              487,
                              715,
                              437,
                              481,
                              503,
                              25,
                              63,
                              30,
                              91,
                              27,
                              28,
                              36,
                              330,
                              75,
                              6,
                              33,
                              92,
                              507,
                              45,
                              2,
                              641,
                              7,
                              10,
                              505,
                              24,
                              429,
                              537,
                              86,
                              17,
                              88,
                              675
                      ],
                      "comparison": "MORE_OR_EQUAL",
                      "comparisonValue": 7,
                      "minOnTheSameItem": 1
              },
              {
                      "type": "SubTypeCondition",
                      "equipmentTypes": [
                              "TWO_HANDED_SWORD",
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
