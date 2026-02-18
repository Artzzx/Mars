/**
 * Auto-generated Module: LightningBlast RuneMaster
 * Base Class: Unknown
 *
 * This module adds LightningBlast-specific filter rules.
 */

import type { Rule } from '../../lib/filters/types';

export const lightningblast_runemasterModule = {
  id: 'lightningblast-runemaster',
  name: 'LightningBlast (RuneMaster)',
  category: 'Build',
  description: 'Optimized rules for LightningBlast RuneMaster build. Hides items for other classes and highlights valuable Unknown gear.',
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
      nameOverride: '[LightningBlast] Other Class Items',
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
                              838,
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
                              "IDOL_1x1_LAGON"
                      ],
                      "subTypes": [
                              1
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              850,
                              849
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
                              "IDOL_1x3"
                      ],
                      "subTypes": [
                              6,
                              1
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              84,
                              6,
                              7,
                              19,
                              23,
                              80,
                              715,
                              330,
                              768,
                              502,
                              5,
                              45,
                              381,
                              52,
                              722,
                              557,
                              820,
                              39,
                              38,
                              785,
                              28,
                              58,
                              4,
                              29,
                              36,
                              712,
                              252,
                              254,
                              936,
                              242,
                              320,
                              912,
                              112,
                              892,
                              117,
                              850,
                              849,
                              838,
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
                      "type": "SubTypeCondition",
                      "equipmentTypes": [
                              "IDOL_2x2"
                      ],
                      "subTypes": [
                              8,
                              1
                      ]
              },
              {
                      "type": "AffixCondition",
                      "affixes": [
                              252,
                              254,
                              936,
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
      nameOverride: 'Strict - Adorned Idols',
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
                              768
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
