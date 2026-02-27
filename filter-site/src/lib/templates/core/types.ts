/**
 * Template Engine Core Types
 *
 * This is the foundation of the template system. Templates are high-level
 * configurations that get compiled into filter rules.
 */

import type { CharacterClass, EquipmentType, Rarity, RuleType } from '../../filters/types';

// ============================================================================
// Affix System
// ============================================================================

export interface Affix {
  id: number;
  name: string;
  shortName: string; // For rule naming (e.g., "Crit Chance" instead of "Critical Strike Chance")
  tier: 'prefix' | 'suffix';
  category: AffixCategory;
  tags: string[]; // e.g., ['melee', 'physical', 'attack']
  classes?: CharacterClass[]; // If class-specific
  maxTier: number; // T1-T7
}

export type AffixCategory =
  | 'offensive'
  | 'defensive'
  | 'utility'
  | 'minion'
  | 'elemental'
  | 'physical'
  | 'dot'
  | 'crit'
  | 'mana'
  | 'health'
  | 'resistance'
  | 'attribute';

// ============================================================================
// Equipment Groupings
// ============================================================================

export interface EquipmentGroup {
  id: string;
  name: string;
  types: EquipmentType[];
  category: 'weapon' | 'armor' | 'accessory' | 'idol' | 'offhand';
}

// ============================================================================
// Build Profile
// ============================================================================

export interface BuildProfile {
  id: string;
  name: string;
  displayName: string; // e.g., "Warpath Void Knight"
  class: CharacterClass;
  ascendancy: string; // e.g., "Void Knight"

  // Core stats this build values
  primaryStats: string[]; // e.g., ['strength', 'vitality']
  damageTypes: DamageType[];

  // Valued affixes by priority (higher index = higher priority)
  valuedAffixes: {
    essential: number[]; // Must have
    high: number[]; // Very good
    medium: number[]; // Nice to have
    low: number[]; // Acceptable
  };

  // Equipment preferences
  weapons: EquipmentType[];
  offhand?: EquipmentType[];

  // Idol affixes (specific to this build)
  idolAffixes: {
    small: number[]; // 1x1 idols
    humble: number[]; // 1x2, 2x1
    stout: number[]; // 1x3, 3x1
    grand: number[]; // 1x4, 4x1
    large: number[]; // 2x2
  };
}

export type DamageType =
  | 'physical'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'void'
  | 'necrotic'
  | 'poison';

// ============================================================================
// Strictness Configuration
// ============================================================================

export interface StrictnessConfig {
  id: string;
  name: string;
  description: string;
  order: number;

  // Rarity handling
  showRarities: Rarity[];
  hideRarities: Rarity[];

  // Unique filtering
  minLegendaryPotential: number;
  minWeaversWill: number;

  // Exalted/Rare requirements
  minExaltedTier: number; // T5, T6, T7
  showRaresWithAffixes: boolean;
  minAffixMatches: number; // How many valued affixes needed

  // Idol strictness
  idolAffixRequirement: 'any' | 'one_valued' | 'two_valued' | 'perfect';

  // Normal/Magic items
  showNormalBases: boolean;
  showMagicItems: boolean;

  // Level-based hiding
  hideNormalAfterLevel: number;
  hideMagicAfterLevel: number;
  hideRareAfterLevel: number;
}

// ============================================================================
// Template Definition
// ============================================================================

export interface TemplateDefinition {
  id: string;
  name: string;
  version: string;
  description: string;

  // Target configuration
  targetClass?: CharacterClass;
  targetBuild?: string; // BuildProfile ID

  // Base strictness (can be overridden)
  baseStrictness: string; // StrictnessConfig ID

  // Rule sections (order matters!)
  sections: TemplateSection[];
}

export interface TemplateSection {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // Lower = earlier in filter

  // The rules to generate
  rules: TemplateRule[];
}

export interface TemplateRule {
  id: string;
  name: string; // Human-readable name
  namePattern: string; // Pattern for generated rule name, e.g., "{rarity} {slot}"
  type: RuleType;
  enabled: boolean;

  // Conditions (will be converted to filter conditions)
  conditions: TemplateCondition[];

  // Appearance
  color: number;
  emphasized: boolean;
  sound?: number;
  beam?: number;

  // Strictness overrides (optional)
  strictnessOverride?: Partial<StrictnessConfig>;
}

export type TemplateCondition =
  | { type: 'rarity'; rarities: Rarity[]; lp?: { min?: number; max?: number }; ww?: { min?: number; max?: number } }
  | { type: 'class'; classes: CharacterClass[] }
  | { type: 'equipment'; types: EquipmentType[] }
  | { type: 'equipmentGroup'; groupId: string }
  | { type: 'affix'; affixIds: number[]; comparison: 'any' | 'all' | 'count'; minCount?: number }
  | { type: 'affixCategory'; categories: AffixCategory[]; comparison: 'any' | 'all' }
  | { type: 'level'; min?: number; max?: number }
  | { type: 'subtype'; subtypes: number[] };

// ============================================================================
// Compiled Output
// ============================================================================

export interface CompiledRule {
  id: string;
  name: string; // Generated name like "EXALTED Helmet (T7 Crit)"
  type: RuleType;
  conditions: CompiledCondition[];
  color: number;
  isEnabled: boolean;
  emphasized: boolean;
  soundId: number;
  beamId: number;
  order: number;

  // Metadata for UI
  source: {
    templateId: string;
    sectionId: string;
    ruleId: string;
  };
}

export interface CompiledCondition {
  type: string;
  [key: string]: unknown;
}

// ============================================================================
// Engine Configuration
// ============================================================================

export interface EngineConfig {
  strictness: StrictnessConfig;
  build?: BuildProfile;
  selectedClasses: CharacterClass[];
  options: {
    includeUniques: boolean;
    includeIdols: boolean;
    includeSets: boolean;
    includeLegendary: boolean;
  };
}
