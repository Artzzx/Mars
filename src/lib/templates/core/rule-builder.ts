/**
 * Rule Builder v2
 *
 * Generates properly formatted and named filter rules.
 *
 * IMPORTANT: In Last Epoch, rules at the TOP of the filter take priority.
 * So the order should be:
 * 1. HIGHLIGHT rules (most specific first)
 * 2. SHOW rules (specific exceptions)
 * 3. HIDE rules (general hiding, broadest last)
 */

import type { Rarity, RuleType, CharacterClass, EquipmentType, ComparisonType } from '../../filters/types';
import type { CompiledRule, CompiledCondition, BuildProfile, StrictnessConfig } from './types';
import { formatAffixList } from '../data/affixes';
import { getEquipmentGroup, getEquipmentName } from '../data/equipment';

// ============================================================================
// Priority Constants - Lower number = higher priority (top of filter)
// ============================================================================

const PRIORITY = {
  // Highest priority - always show these
  LEGENDARY: 10,
  UNIQUE_4LP: 20,
  UNIQUE_3LP: 25,
  UNIQUE_2LP: 30,
  UNIQUE_1LP: 35,
  UNIQUE_ANY: 40,

  // Build-specific highlights
  BUILD_EXALTED_WEAPON: 50,
  BUILD_EXALTED_ARMOR: 55,
  BUILD_IDOL: 60,

  // Generic highlights
  EXALTED_GENERIC: 70,
  SET_ITEM: 75,

  // Show rules for leveling
  RARE_WITH_AFFIXES: 100,
  RARE_LEVELING: 105,
  MAGIC_LEVELING: 110,
  NORMAL_LEVELING: 115,
  IDOL_GENERIC: 120,

  // Hide rules - lowest priority (but still processed top-down)
  HIDE_UNIQUE_LOW_LP: 200,
  HIDE_EXALTED: 210,
  HIDE_SET: 220,
  HIDE_RARE: 230,
  HIDE_MAGIC: 240,
  HIDE_NORMAL: 250,
  HIDE_OTHER_CLASS: 300, // Class filter last
};

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

/**
 * Generate a descriptive rule name
 */
export function generateRuleName(config: {
  type: RuleType;
  rarities?: Rarity[];
  equipment?: EquipmentType[];
  equipmentGroup?: string;
  affixes?: number[];
  lpMin?: number;
  lpMax?: number;
  classes?: CharacterClass[];
  levelMin?: number;
  levelMax?: number;
  buildName?: string;
  description?: string;
}): string {
  const parts: string[] = [];

  // Build tag first
  if (config.buildName) {
    parts.push(`[${config.buildName}]`);
  }

  // Rarity
  if (config.rarities?.length === 1) {
    parts.push(RARITY_NAMES[config.rarities[0]]);
  }

  // LP for uniques
  if (config.rarities?.includes('UNIQUE') && config.lpMin !== undefined && config.lpMin > 0) {
    parts.push(`(${config.lpMin}${config.lpMax ? `-${config.lpMax}` : '+'}LP)`);
  }

  // Equipment
  if (config.equipment?.length) {
    if (config.equipment.length === 1) {
      parts.push(getEquipmentName(config.equipment[0]));
    } else if (config.equipmentGroup) {
      const group = getEquipmentGroup(config.equipmentGroup);
      if (group) parts.push(group.name);
    } else {
      parts.push(`${config.equipment.length} types`);
    }
  }

  // Affixes - key part!
  if (config.affixes?.length) {
    const affixStr = formatAffixList(config.affixes, 3);
    if (affixStr) parts.push(`w/ ${affixStr}`);
  }

  // Level range
  if (config.levelMin || config.levelMax) {
    if (config.levelMin && config.levelMax && config.levelMax < 100) {
      parts.push(`Lv${config.levelMin}-${config.levelMax}`);
    } else if (config.levelMin && config.levelMin > 1) {
      parts.push(`Lv${config.levelMin}+`);
    } else if (config.levelMax && config.levelMax < 100) {
      parts.push(`Lv1-${config.levelMax}`);
    }
  }

  // Description override
  if (config.description) {
    return config.description;
  }

  return parts.join(' ') || 'Filter Rule';
}

