/**
 * Rule Builder
 *
 * Generates properly formatted and named filter rules from
 * template configurations. This is the heart of the template engine.
 */

import type { Rarity, RuleType, CharacterClass, EquipmentType } from '../../filters/types';
import type { CompiledRule, CompiledCondition, BuildProfile, StrictnessConfig } from './types';
import { formatAffixList } from '../data/affixes';
import { getEquipmentGroup, getEquipmentName } from '../data/equipment';

// ============================================================================
// Naming Utilities
// ============================================================================

const RARITY_NAMES: Record<Rarity, string> = {
  NORMAL: 'Normal',
  MAGIC: 'Magic',
  RARE: 'Rare',
  EXALTED: 'Exalted',
  UNIQUE: 'Unique',
  SET: 'Set',
  LEGENDARY: 'Legendary',
};

const RARITY_ABBREVIATIONS: Record<Rarity, string> = {
  NORMAL: 'N',
  MAGIC: 'M',
  RARE: 'R',
  EXALTED: 'EX',
  UNIQUE: 'UQ',
  SET: 'SET',
  LEGENDARY: 'LEG',
};

/**
 * Generate a descriptive rule name based on its configuration
 */
export function generateRuleName(config: {
  type: RuleType;
  rarities?: Rarity[];
  equipment?: EquipmentType[];
  equipmentGroup?: string;
  affixes?: number[];
  lpMin?: number;
  lpMax?: number;
  wwMin?: number;
  classes?: CharacterClass[];
  levelMin?: number;
  levelMax?: number;
  category?: string;
  buildName?: string;
}): string {
  const parts: string[] = [];

  // Rarity prefix
  if (config.rarities?.length) {
    if (config.rarities.length === 1) {
      parts.push(RARITY_NAMES[config.rarities[0]]);
    } else if (config.rarities.length <= 3) {
      parts.push(config.rarities.map((r) => RARITY_ABBREVIATIONS[r]).join('/'));
    }
  }

  // LP/WW for uniques
  if (config.rarities?.includes('UNIQUE')) {
    if (config.lpMin !== undefined && config.lpMin > 0) {
      parts.push(`${config.lpMin}+LP`);
    }
    if (config.wwMin !== undefined && config.wwMin > 0) {
      parts.push(`${config.wwMin}+WW`);
    }
  }

  // Equipment type
  if (config.equipment?.length) {
    if (config.equipment.length === 1) {
      parts.push(getEquipmentName(config.equipment[0]));
    } else if (config.equipment.length <= 2) {
      parts.push(config.equipment.map(getEquipmentName).join('/'));
    } else if (config.equipmentGroup) {
      const group = getEquipmentGroup(config.equipmentGroup);
      if (group) parts.push(group.name);
    }
  } else if (config.equipmentGroup) {
    const group = getEquipmentGroup(config.equipmentGroup);
    if (group) parts.push(group.name);
  }

  // Affixes
  if (config.affixes?.length) {
    const affixStr = formatAffixList(config.affixes, 2);
    if (affixStr) parts.push(`(${affixStr})`);
  }

  // Category tag
  if (config.category) {
    parts.push(`[${config.category}]`);
  }

  // Build name tag
  if (config.buildName) {
    parts.unshift(`[${config.buildName}]`);
  }

  // Level range
  if (config.levelMin !== undefined || config.levelMax !== undefined) {
    if (config.levelMin && config.levelMax) {
      parts.push(`Lv${config.levelMin}-${config.levelMax}`);
    } else if (config.levelMin) {
      parts.push(`Lv${config.levelMin}+`);
    } else if (config.levelMax) {
      parts.push(`Lv1-${config.levelMax}`);
    }
  }

  // Class restriction
  if (config.classes?.length && config.classes.length < 5) {
    if (config.classes.length === 1) {
      parts.push(`(${config.classes[0]})`);
    }
  }

  return parts.join(' ') || 'Filter Rule';
}

// ============================================================================
// Condition Builders
// ============================================================================

export function buildRarityCondition(
  rarities: Rarity[],
  options?: {
    minLP?: number;
    maxLP?: number;
    minWW?: number;
    maxWW?: number;
  }
): CompiledCondition {
  return {
    type: 'RarityCondition',
    rarity: rarities,
    minLegendaryPotential: options?.minLP ?? null,
    maxLegendaryPotential: options?.maxLP ?? null,
    minWeaversWill: options?.minWW ?? null,
    maxWeaversWill: options?.maxWW ?? null,
  };
}

export function buildClassCondition(classes: CharacterClass[]): CompiledCondition {
  return {
    type: 'ClassCondition',
    classes,
  };
}

