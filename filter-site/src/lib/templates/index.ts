/**
 * Template Engine Public API
 *
 * This is the main entry point for the template system.
 */

// Core types
export type {
  Affix,
  AffixCategory,
  EquipmentGroup,
  BuildProfile,
  DamageType,
  StrictnessConfig,
  TemplateDefinition,
  TemplateSection,
  TemplateRule,
  TemplateCondition,
  CompiledRule,
  CompiledCondition,
  EngineConfig,
} from './core/types';

// Engine
export {
  compileFilter,
  generateBuildFilter,
  generateClassFilter,
  generateGenericFilter,
  getFilterStats,
  type CompileOptions,
  type FilterStats,
} from './core/engine';

// Rule builder utilities
export {
  generateRuleName,
  buildRarityCondition,
  buildClassCondition,
  buildEquipmentCondition,
  buildAffixCondition,
  buildLevelCondition,
  generateClassHideRules,
  generateUniqueRules,
  generateExaltedRules,
  generateRareRules,
  generateLevelingRules,
  generateSetRules,
  generateIdolRules,
  generateLegendaryRules,
} from './core/rule-builder';

// Data
export {
  ALL_AFFIXES,
  AFFIX_BY_ID,
  AFFIXES_BY_CATEGORY,
  AFFIXES_BY_TAG,
  getAffixById,
  getAffixesByCategory,
  getAffixesByTag,
  getAffixesByTags,
  formatAffixList,
} from './data/affixes';

export {
  EQUIPMENT_GROUPS,
  EQUIPMENT_GROUP_BY_ID,
  getEquipmentGroup,
  getEquipmentGroupsByCategory,
  getEquipmentTypes,
  getEquipmentName,
  CLASS_WEAPON_PREFERENCES,
  CLASS_OFFHAND_PREFERENCES,
} from './data/equipment';

// Schemas
export {
  STRICTNESS_CONFIGS,
  STRICTNESS_BY_ID,
  getStrictnessConfig,
  getDefaultStrictness,
  getStrictnessForLevel,
} from './schemas/strictness';

export {
  ALL_BUILDS,
  BUILD_BY_ID,
  BUILDS_BY_CLASS,
  getBuildById,
  getBuildsByClass,
  // Individual builds for direct import
  WARPATH_VOID_KNIGHT,
  JUDGEMENT_PALADIN,
  FROSTBITE_SORCERER,
  LIGHTNING_BLAST_RUNEMASTER,
  BEAR_BEASTMASTER,
  TORNADO_DRUID,
  SHADOW_CASCADE_BLADEDANCER,
  HEARTSEEKER_MARKSMAN,
  WRAITH_NECROMANCER,
  HARVEST_LICH,
} from './schemas/builds';
