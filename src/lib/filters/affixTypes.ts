// Affix types based on merged_affixes.json structure

export interface AffixTier {
  tier: number;
  min: number;
  max: number;
  isPercent: boolean;
  text_raw: string;
}

export interface AffixProperty {
  modDisplayNameKey: string;
  modDisplayName: string;
  property: number;
  specialTag: number;
  tags: number;
  modifierType: number;
  setProperty: number;
  useGeneratedName: boolean;
}

export interface Affix {
  affixId: number;
  id: string;
  name: string;
  url: string;
  source_name_tunk: string;
  source_name_le: string;
  match_strategy: string;
  type: number; // 0 = prefix, 1 = suffix
  group: number;
  displayCategory: number;
  rarity: number;
  rarityTier: string;
  levelRequirement: number;
  classSpecificity: number;
  canRollOn: number[];
  affixProperties: AffixProperty[];
  tiers: AffixTier[];
}

export interface AffixDatabase {
  count_merged: number;
  count_unmatched: number;
  merged: Affix[];
}

// Class specificity bit flags
export const CLASS_SPECIFICITY = {
  ALL: 0,
  SENTINEL: 1,
  MAGE: 2,
  ACOLYTE: 4,
  PRIMALIST: 8,
  ROGUE: 16,
} as const;

// Affix type names
export const AFFIX_TYPE = {
  0: 'Prefix',
  1: 'Suffix',
} as const;

// Display category names (based on game data)
export const DISPLAY_CATEGORIES: Record<number, string> = {
  0: 'Offensive',
  1: 'Defensive',
  2: 'Attributes',
  3: 'Resistances',
  4: 'Critical',
  5: 'Life/Mana',
  6: 'Minion',
  7: 'Ailment',
  8: 'Movement',
  9: 'Utility',
  10: 'Damage Over Time',
  11: 'Leech',
  12: 'Penetration',
  13: 'Block',
  14: 'Dodge',
  15: 'Armor',
  16: 'Ward',
  17: 'Health Regen',
  18: 'Mana Regen',
  19: 'Cooldown',
  20: 'Cast Speed',
  21: 'Attack Speed',
  22: 'Spell Damage',
  23: 'Melee Damage',
  24: 'Minion Damage',
  25: 'Physical Damage',
  26: 'Elemental Damage',
  27: 'Fire Damage',
  28: 'Cold Damage',
  29: 'Lightning Damage',
  30: 'Necrotic Damage',
  31: 'Void Damage',
  32: 'Poison Damage',
  33: 'Throwing',
  34: 'Bow',
  35: 'Companion',
  36: 'Totem',
  37: 'Abyssal',
  38: 'Other',
};

// Get class name from specificity
export function getClassFromSpecificity(specificity: number): string[] {
  if (specificity === 0) return ['All Classes'];

  const classes: string[] = [];
  if (specificity & CLASS_SPECIFICITY.SENTINEL) classes.push('Sentinel');
  if (specificity & CLASS_SPECIFICITY.MAGE) classes.push('Mage');
  if (specificity & CLASS_SPECIFICITY.ACOLYTE) classes.push('Acolyte');
  if (specificity & CLASS_SPECIFICITY.PRIMALIST) classes.push('Primalist');
  if (specificity & CLASS_SPECIFICITY.ROGUE) classes.push('Rogue');

  return classes.length > 0 ? classes : ['All Classes'];
}

// Search/filter affixes
export function searchAffixes(
  affixes: Affix[],
  query: string,
  filters?: {
    type?: number;
    classSpecificity?: number;
    minTier?: number;
    maxLevelReq?: number;
  }
): Affix[] {
  let results = affixes;

  // Text search
  if (query.trim()) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(
      (affix) =>
        affix.name.toLowerCase().includes(lowerQuery) ||
        affix.affixId.toString() === query ||
        affix.tiers.some((t) => t.text_raw.toLowerCase().includes(lowerQuery))
    );
  }

  // Apply filters
  if (filters) {
    if (filters.type !== undefined) {
      results = results.filter((a) => a.type === filters.type);
    }
    if (filters.classSpecificity !== undefined && filters.classSpecificity > 0) {
      results = results.filter(
        (a) => a.classSpecificity === 0 || (a.classSpecificity & filters.classSpecificity!) !== 0
      );
    }
    if (filters.minTier !== undefined) {
      results = results.filter((a) => a.tiers.length >= filters.minTier!);
    }
    if (filters.maxLevelReq !== undefined) {
      results = results.filter((a) => a.levelRequirement <= filters.maxLevelReq!);
    }
  }

  return results;
}