export function buildEquipmentCondition(types: EquipmentType[], subtypes?: number[]): CompiledCondition {
  return {
    type: 'SubTypeCondition',
    equipmentTypes: types,
    subTypes: subtypes || [],
  };
}

export function buildAffixCondition(
  affixIds: number[],
  comparison: 'ANY' | 'NONE' | 'MORE_OR_EQUAL' | 'LESS_OR_EQUAL' | 'EQUAL' = 'ANY',
  minOnSameItem = 1
): CompiledCondition {
  return {
    type: 'AffixCondition',
    affixes: affixIds,
    comparsion: comparison, // Note: game uses "comparsion" (typo)
    comparsionValue: minOnSameItem,
    minOnTheSameItem: minOnSameItem,
  };
}

export function buildLevelCondition(min?: number, max?: number): CompiledCondition {
  return {
    type: 'CharacterLevelCondition',
    minimumLvl: min ?? 0,
    maximumLvl: max ?? 100,
  };
}

// ============================================================================
// Rule Factory Functions
// ============================================================================

let ruleCounter = 0;

function createRule(
  type: RuleType,
  name: string,
  conditions: CompiledCondition[],
  options: {
    color?: number;
    emphasized?: boolean;
    sound?: number;
    beam?: number;
    order?: number;
    source?: CompiledRule['source'];
  } = {}
): CompiledRule {
  return {
    id: `rule-${++ruleCounter}-${Date.now()}`,
    name,
    type,
    conditions,
    color: options.color ?? 0,
    isEnabled: true,
    emphasized: options.emphasized ?? false,
    soundId: options.sound ?? 0,
    beamId: options.beam ?? 0,
    order: options.order ?? ruleCounter,
    source: options.source ?? { templateId: '', sectionId: '', ruleId: '' },
  };
}

// ============================================================================
// High-Level Rule Generators
// ============================================================================

/**
 * Generate rules for hiding items of other classes
 */
export function generateClassHideRules(
  selectedClasses: CharacterClass[],
  order: number
): CompiledRule[] {
  const ALL_CLASSES: CharacterClass[] = ['Sentinel', 'Mage', 'Primalist', 'Rogue', 'Acolyte'];
  const hiddenClasses = ALL_CLASSES.filter((c) => !selectedClasses.includes(c));

  if (hiddenClasses.length === 0 || hiddenClasses.length === 5) return [];

  const name = `HIDE Non-${selectedClasses.join('/')} Class Items`;

  return [
    createRule('HIDE', name, [buildClassCondition(hiddenClasses)], {
      color: 0,
      order,
    }),
  ];
}

/**
 * Generate rules for uniques based on LP/WW requirements
 */
export function generateUniqueRules(strictness: StrictnessConfig, order: number): CompiledRule[] {
  const rules: CompiledRule[] = [];

  // Hide low LP uniques
  if (strictness.minLegendaryPotential > 0) {
    rules.push(
      createRule(
        'HIDE',
        `HIDE Unique (<${strictness.minLegendaryPotential}LP)`,
        [buildRarityCondition(['UNIQUE'], { minLP: 0, maxLP: strictness.minLegendaryPotential - 1 })],
        { color: 0, order: order++ }
      )
    );
  }

  // Highlight high LP uniques
  if (strictness.minLegendaryPotential >= 3) {
    rules.push(
      createRule(
        'HIGHLIGHT',
        `Unique (4LP) - TOP TIER`,
        [buildRarityCondition(['UNIQUE'], { minLP: 4 })],
        { color: 5, emphasized: true, sound: 6, beam: 4, order: order++ }
      )
    );
    rules.push(
      createRule(
        'HIGHLIGHT',
        `Unique (3LP) - HIGH VALUE`,
        [buildRarityCondition(['UNIQUE'], { minLP: 3, maxLP: 3 })],
        { color: 5, emphasized: true, sound: 6, beam: 3, order: order++ }
      )
    );
  }

  if (strictness.minLegendaryPotential >= 2) {
    rules.push(
      createRule(
        'HIGHLIGHT',
        `Unique (2LP)`,
        [buildRarityCondition(['UNIQUE'], { minLP: 2, maxLP: strictness.minLegendaryPotential >= 3 ? 2 : undefined })],
        { color: 5, emphasized: true, sound: 2, beam: 2, order: order++ }
      )
    );
  }

  if (strictness.minLegendaryPotential === 1) {
    rules.push(
      createRule(
        'HIGHLIGHT',
        `Unique (1+LP)`,
        [buildRarityCondition(['UNIQUE'], { minLP: 1 })],
        { color: 5, emphasized: true, sound: 1, beam: 1, order: order++ }
      )
    );
  }

  // Show all uniques at regular strictness
  if (strictness.minLegendaryPotential === 0) {
    rules.push(
      createRule(
        'HIGHLIGHT',
        `Unique`,
        [buildRarityCondition(['UNIQUE'])],
        { color: 5, emphasized: true, sound: 1, beam: 1, order: order++ }
      )
    );
  }

  return rules;
}

