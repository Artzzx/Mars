// Last Epoch Filter Types based on game XML format
// Supports both v2 (1.0-1.2) and v5 (1.3+) formats

export type RuleType = 'SHOW' | 'HIDE' | 'HIGHLIGHT';

export type Rarity = 'NORMAL' | 'MAGIC' | 'RARE' | 'EXALTED' | 'UNIQUE' | 'SET' | 'LEGENDARY';

export type ComparisonType = 'ANY' | 'NONE' | 'MORE_OR_EQUAL' | 'LESS_OR_EQUAL' | 'EQUAL';

export type EquipmentType =
  // Armor
  | 'HELMET' | 'BODY_ARMOR' | 'GLOVES' | 'BELT' | 'BOOTS'
  // Weapons
  | 'ONE_HANDED_AXE' | 'ONE_HANDED_MACES' | 'ONE_HANDED_SWORD' | 'ONE_HANDED_DAGGER' | 'ONE_HANDED_SCEPTRE'
  | 'TWO_HANDED_AXE' | 'TWO_HANDED_MACE' | 'TWO_HANDED_SPEAR' | 'TWO_HANDED_STAFF' | 'TWO_HANDED_SWORD'
  | 'WAND' | 'BOW'
  // Off-hand
  | 'SHIELD' | 'QUIVER' | 'CATALYST'
  // Accessories
  | 'AMULET' | 'RING' | 'RELIC'
  // Idols
  | 'IDOL_1x1_ETERRA' | 'IDOL_1x1_LAGON'
  | 'IDOL_1x2' | 'IDOL_2x1'
  | 'IDOL_1x3' | 'IDOL_3x1'
  | 'IDOL_1x4' | 'IDOL_4x1'
  | 'IDOL_2x2';

export type CharacterClass = 'Primalist' | 'Mage' | 'Sentinel' | 'Rogue' | 'Acolyte';

// Filter version constants
export const FILTER_VERSION = {
  LEGACY: 2, // 1.0-1.2
  CURRENT: 5, // 1.3+
} as const;

export const GAME_VERSION = {
  LEGACY: '1.2.0',
  CURRENT: '1.3.0',
} as const;

// Condition Types
export interface BaseCondition {
  type: string;
}

export interface RarityCondition extends BaseCondition {
  type: 'RarityCondition';
  rarity: Rarity[];
  // v5 format uses min/max instead of required
  minLegendaryPotential: number | null;
  maxLegendaryPotential: number | null;
  minWeaversWill: number | null;
  maxWeaversWill: number | null;
  // Legacy v2 format fields (for backwards compatibility)
  advanced?: boolean;
  requiredLegendaryPotential?: number;
  requiredWeaversWill?: number;
}

export interface SubTypeCondition extends BaseCondition {
  type: 'SubTypeCondition';
  equipmentTypes: EquipmentType[];
  subTypes: number[]; // v5 uses int array
}

export interface AffixCondition extends BaseCondition {
  type: 'AffixCondition';
  affixes: number[];
  comparison: ComparisonType;
  comparisonValue: number;
  minOnTheSameItem: number;
  combinedComparison: ComparisonType;
  combinedComparisonValue: number;
  advanced: boolean;
}

export interface ClassCondition extends BaseCondition {
  type: 'ClassCondition';
  classes: CharacterClass[];
}

// v5 new condition types
export interface CharacterLevelCondition extends BaseCondition {
  type: 'CharacterLevelCondition';
  minimumLvl: number;
  maximumLvl: number;
}

export interface UniqueModifiersCondition extends BaseCondition {
  type: 'UniqueModifiersCondition';
  uniques: {
    uniqueId: number;
    rolls: number[];
  }[];
}

export type Condition =
  | RarityCondition
  | SubTypeCondition
  | AffixCondition
  | ClassCondition
  | CharacterLevelCondition
  | UniqueModifiersCondition;

// Rule Definition (supports both v2 and v5)
export interface Rule {
  id: string; // Client-side ID for React keys
  type: RuleType;
  conditions: Condition[];
  color: number;
  isEnabled: boolean;
  emphasized: boolean;
  nameOverride: string;
  // v5 new fields
  soundId: number;
  beamId: number;
  order: number;
  // Legacy v2 fields (converted to CharacterLevelCondition in v5)
  levelDependent?: boolean;
  minLvl?: number;
  maxLvl?: number;
}