// ============================================================================
// Condition Builders - Must match types.ts interfaces exactly!
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

/**
 * Build an AffixCondition with ALL required fields
 */
export function buildAffixCondition(
  affixIds: number[],
  comparison: ComparisonType = 'ANY',
  minOnSameItem = 1
): CompiledCondition {
  return {
    type: 'AffixCondition',
    affixes: affixIds,
    comparison: comparison,
    comparisonValue: minOnSameItem,
    minOnTheSameItem: minOnSameItem,
    // Required fields for the full AffixCondition interface
    combinedComparison: 'ANY' as ComparisonType,
    combinedComparisonValue: 0,
    advanced: false,
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
// Rule Factory
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
    priority?: number;
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
    order: options.priority ?? ruleCounter * 10,
    source: { templateId: '', sectionId: '', ruleId: '' },
  };
}

// ============================================================================
// Rule Generators
// ============================================================================

/**
 * Generate LEGENDARY rules (always highest priority)
 */
export function generateLegendaryRules(): CompiledRule[] {
  return [
    createRule(
      'HIGHLIGHT',
      'LEGENDARY',
      [buildRarityCondition(['LEGENDARY'])],
      { color: 5, emphasized: true, sound: 6, beam: 4, priority: PRIORITY.LEGENDARY }
    ),
  ];
}

/**
 * Generate UNIQUE rules with proper LP tiers
 * Higher LP = higher priority (shown first, before hide rules)
 */
export function generateUniqueRules(strictness: StrictnessConfig): CompiledRule[] {
  const rules: CompiledRule[] = [];

  // Always show 4LP uniques
  rules.push(
    createRule(
      'HIGHLIGHT',
      'Unique (4LP) - JACKPOT',
      [buildRarityCondition(['UNIQUE'], { minLP: 4 })],
      { color: 5, emphasized: true, sound: 6, beam: 4, priority: PRIORITY.UNIQUE_4LP }
    )
  );

  // Show 3LP uniques
  rules.push(
    createRule(
      'HIGHLIGHT',
      'Unique (3LP) - High Value',
      [buildRarityCondition(['UNIQUE'], { minLP: 3, maxLP: 3 })],
      { color: 5, emphasized: true, sound: 6, beam: 3, priority: PRIORITY.UNIQUE_3LP }
    )
  );

  // Show 2LP based on strictness
  if (strictness.minLegendaryPotential <= 2) {
    rules.push(
      createRule(
        'HIGHLIGHT',
        'Unique (2LP)',
        [buildRarityCondition(['UNIQUE'], { minLP: 2, maxLP: 2 })],
        { color: 5, emphasized: true, sound: 2, beam: 2, priority: PRIORITY.UNIQUE_2LP }
      )
    );
  }

  // Show 1LP based on strictness
  if (strictness.minLegendaryPotential <= 1) {
    rules.push(
      createRule(
        'HIGHLIGHT',
        'Unique (1LP)',
        [buildRarityCondition(['UNIQUE'], { minLP: 1, maxLP: 1 })],
        { color: 5, emphasized: true, sound: 1, beam: 1, priority: PRIORITY.UNIQUE_1LP }
      )
    );
  }

  // Show 0LP uniques at regular strictness
  if (strictness.minLegendaryPotential === 0) {
    rules.push(
      createRule(
        'HIGHLIGHT',
        'Unique (0LP)',
        [buildRarityCondition(['UNIQUE'], { minLP: 0, maxLP: 0 })],
        { color: 5, emphasized: false, sound: 1, beam: 0, priority: PRIORITY.UNIQUE_ANY }
      )
    );
  } else {
    // HIDE low LP uniques - comes AFTER the show rules due to higher priority number
    rules.push(
      createRule(
        'HIDE',
        `HIDE Unique (0-${strictness.minLegendaryPotential - 1}LP)`,
        [buildRarityCondition(['UNIQUE'], { minLP: 0, maxLP: strictness.minLegendaryPotential - 1 })],
        { priority: PRIORITY.HIDE_UNIQUE_LOW_LP }
      )
    );
  }

  return rules;
}

/**
 * Generate EXALTED rules with build-specific affix highlighting
 */