/**
 * Generate rules for exalted items
 */
export function generateExaltedRules(
  strictness: StrictnessConfig,
  build?: BuildProfile,
  order = 0
): CompiledRule[] {
  const rules: CompiledRule[] = [];

  // If we have a build, highlight exalteds with valued affixes
  if (build) {
    const essentialAffixes = build.valuedAffixes.essential;
    const highAffixes = build.valuedAffixes.high;

    // Essential affixes on weapons
    if (build.weapons.length > 0 && essentialAffixes.length > 0) {
      rules.push(
        createRule(
          'HIGHLIGHT',
          generateRuleName({
            type: 'HIGHLIGHT',
            rarities: ['EXALTED'],
            equipment: build.weapons,
            affixes: essentialAffixes,
            buildName: build.displayName.split(' ')[0], // First word of build name
          }),
          [
            buildRarityCondition(['EXALTED']),
            buildEquipmentCondition(build.weapons),
            buildAffixCondition(essentialAffixes, 'ANY', 1),
          ],
          { color: 14, emphasized: true, sound: 2, beam: 2, order: order++ }
        )
      );
    }

    // High-value affixes on armor
    if (highAffixes.length > 0) {
      rules.push(
        createRule(
          'HIGHLIGHT',
          `[${build.displayName.split(' ')[0]}] Exalted Armor (${formatAffixList(highAffixes, 2)})`,
          [
            buildRarityCondition(['EXALTED']),
            buildEquipmentCondition(['BODY_ARMOR', 'HELMET', 'GLOVES', 'BOOTS', 'BELT']),
            buildAffixCondition([...essentialAffixes, ...highAffixes], 'ANY', 1),
          ],
          { color: 14, emphasized: true, sound: 2, beam: 1, order: order++ }
        )
      );
    }
  }

  // Generic exalted highlighting based on strictness
  if (!strictness.hideRarities.includes('EXALTED')) {
    rules.push(
      createRule(
        'HIGHLIGHT',
        `Exalted Item`,
        [buildRarityCondition(['EXALTED'])],
        { color: 14, emphasized: true, sound: 2, beam: 1, order: order++ }
      )
    );
  } else {
    // Hide exalted in strict modes (will be overridden by specific rules above)
    rules.push(
      createRule(
        'HIDE',
        `HIDE Exalted (Strict Mode)`,
        [buildRarityCondition(['EXALTED'])],
        { color: 0, order: order + 100 }
      )
    );
  }

  return rules;
}

/**
 * Generate rules for rares based on strictness
 */
export function generateRareRules(
  strictness: StrictnessConfig,
  build?: BuildProfile,
  order = 0
): CompiledRule[] {
  const rules: CompiledRule[] = [];

  if (strictness.showRaresWithAffixes && build) {
    const valuedAffixes = [
      ...build.valuedAffixes.essential,
      ...build.valuedAffixes.high,
    ];

    // Show rares with valued affixes
    rules.push(
      createRule(
        'SHOW',
        `[${build.displayName.split(' ')[0]}] Rare with Good Affixes`,
        [
          buildRarityCondition(['RARE']),
          buildAffixCondition(valuedAffixes, 'MORE_OR_EQUAL', strictness.minAffixMatches),
        ],
        { color: 0, order: order++ }
      )
    );
  }

  // Hide rares after certain level
  if (strictness.hideRareAfterLevel < 100) {
    rules.push(
      createRule(
        'HIDE',
        `HIDE Rare (After Lv${strictness.hideRareAfterLevel})`,
        [buildRarityCondition(['RARE']), buildLevelCondition(strictness.hideRareAfterLevel + 1)],
        { color: 0, order: order + 100 }
      )
    );
  }

  // Or hide all rares
  if (strictness.hideRarities.includes('RARE')) {
    rules.push(
      createRule(
        'HIDE',
        `HIDE Rare`,
        [buildRarityCondition(['RARE'])],
        { color: 0, order: order + 101 }
      )
    );
  }

  return rules;
}

/**
 * Generate rules for normal/magic items
 */
