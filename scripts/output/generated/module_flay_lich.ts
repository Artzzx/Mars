/**
 * Auto-generated Module: Flay Lich
 * Base Class: Acolyte
 *
 * This module adds Flay-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const flay_lichModule = {
  id: 'flay-lich',
  name: 'Flay (Lich)',
  category: 'Build',
  description: 'Optimized rules for Flay Lich build. Hides items for other classes and highlights valuable Acolyte gear.',
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
      nameOverride: '[Flay] Other Class Items',
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
                              843,
                              854,
                              851
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
                              "IDOL_1x2"
                      ],
                      "subTypes": [
                              1
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              876,
                              886,
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
      type: 'HIGHLIGHT',
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
                              34,
                              52,
                              402,
                              36,
                              18,
                              28,
                              25,
                              2,
                              943,
                              6,
                              724,
                              86,
                              428,
                              29,
                              502,
                              7,
                              38,
                              45,
                              92,
                              715,
                              416,
                              75,
                              843,
                              854,
                              876,
                              886,
                              851,
                              880,
                              941,
                              105,
                              899,
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