export function generateExaltedRules(
  strictness: StrictnessConfig,
  build?: BuildProfile
): CompiledRule[] {
  const rules: CompiledRule[] = [];

  if (build) {
    const buildTag = build.displayName.split(' ')[0];
    const essentialAffixes = build.valuedAffixes.essential;
    const highAffixes = build.valuedAffixes.high;
    const allGoodAffixes = [...essentialAffixes, ...highAffixes];

    // Exalted WEAPONS with essential affixes
    if (build.weapons.length > 0 && essentialAffixes.length > 0) {
      rules.push(
        createRule(
          'HIGHLIGHT',
          generateRuleName({
            type: 'HIGHLIGHT',
            rarities: ['EXALTED'],
            equipment: build.weapons,
            affixes: essentialAffixes,
            buildName: buildTag,
          }),
          [
            buildRarityCondition(['EXALTED']),
            buildEquipmentCondition(build.weapons),
            buildAffixCondition(essentialAffixes, 'ANY', 1),
          ],
          { color: 14, emphasized: true, sound: 3, beam: 2, priority: PRIORITY.BUILD_EXALTED_WEAPON }
        )
      );
    }

    // Exalted ARMOR with good affixes
    const armorTypes: EquipmentType[] = ['BODY_ARMOR', 'HELMET', 'GLOVES', 'BOOTS', 'BELT'];
    if (allGoodAffixes.length > 0) {
      rules.push(
        createRule(
          'HIGHLIGHT',
          generateRuleName({
            type: 'HIGHLIGHT',
            rarities: ['EXALTED'],
            equipmentGroup: 'all-armor',
            affixes: allGoodAffixes,
            buildName: buildTag,
          }),
          [
            buildRarityCondition(['EXALTED']),
            buildEquipmentCondition(armorTypes),
            buildAffixCondition(allGoodAffixes, 'ANY', 1),
          ],
          { color: 14, emphasized: true, sound: 2, beam: 1, priority: PRIORITY.BUILD_EXALTED_ARMOR }
        )
      );
    }

    // Exalted ACCESSORIES (rings, amulet, relic) with good affixes
    const accessoryTypes: EquipmentType[] = ['RING', 'AMULET', 'RELIC'];
    if (allGoodAffixes.length > 0) {
      rules.push(
        createRule(
          'HIGHLIGHT',
          generateRuleName({
            type: 'HIGHLIGHT',
            rarities: ['EXALTED'],
            equipmentGroup: 'all-accessories',
            affixes: allGoodAffixes,
            buildName: buildTag,
          }),
          [
            buildRarityCondition(['EXALTED']),
            buildEquipmentCondition(accessoryTypes),
            buildAffixCondition(allGoodAffixes, 'ANY', 1),
          ],
          { color: 14, emphasized: true, sound: 2, beam: 1, priority: PRIORITY.BUILD_EXALTED_ARMOR + 1 }
        )
      );
    }
  }

  // Generic exalted highlight (catches any exalted not matched above)
  if (!strictness.hideRarities.includes('EXALTED')) {
    rules.push(
      createRule(
        'HIGHLIGHT',
        'Exalted',
        [buildRarityCondition(['EXALTED'])],
        { color: 14, emphasized: false, sound: 2, beam: 1, priority: PRIORITY.EXALTED_GENERIC }
      )
    );
  } else {
    // Hide exalted in strict modes
    rules.push(
      createRule(
        'HIDE',
        'HIDE Exalted',
        [buildRarityCondition(['EXALTED'])],
        { priority: PRIORITY.HIDE_EXALTED }
      )
    );
  }

  return rules;
}

/**
 * Generate IDOL rules with build-specific affixes
 */
