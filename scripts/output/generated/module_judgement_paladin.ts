/**
 * Auto-generated Module: Judgement Paladin
 * Base Class: Sentinel
 *
 * This module adds Judgement-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const judgement_paladinModule = {
  id: 'judgement-paladin',
  name: 'Judgement (Paladin)',
  category: 'Build',
  description: 'Optimized rules for Judgement Paladin build. Hides items for other classes and highlights valuable Sentinel gear.',
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
      nameOverride: '[Judgement] Other Class Items',
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
                              829,
                              837,
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
                              848
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
                              135,
                              197,
                              923,
                              921
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