// Filter Metadata
export interface FilterMetadata {
  name: string;
  filterIcon: number;
  filterIconColor: number;
  description: string;
  lastModifiedInVersion: string;
  lootFilterVersion: number;
}

// Complete Filter
export interface ItemFilter extends FilterMetadata {
  rules: Rule[];
}

// Check if filter is using legacy format
export function isLegacyFilter(filter: ItemFilter): boolean {
  return filter.lootFilterVersion < FILTER_VERSION.CURRENT;
}

// Get filter format version label
export function getFilterVersionLabel(filter: ItemFilter): string {
  if (filter.lootFilterVersion >= FILTER_VERSION.CURRENT) {
    return `v${filter.lootFilterVersion} (1.3+)`;
  }
  return `v${filter.lootFilterVersion} (Legacy)`;
}

// Template Types
export type TemplateType = 'leveling' | 'standard' | 'endgame' | 'hardcore';

export interface FilterTemplate {
  id: string;
  name: string;
  type: TemplateType;
  description: string;
  icon?: string;
  filter: ItemFilter;
}

// Module Types
export type ModuleCategory = 'playstyle' | 'economy' | 'class' | 'content';

export interface FilterModule {
  id: string;
  name: string;
  category: ModuleCategory;
  description: string;
  rules: Rule[];
  isEnabled: boolean;
}

// Strictness Levels
export type StrictnessLevel = 'soft' | 'regular' | 'semi-strict' | 'strict' | 'very-strict' | 'uber-strict' | 'uber-plus-strict';

export const STRICTNESS_LEVELS: { value: StrictnessLevel; label: string }[] = [
  { value: 'soft', label: 'SOFT' },
  { value: 'regular', label: 'REGULAR' },
  { value: 'semi-strict', label: 'SEMI-STRICT' },
  { value: 'strict', label: 'STRICT' },
  { value: 'very-strict', label: 'VERY STRICT' },
  { value: 'uber-strict', label: 'UBER STRICT' },
  { value: 'uber-plus-strict', label: 'UBER PLUS STRICT' },
];

// Color mapping for filter highlights
export const FILTER_COLORS: { id: number; name: string; hex: string }[] = [
  { id: 0, name: 'Gray', hex: '#888888' },
  { id: 1, name: 'Red', hex: '#ff4444' },
  { id: 2, name: 'Green', hex: '#44ff44' },
  { id: 3, name: 'Blue', hex: '#4444ff' },
  { id: 4, name: 'Yellow', hex: '#ffff44' },
  { id: 5, name: 'Orange', hex: '#ff8844' },
  { id: 6, name: 'Purple', hex: '#aa44ff' },
  { id: 7, name: 'Cyan', hex: '#44ffff' },
  { id: 8, name: 'Pink', hex: '#ff44aa' },
  { id: 9, name: 'White', hex: '#ffffff' },
  { id: 10, name: 'Gold', hex: '#ffd700' },
  { id: 11, name: 'Teal', hex: '#00d4d4' },
  { id: 12, name: 'Light Green', hex: '#90ee90' },
  { id: 13, name: 'Salmon', hex: '#ffa07a' },
  { id: 14, name: 'Plum', hex: '#dda0dd' },
  { id: 15, name: 'Sky Blue', hex: '#87ceeb' },
];

// Sound effects for v5 filters
export const FILTER_SOUNDS: { id: number; name: string }[] = [
  { id: 0, name: 'None' },
  { id: 1, name: 'Soft Ping' },
  { id: 2, name: 'Chime' },
  { id: 3, name: 'Bell' },
  { id: 4, name: 'Alert' },
  { id: 5, name: 'Fanfare' },
  { id: 6, name: 'Epic' },
  { id: 7, name: 'Legendary' },
];

// Beam effects for v5 filters
export const FILTER_BEAMS: { id: number; name: string }[] = [
  { id: 0, name: 'None' },
  { id: 1, name: 'White' },
  { id: 2, name: 'Blue' },
  { id: 3, name: 'Yellow' },
  { id: 4, name: 'Orange' },
  { id: 5, name: 'Purple' },
  { id: 6, name: 'Green' },
  { id: 7, name: 'Red' },
];

