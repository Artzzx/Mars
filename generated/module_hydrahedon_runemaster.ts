/**
 * Auto-generated Module: Hydrahedon RuneMaster
 * Base Class: Unknown
 *
 * This module adds Hydrahedon-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const hydrahedon_runemasterModule = {
  id: 'hydrahedon-runemaster',
  name: 'Hydrahedon (RuneMaster)',
  category: 'Build',
  description: 'Optimized rules for Hydrahedon RuneMaster build. Hides items for other classes and highlights valuable Unknown gear.',
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
      nameOverride: '[Hydrahedon] Other Class Items',
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
                              "IDOL_1x1_ETERRA"
                      ],
                      "subTypes": [
                              2
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              827,
                              837,
                              835,
                              836,
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
                              851,
                              842,
                              852,
                              848,
                              850
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
                              693,
                              504,
                              8,
                              97,
                              710,
                              86,
                              80,
                              12,
                              27,
                              75,
                              38,
                              19,
                              45,
                              824,
                              575,
                              53,
                              6,
                              720,
                              429,
                              28,
                              59,
                              58
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
