/**
 * Auto-generated Module: ForgedWeapons ForgeGuard
 * Base Class: Unknown
 *
 * This module adds ForgedWeapons-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const forgedweapons_forgeguardModule = {
  id: 'forgedweapons-forgeguard',
  name: 'ForgedWeapons (ForgeGuard)',
  category: 'Build',
  description: 'Optimized rules for ForgedWeapons ForgeGuard build. Hides items for other classes and highlights valuable Unknown gear.',
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
      nameOverride: '[ForgedWeapons] Other Class Items',
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
                              848,
                              322
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
                              880,
                              322
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
                              "IDOL_4x1"
                      ],
                      "subTypes": [
                              7,
                              2
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              925,
                              110,
                              196,
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
      nameOverride: 'Strict - Ornate Idols',
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