export function generateIdolRules(build?: BuildProfile): CompiledRule[] {
  const rules: CompiledRule[] = [];

  const smallIdols: EquipmentType[] = ['IDOL_1x1_ETERRA', 'IDOL_1x1_LAGON'];
  const humbleIdols: EquipmentType[] = ['IDOL_1x2', 'IDOL_2x1'];
  const stoutIdols: EquipmentType[] = ['IDOL_1x3', 'IDOL_3x1'];
  const grandIdols: EquipmentType[] = ['IDOL_1x4', 'IDOL_4x1'];
  const largeIdols: EquipmentType[] = ['IDOL_2x2'];
  const allIdols: EquipmentType[] = [...smallIdols, ...humbleIdols, ...stoutIdols, ...grandIdols, ...largeIdols];

  if (build) {
    const buildTag = build.displayName.split(' ')[0];

    // Small idols (1x1)
    if (build.idolAffixes.small.length > 0) {
      rules.push(
        createRule(
          'HIGHLIGHT',
          `[${buildTag}] Small Idol w/ ${formatAffixList(build.idolAffixes.small, 2)}`,
          [
            buildEquipmentCondition(smallIdols),
            buildAffixCondition(build.idolAffixes.small, 'ANY', 1),
          ],
          { color: 8, emphasized: true, sound: 1, beam: 1, priority: PRIORITY.BUILD_IDOL }
        )
      );
    }

    // Humble idols (1x2, 2x1)
    if (build.idolAffixes.humble.length > 0) {
      rules.push(
        createRule(
          'HIGHLIGHT',
          `[${buildTag}] Humble Idol w/ ${formatAffixList(build.idolAffixes.humble, 2)}`,
          [
            buildEquipmentCondition(humbleIdols),
            buildAffixCondition(build.idolAffixes.humble, 'ANY', 1),
          ],
          { color: 8, emphasized: true, sound: 1, beam: 1, priority: PRIORITY.BUILD_IDOL + 1 }
        )
      );
    }

    // Grand idols (1x4, 4x1)
    if (build.idolAffixes.grand.length > 0) {
      rules.push(
        createRule(
          'HIGHLIGHT',
          `[${buildTag}] Grand Idol w/ ${formatAffixList(build.idolAffixes.grand, 2)}`,
          [
            buildEquipmentCondition(grandIdols),
            buildAffixCondition(build.idolAffixes.grand, 'ANY', 1),
          ],
          { color: 8, emphasized: true, sound: 1, beam: 1, priority: PRIORITY.BUILD_IDOL + 2 }
        )
      );
    }

    // Large idols (2x2)
    if (build.idolAffixes.large.length > 0) {
      rules.push(
        createRule(
          'HIGHLIGHT',
          `[${buildTag}] Large Idol w/ ${formatAffixList(build.idolAffixes.large, 2)}`,
          [
            buildEquipmentCondition(largeIdols),
            buildAffixCondition(build.idolAffixes.large, 'ANY', 1),
          ],
          { color: 8, emphasized: true, sound: 1, beam: 1, priority: PRIORITY.BUILD_IDOL + 3 }
        )
      );
    }
  }

  // Generic idol show (catches all idols not matched above)
  rules.push(
    createRule(
      'SHOW',
      'Idol',
      [buildEquipmentCondition(allIdols)],
      { priority: PRIORITY.IDOL_GENERIC }
    )
  );

  return rules;
}

/**
 * Generate SET item rules
 */
export function generateSetRules(strictness: StrictnessConfig): CompiledRule[] {
  if (strictness.hideRarities.includes('SET')) {
    return [
      createRule(
        'HIDE',
        'HIDE Set Item',
        [buildRarityCondition(['SET'])],
        { priority: PRIORITY.HIDE_SET }
      ),
    ];
  }

  return [
    createRule(
      'HIGHLIGHT',
      'Set Item',
      [buildRarityCondition(['SET'])],
      { color: 12, emphasized: false, sound: 1, beam: 1, priority: PRIORITY.SET_ITEM }
    ),
  ];
}

/**
 * Generate RARE rules with affix filtering
 */