export function generateLevelingRules(strictness: StrictnessConfig, order = 0): CompiledRule[] {
  const rules: CompiledRule[] = [];

  // Normal items
  if (strictness.showNormalBases) {
    rules.push(
      createRule(
        'SHOW',
        `Normal Item (Leveling)`,
        [buildRarityCondition(['NORMAL']), buildLevelCondition(1, strictness.hideNormalAfterLevel)],
        { color: 0, order: order++ }
      )
    );
  }

  if (strictness.hideNormalAfterLevel < 100) {
    rules.push(
      createRule(
        'HIDE',
        `HIDE Normal (After Lv${strictness.hideNormalAfterLevel})`,
        [buildRarityCondition(['NORMAL']), buildLevelCondition(strictness.hideNormalAfterLevel + 1)],
        { color: 0, order: order + 100 }
      )
    );
  }

  // Magic items
  if (strictness.showMagicItems) {
    rules.push(
      createRule(
        'SHOW',
        `Magic Item (Leveling)`,
        [buildRarityCondition(['MAGIC']), buildLevelCondition(1, strictness.hideMagicAfterLevel)],
        { color: 0, order: order++ }
      )
    );
  }

  if (strictness.hideMagicAfterLevel < 100) {
    rules.push(
      createRule(
        'HIDE',
        `HIDE Magic (After Lv${strictness.hideMagicAfterLevel})`,
        [buildRarityCondition(['MAGIC']), buildLevelCondition(strictness.hideMagicAfterLevel + 1)],
        { color: 0, order: order + 100 }
      )
    );
  }

  // Hide all if strict
  if (strictness.hideRarities.includes('NORMAL')) {
    rules.push(
      createRule('HIDE', `HIDE Normal`, [buildRarityCondition(['NORMAL'])], { color: 0, order: order + 102 })
    );
  }
  if (strictness.hideRarities.includes('MAGIC')) {
    rules.push(
      createRule('HIDE', `HIDE Magic`, [buildRarityCondition(['MAGIC'])], { color: 0, order: order + 103 })
    );
  }

  return rules;
}

/**
 * Generate rules for set items
 */
export function generateSetRules(strictness: StrictnessConfig, order = 0): CompiledRule[] {
  if (strictness.hideRarities.includes('SET')) {
    return [
      createRule('HIDE', `HIDE Set Item`, [buildRarityCondition(['SET'])], { color: 0, order: order + 100 }),
    ];
  }

  return [
    createRule(
      'HIGHLIGHT',
      `Set Item`,
      [buildRarityCondition(['SET'])],
      { color: 12, emphasized: false, sound: 1, beam: 1, order }
    ),
  ];
}

/**
 * Generate rules for idol filtering
 */
export function generateIdolRules(
  strictness: StrictnessConfig,
  build?: BuildProfile,
  order = 0
): CompiledRule[] {
  const rules: CompiledRule[] = [];
  const idolTypes: EquipmentType[] = [
    'IDOL_1x1_ETERRA',
    'IDOL_1x1_LAGON',
    'IDOL_1x2',
    'IDOL_2x1',
    'IDOL_1x3',
    'IDOL_3x1',
    'IDOL_1x4',
    'IDOL_4x1',
    'IDOL_2x2',
  ];

  if (build && strictness.idolAffixRequirement !== 'any') {
    // Get all idol affixes for this build
    const allIdolAffixes = [
      ...build.idolAffixes.small,
      ...build.idolAffixes.humble,
      ...build.idolAffixes.stout,
      ...build.idolAffixes.grand,
      ...build.idolAffixes.large,
    ].filter((v, i, a) => a.indexOf(v) === i); // unique

    if (allIdolAffixes.length > 0) {
      const minAffixes = strictness.idolAffixRequirement === 'perfect' ? 2 : 1;

      rules.push(
        createRule(
          'HIGHLIGHT',
          `[${build.displayName.split(' ')[0]}] Idol (${formatAffixList(allIdolAffixes, 2)})`,
          [
            buildEquipmentCondition(idolTypes),
            buildAffixCondition(allIdolAffixes, 'MORE_OR_EQUAL', minAffixes),
          ],
          { color: 8, emphasized: true, sound: 1, beam: 1, order: order++ }
        )
      );
    }
  }

  // Generic idol show
  rules.push(
    createRule(
      'SHOW',
      `Idol`,
      [buildEquipmentCondition(idolTypes)],
      { color: 0, order: order + 50 }
    )
  );

  return rules;
}

/**
 * Generate legendary highlight rules
 */
export function generateLegendaryRules(order = 0): CompiledRule[] {
  return [
    createRule(
      'HIGHLIGHT',
      `LEGENDARY - TOP TIER`,
      [buildRarityCondition(['LEGENDARY'])],
      { color: 5, emphasized: true, sound: 6, beam: 4, order }
    ),
  ];
}