// Equipment type display names
export const EQUIPMENT_TYPE_NAMES: Record<EquipmentType, string> = {
  HELMET: 'Helmet',
  BODY_ARMOR: 'Body Armor',
  GLOVES: 'Gloves',
  BELT: 'Belt',
  BOOTS: 'Boots',
  ONE_HANDED_AXE: 'One-Handed Axe',
  ONE_HANDED_MACES: 'One-Handed Mace',
  ONE_HANDED_SWORD: 'One-Handed Sword',
  ONE_HANDED_DAGGER: 'Dagger',
  ONE_HANDED_SCEPTRE: 'Sceptre',
  TWO_HANDED_AXE: 'Two-Handed Axe',
  TWO_HANDED_MACE: 'Two-Handed Mace',
  TWO_HANDED_SPEAR: 'Spear',
  TWO_HANDED_STAFF: 'Staff',
  TWO_HANDED_SWORD: 'Two-Handed Sword',
  WAND: 'Wand',
  BOW: 'Bow',
  SHIELD: 'Shield',
  QUIVER: 'Quiver',
  CATALYST: 'Catalyst',
  AMULET: 'Amulet',
  RING: 'Ring',
  RELIC: 'Relic',
  IDOL_1x1_ETERRA: 'Idol (1x1 Eterra)',
  IDOL_1x1_LAGON: 'Idol (1x1 Lagon)',
  IDOL_1x2: 'Idol (1x2)',
  IDOL_2x1: 'Idol (2x1)',
  IDOL_1x3: 'Idol (1x3)',
  IDOL_3x1: 'Idol (3x1)',
  IDOL_1x4: 'Idol (1x4)',
  IDOL_4x1: 'Idol (4x1)',
  IDOL_2x2: 'Idol (2x2)',
};

// Create a new empty rule (v5 format)
export function createEmptyRule(): Rule {
  return {
    id: crypto.randomUUID(),
    type: 'SHOW',
    conditions: [],
    color: 0,
    isEnabled: true,
    emphasized: false,
    nameOverride: '',
    soundId: 0,
    beamId: 0,
    order: 0,
  };
}

// Create a new empty filter (v5 format)
export function createEmptyFilter(): ItemFilter {
  return {
    name: 'New Filter',
    filterIcon: 1,
    filterIconColor: 11,
    description: '',
    lastModifiedInVersion: GAME_VERSION.CURRENT,
    lootFilterVersion: FILTER_VERSION.CURRENT,
    rules: [],
  };
}

// Convert legacy v2 filter to v5 format
export function upgradeLegacyFilter(filter: ItemFilter): ItemFilter {
  if (!isLegacyFilter(filter)) {
    return filter;
  }

  const upgradedRules = filter.rules.map((rule, index) => {
    const upgradedRule: Rule = {
      ...rule,
      soundId: rule.soundId ?? 0,
      beamId: rule.beamId ?? 0,
      order: rule.order ?? index,
    };

    // Convert levelDependent to CharacterLevelCondition
    if (rule.levelDependent && (rule.minLvl || rule.maxLvl)) {
      const levelCondition: CharacterLevelCondition = {
        type: 'CharacterLevelCondition',
        minimumLvl: rule.minLvl || 0,
        maximumLvl: rule.maxLvl || 100,
      };
      upgradedRule.conditions = [...rule.conditions, levelCondition];
    }

    // Remove legacy fields
    delete upgradedRule.levelDependent;
    delete upgradedRule.minLvl;
    delete upgradedRule.maxLvl;

    // Upgrade RarityConditions
    upgradedRule.conditions = upgradedRule.conditions.map((cond) => {
      if (cond.type === 'RarityCondition') {
        const rarityCondition = cond as RarityCondition;
        return {
          ...rarityCondition,
          minLegendaryPotential: rarityCondition.requiredLegendaryPotential ?? null,
          maxLegendaryPotential: null,
          minWeaversWill: rarityCondition.requiredWeaversWill ?? null,
          maxWeaversWill: null,
        };
      }
      return cond;
    });

    return upgradedRule;
  });

  return {
    ...filter,
    lastModifiedInVersion: GAME_VERSION.CURRENT,
    lootFilterVersion: FILTER_VERSION.CURRENT,
    rules: upgradedRules,
  };
}