export function generateRareRules(
  strictness: StrictnessConfig,
  build?: BuildProfile
): CompiledRule[] {
  const rules: CompiledRule[] = [];

  // Show rares with good affixes (for build)
  if (build && strictness.showRaresWithAffixes) {
    const buildTag = build.displayName.split(' ')[0];
    const valuedAffixes = [...build.valuedAffixes.essential, ...build.valuedAffixes.high];

    if (valuedAffixes.length > 0) {
      rules.push(
        createRule(
          'SHOW',
          `[${buildTag}] Rare w/ ${formatAffixList(valuedAffixes, 2)}`,
          [
            buildRarityCondition(['RARE']),
            buildAffixCondition(valuedAffixes, 'MORE_OR_EQUAL', strictness.minAffixMatches),
          ],
          { priority: PRIORITY.RARE_WITH_AFFIXES }
        )
      );
    }
  }

  // Hide rares (after the show rules due to priority)
  if (strictness.hideRarities.includes('RARE')) {
    rules.push(
      createRule(
        'HIDE',
        'HIDE Rare',
        [buildRarityCondition(['RARE'])],
        { priority: PRIORITY.HIDE_RARE }
      )
    );
  } else if (strictness.hideRareAfterLevel < 100) {
    // Show during leveling
    rules.push(
      createRule(
        'SHOW',
        `Rare (Lv1-${strictness.hideRareAfterLevel})`,
        [
          buildRarityCondition(['RARE']),
          buildLevelCondition(1, strictness.hideRareAfterLevel),
        ],
        { priority: PRIORITY.RARE_LEVELING }
      )
    );
    // Hide after level threshold
    rules.push(
      createRule(
        'HIDE',
        `HIDE Rare (Lv${strictness.hideRareAfterLevel + 1}+)`,
        [
          buildRarityCondition(['RARE']),
          buildLevelCondition(strictness.hideRareAfterLevel + 1, 100),
        ],
        { priority: PRIORITY.HIDE_RARE }
      )
    );
  }

  return rules;
}

/**
 * Generate MAGIC/NORMAL (leveling) rules
 */
export function generateLevelingRules(strictness: StrictnessConfig): CompiledRule[] {
  const rules: CompiledRule[] = [];

  // MAGIC items
  if (strictness.hideRarities.includes('MAGIC')) {
    rules.push(
      createRule('HIDE', 'HIDE Magic', [buildRarityCondition(['MAGIC'])], { priority: PRIORITY.HIDE_MAGIC })
    );
  } else if (strictness.hideMagicAfterLevel < 100) {
    rules.push(
      createRule(
        'SHOW',
        `Magic (Lv1-${strictness.hideMagicAfterLevel})`,
        [buildRarityCondition(['MAGIC']), buildLevelCondition(1, strictness.hideMagicAfterLevel)],
        { priority: PRIORITY.MAGIC_LEVELING }
      )
    );
    rules.push(
      createRule(
        'HIDE',
        `HIDE Magic (Lv${strictness.hideMagicAfterLevel + 1}+)`,
        [buildRarityCondition(['MAGIC']), buildLevelCondition(strictness.hideMagicAfterLevel + 1, 100)],
        { priority: PRIORITY.HIDE_MAGIC }
      )
    );
  }

  // NORMAL items
  if (strictness.hideRarities.includes('NORMAL')) {
    rules.push(
      createRule('HIDE', 'HIDE Normal', [buildRarityCondition(['NORMAL'])], { priority: PRIORITY.HIDE_NORMAL })
    );
  } else if (strictness.hideNormalAfterLevel < 100) {
    rules.push(
      createRule(
        'SHOW',
        `Normal (Lv1-${strictness.hideNormalAfterLevel})`,
        [buildRarityCondition(['NORMAL']), buildLevelCondition(1, strictness.hideNormalAfterLevel)],
        { priority: PRIORITY.NORMAL_LEVELING }
      )
    );
    rules.push(
      createRule(
        'HIDE',
        `HIDE Normal (Lv${strictness.hideNormalAfterLevel + 1}+)`,
        [buildRarityCondition(['NORMAL']), buildLevelCondition(strictness.hideNormalAfterLevel + 1, 100)],
        { priority: PRIORITY.HIDE_NORMAL }
      )
    );
  }

  return rules;
}

/**
 * Generate CLASS filter rules (hides items for other classes)
 */
export function generateClassHideRules(selectedClasses: CharacterClass[]): CompiledRule[] {
  const ALL_CLASSES: CharacterClass[] = ['Sentinel', 'Mage', 'Primalist', 'Rogue', 'Acolyte'];
  const hiddenClasses = ALL_CLASSES.filter((c) => !selectedClasses.includes(c));

  if (hiddenClasses.length === 0 || hiddenClasses.length === 5) return [];

  return [
    createRule(
      'HIDE',
      `HIDE ${hiddenClasses.join('/')} Items`,
      [buildClassCondition(hiddenClasses)],
      { priority: PRIORITY.HIDE_OTHER_CLASS }
    ),
  ];
}
