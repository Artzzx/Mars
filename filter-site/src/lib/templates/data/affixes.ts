/**
 * Last Epoch Affix Database
 *
 * This contains affix IDs, names, and categories for generating
 * meaningful filter rules. Data sourced from game files.
 */

import type { Affix, AffixCategory } from '../core/types';

// ============================================================================
// Offensive Affixes
// ============================================================================

const MELEE_AFFIXES: Affix[] = [
  { id: 1, name: 'Melee Damage', shortName: 'Melee', tier: 'prefix', category: 'offensive', tags: ['melee', 'damage'], maxTier: 7 },
  { id: 2, name: 'Increased Melee Damage', shortName: 'Inc Melee', tier: 'prefix', category: 'offensive', tags: ['melee', 'damage'], maxTier: 7 },
  { id: 3, name: 'Added Melee Physical Damage', shortName: 'Flat Phys', tier: 'prefix', category: 'physical', tags: ['melee', 'physical'], maxTier: 7 },
  { id: 87, name: 'Melee Attack Speed', shortName: 'Melee AS', tier: 'suffix', category: 'offensive', tags: ['melee', 'attack_speed'], maxTier: 7 },
];

const SPELL_AFFIXES: Affix[] = [
  { id: 4, name: 'Spell Damage', shortName: 'Spell', tier: 'prefix', category: 'offensive', tags: ['spell', 'damage'], maxTier: 7 },
  { id: 5, name: 'Increased Spell Damage', shortName: 'Inc Spell', tier: 'prefix', category: 'offensive', tags: ['spell', 'damage'], maxTier: 7 },
  { id: 88, name: 'Cast Speed', shortName: 'Cast Speed', tier: 'suffix', category: 'offensive', tags: ['spell', 'cast_speed'], maxTier: 7 },
];

const CRIT_AFFIXES: Affix[] = [
  { id: 6, name: 'Critical Strike Chance', shortName: 'Crit', tier: 'suffix', category: 'crit', tags: ['crit'], maxTier: 7 },
  { id: 7, name: 'Critical Strike Multiplier', shortName: 'Crit Multi', tier: 'suffix', category: 'crit', tags: ['crit'], maxTier: 7 },
  { id: 8, name: 'Melee Critical Strike Chance', shortName: 'Melee Crit', tier: 'suffix', category: 'crit', tags: ['melee', 'crit'], maxTier: 7 },
  { id: 9, name: 'Spell Critical Strike Chance', shortName: 'Spell Crit', tier: 'suffix', category: 'crit', tags: ['spell', 'crit'], maxTier: 7 },
];

// ============================================================================
// Elemental Affixes
// ============================================================================

const FIRE_AFFIXES: Affix[] = [
  { id: 10, name: 'Added Fire Damage', shortName: 'Flat Fire', tier: 'prefix', category: 'elemental', tags: ['fire', 'damage'], maxTier: 7 },
  { id: 11, name: 'Increased Fire Damage', shortName: 'Inc Fire', tier: 'prefix', category: 'elemental', tags: ['fire', 'damage'], maxTier: 7 },
  { id: 12, name: 'Fire Penetration', shortName: 'Fire Pen', tier: 'suffix', category: 'elemental', tags: ['fire', 'penetration'], maxTier: 7 },
];

const COLD_AFFIXES: Affix[] = [
  { id: 13, name: 'Added Cold Damage', shortName: 'Flat Cold', tier: 'prefix', category: 'elemental', tags: ['cold', 'damage'], maxTier: 7 },
  { id: 14, name: 'Increased Cold Damage', shortName: 'Inc Cold', tier: 'prefix', category: 'elemental', tags: ['cold', 'damage'], maxTier: 7 },
  { id: 15, name: 'Cold Penetration', shortName: 'Cold Pen', tier: 'suffix', category: 'elemental', tags: ['cold', 'penetration'], maxTier: 7 },
  { id: 16, name: 'Freeze Rate Multiplier', shortName: 'Freeze Rate', tier: 'suffix', category: 'elemental', tags: ['cold', 'ailment'], maxTier: 7 },
];

const LIGHTNING_AFFIXES: Affix[] = [
  { id: 17, name: 'Added Lightning Damage', shortName: 'Flat Light', tier: 'prefix', category: 'elemental', tags: ['lightning', 'damage'], maxTier: 7 },
  { id: 18, name: 'Increased Lightning Damage', shortName: 'Inc Light', tier: 'prefix', category: 'elemental', tags: ['lightning', 'damage'], maxTier: 7 },
  { id: 19, name: 'Lightning Penetration', shortName: 'Light Pen', tier: 'suffix', category: 'elemental', tags: ['lightning', 'penetration'], maxTier: 7 },
  { id: 20, name: 'Shock Chance', shortName: 'Shock', tier: 'suffix', category: 'elemental', tags: ['lightning', 'ailment'], maxTier: 7 },
];

const VOID_AFFIXES: Affix[] = [
  { id: 21, name: 'Added Void Damage', shortName: 'Flat Void', tier: 'prefix', category: 'elemental', tags: ['void', 'damage'], maxTier: 7 },
  { id: 22, name: 'Increased Void Damage', shortName: 'Inc Void', tier: 'prefix', category: 'elemental', tags: ['void', 'damage'], maxTier: 7 },
  { id: 23, name: 'Void Penetration', shortName: 'Void Pen', tier: 'suffix', category: 'elemental', tags: ['void', 'penetration'], maxTier: 7 },
];

const NECROTIC_AFFIXES: Affix[] = [
  { id: 24, name: 'Added Necrotic Damage', shortName: 'Flat Necro', tier: 'prefix', category: 'elemental', tags: ['necrotic', 'damage'], maxTier: 7 },
  { id: 25, name: 'Increased Necrotic Damage', shortName: 'Inc Necro', tier: 'prefix', category: 'elemental', tags: ['necrotic', 'damage'], maxTier: 7 },
  { id: 26, name: 'Necrotic Penetration', shortName: 'Necro Pen', tier: 'suffix', category: 'elemental', tags: ['necrotic', 'penetration'], maxTier: 7 },
];

const PHYSICAL_AFFIXES: Affix[] = [
  { id: 27, name: 'Added Physical Damage', shortName: 'Flat Phys', tier: 'prefix', category: 'physical', tags: ['physical', 'damage'], maxTier: 7 },
  { id: 28, name: 'Increased Physical Damage', shortName: 'Inc Phys', tier: 'prefix', category: 'physical', tags: ['physical', 'damage'], maxTier: 7 },
  { id: 29, name: 'Physical Penetration', shortName: 'Phys Pen', tier: 'suffix', category: 'physical', tags: ['physical', 'penetration'], maxTier: 7 },
  { id: 30, name: 'Bleed Chance', shortName: 'Bleed', tier: 'suffix', category: 'physical', tags: ['physical', 'ailment', 'bleed'], maxTier: 7 },
];

// ============================================================================
// Defensive Affixes
// ============================================================================

const HEALTH_AFFIXES: Affix[] = [
  { id: 31, name: 'Health', shortName: 'Health', tier: 'prefix', category: 'health', tags: ['health', 'defensive'], maxTier: 7 },
  { id: 32, name: 'Increased Health', shortName: 'Inc Health', tier: 'prefix', category: 'health', tags: ['health', 'defensive'], maxTier: 7 },
  { id: 33, name: 'Health Regeneration', shortName: 'Health Regen', tier: 'suffix', category: 'health', tags: ['health', 'regen'], maxTier: 7 },
  { id: 34, name: 'Health on Hit', shortName: 'HoH', tier: 'suffix', category: 'health', tags: ['health', 'leech'], maxTier: 7 },
  { id: 35, name: 'Health Leech', shortName: 'Leech', tier: 'suffix', category: 'health', tags: ['health', 'leech'], maxTier: 7 },
];

const RESISTANCE_AFFIXES: Affix[] = [
  { id: 40, name: 'Fire Resistance', shortName: 'Fire Res', tier: 'suffix', category: 'resistance', tags: ['fire', 'resistance'], maxTier: 7 },
  { id: 41, name: 'Cold Resistance', shortName: 'Cold Res', tier: 'suffix', category: 'resistance', tags: ['cold', 'resistance'], maxTier: 7 },
  { id: 42, name: 'Lightning Resistance', shortName: 'Light Res', tier: 'suffix', category: 'resistance', tags: ['lightning', 'resistance'], maxTier: 7 },
  { id: 43, name: 'Void Resistance', shortName: 'Void Res', tier: 'suffix', category: 'resistance', tags: ['void', 'resistance'], maxTier: 7 },
  { id: 44, name: 'Necrotic Resistance', shortName: 'Necro Res', tier: 'suffix', category: 'resistance', tags: ['necrotic', 'resistance'], maxTier: 7 },
  { id: 45, name: 'Poison Resistance', shortName: 'Poison Res', tier: 'suffix', category: 'resistance', tags: ['poison', 'resistance'], maxTier: 7 },
  { id: 46, name: 'Physical Resistance', shortName: 'Phys Res', tier: 'suffix', category: 'resistance', tags: ['physical', 'resistance'], maxTier: 7 },
];

const ARMOR_AFFIXES: Affix[] = [
  { id: 50, name: 'Armor', shortName: 'Armor', tier: 'prefix', category: 'defensive', tags: ['armor', 'defensive'], maxTier: 7 },
  { id: 51, name: 'Increased Armor', shortName: 'Inc Armor', tier: 'prefix', category: 'defensive', tags: ['armor', 'defensive'], maxTier: 7 },
  { id: 52, name: 'Block Chance', shortName: 'Block', tier: 'suffix', category: 'defensive', tags: ['block', 'defensive'], maxTier: 7 },
  { id: 53, name: 'Block Effectiveness', shortName: 'Block Eff', tier: 'suffix', category: 'defensive', tags: ['block', 'defensive'], maxTier: 7 },
  { id: 54, name: 'Dodge Rating', shortName: 'Dodge', tier: 'suffix', category: 'defensive', tags: ['dodge', 'defensive'], maxTier: 7 },
  { id: 55, name: 'Glancing Blow Chance', shortName: 'Glancing', tier: 'suffix', category: 'defensive', tags: ['defensive'], maxTier: 7 },
];

// ============================================================================
// Attribute Affixes
// ============================================================================

const ATTRIBUTE_AFFIXES: Affix[] = [
  { id: 60, name: 'Strength', shortName: 'Str', tier: 'suffix', category: 'attribute', tags: ['strength', 'attribute'], maxTier: 7 },
  { id: 61, name: 'Dexterity', shortName: 'Dex', tier: 'suffix', category: 'attribute', tags: ['dexterity', 'attribute'], maxTier: 7 },
  { id: 62, name: 'Intelligence', shortName: 'Int', tier: 'suffix', category: 'attribute', tags: ['intelligence', 'attribute'], maxTier: 7 },
  { id: 63, name: 'Vitality', shortName: 'Vit', tier: 'suffix', category: 'attribute', tags: ['vitality', 'attribute'], maxTier: 7 },
  { id: 64, name: 'Attunement', shortName: 'Att', tier: 'suffix', category: 'attribute', tags: ['attunement', 'attribute'], maxTier: 7 },
];

// ============================================================================
// Mana Affixes
// ============================================================================

const MANA_AFFIXES: Affix[] = [
  { id: 70, name: 'Mana', shortName: 'Mana', tier: 'prefix', category: 'mana', tags: ['mana'], maxTier: 7 },
  { id: 71, name: 'Mana Regeneration', shortName: 'Mana Regen', tier: 'suffix', category: 'mana', tags: ['mana', 'regen'], maxTier: 7 },
  { id: 72, name: 'Mana Cost Reduction', shortName: 'Mana Cost', tier: 'suffix', category: 'mana', tags: ['mana', 'cost'], maxTier: 7 },
  { id: 73, name: 'Mana Efficiency', shortName: 'Mana Eff', tier: 'suffix', category: 'mana', tags: ['mana'], maxTier: 7 },
];

// ============================================================================
// Minion Affixes
// ============================================================================

const MINION_AFFIXES: Affix[] = [
  { id: 80, name: 'Minion Damage', shortName: 'Minion Dmg', tier: 'prefix', category: 'minion', tags: ['minion', 'damage'], maxTier: 7 },
  { id: 81, name: 'Minion Health', shortName: 'Minion HP', tier: 'prefix', category: 'minion', tags: ['minion', 'health'], maxTier: 7 },
  { id: 82, name: 'Minion Attack Speed', shortName: 'Minion AS', tier: 'suffix', category: 'minion', tags: ['minion', 'attack_speed'], maxTier: 7 },
  { id: 83, name: 'Minion Critical Strike Chance', shortName: 'Minion Crit', tier: 'suffix', category: 'minion', tags: ['minion', 'crit'], maxTier: 7 },
  { id: 84, name: 'Level of Minion Skills', shortName: 'Minion Lvl', tier: 'prefix', category: 'minion', tags: ['minion', 'skill'], maxTier: 5 },
];

// ============================================================================
// DoT Affixes
// ============================================================================

const DOT_AFFIXES: Affix[] = [
  { id: 90, name: 'Damage over Time', shortName: 'DoT', tier: 'prefix', category: 'dot', tags: ['dot', 'damage'], maxTier: 7 },
  { id: 91, name: 'Bleed Damage', shortName: 'Bleed Dmg', tier: 'prefix', category: 'dot', tags: ['bleed', 'dot'], maxTier: 7 },
  { id: 92, name: 'Poison Damage', shortName: 'Poison Dmg', tier: 'prefix', category: 'dot', tags: ['poison', 'dot'], maxTier: 7 },
  { id: 93, name: 'Ignite Damage', shortName: 'Ignite Dmg', tier: 'prefix', category: 'dot', tags: ['ignite', 'fire', 'dot'], maxTier: 7 },
  { id: 94, name: 'Increased DoT Duration', shortName: 'DoT Dur', tier: 'suffix', category: 'dot', tags: ['dot', 'duration'], maxTier: 7 },
];

// ============================================================================
// Utility Affixes
// ============================================================================

const UTILITY_AFFIXES: Affix[] = [
  { id: 100, name: 'Movement Speed', shortName: 'MS', tier: 'suffix', category: 'utility', tags: ['movement'], maxTier: 7 },
  { id: 101, name: 'Increased Area', shortName: 'Area', tier: 'suffix', category: 'utility', tags: ['area'], maxTier: 7 },
  { id: 102, name: 'Cooldown Recovery', shortName: 'CDR', tier: 'suffix', category: 'utility', tags: ['cooldown'], maxTier: 7 },
  { id: 103, name: 'Stun Avoidance', shortName: 'Stun Avoid', tier: 'suffix', category: 'utility', tags: ['defensive'], maxTier: 7 },
];

// ============================================================================
// Idol Affixes (Sample - these use different IDs in game)
// ============================================================================

const IDOL_AFFIXES: Affix[] = [
  // Sentinel Idols
  { id: 831, name: 'Chance to Gain Block on Hit', shortName: 'Block on Hit', tier: 'suffix', category: 'defensive', tags: ['sentinel', 'block'], maxTier: 3 },
  { id: 837, name: 'Void Damage per Strength', shortName: 'Void/Str', tier: 'prefix', category: 'elemental', tags: ['sentinel', 'void'], maxTier: 3 },
  { id: 843, name: 'Physical Damage per Vitality', shortName: 'Phys/Vit', tier: 'prefix', category: 'physical', tags: ['sentinel', 'physical'], maxTier: 3 },
  { id: 854, name: 'Armor Shred on Hit', shortName: 'Armor Shred', tier: 'suffix', category: 'offensive', tags: ['sentinel', 'shred'], maxTier: 3 },
  { id: 862, name: 'Increased Health', shortName: 'Inc HP', tier: 'prefix', category: 'health', tags: ['health'], maxTier: 3 },
  { id: 867, name: 'Increased Damage while Channelling', shortName: 'Channel Dmg', tier: 'prefix', category: 'offensive', tags: ['channel'], maxTier: 3 },
  { id: 869, name: 'Melee Void Damage', shortName: 'Melee Void', tier: 'prefix', category: 'elemental', tags: ['void', 'melee'], maxTier: 3 },
  { id: 872, name: 'Chance for Double Damage', shortName: 'Double Dmg', tier: 'suffix', category: 'offensive', tags: ['damage'], maxTier: 3 },
  { id: 892, name: 'Increased Stun Duration', shortName: 'Stun Dur', tier: 'suffix', category: 'offensive', tags: ['stun'], maxTier: 3 },
  { id: 894, name: 'Increased Physical Damage', shortName: 'Inc Phys', tier: 'prefix', category: 'physical', tags: ['physical'], maxTier: 3 },
];

// ============================================================================
// Combined Database
// ============================================================================

export const ALL_AFFIXES: Affix[] = [
  ...MELEE_AFFIXES,
  ...SPELL_AFFIXES,
  ...CRIT_AFFIXES,
  ...FIRE_AFFIXES,
  ...COLD_AFFIXES,
  ...LIGHTNING_AFFIXES,
  ...VOID_AFFIXES,
  ...NECROTIC_AFFIXES,
  ...PHYSICAL_AFFIXES,
  ...HEALTH_AFFIXES,
  ...RESISTANCE_AFFIXES,
  ...ARMOR_AFFIXES,
  ...ATTRIBUTE_AFFIXES,
  ...MANA_AFFIXES,
  ...MINION_AFFIXES,
  ...DOT_AFFIXES,
  ...UTILITY_AFFIXES,
  ...IDOL_AFFIXES,
];

// Lookup maps for fast access
export const AFFIX_BY_ID = new Map<number, Affix>(ALL_AFFIXES.map((a) => [a.id, a]));
export const AFFIXES_BY_CATEGORY = new Map<AffixCategory, Affix[]>();
export const AFFIXES_BY_TAG = new Map<string, Affix[]>();

// Build lookup maps
for (const affix of ALL_AFFIXES) {
  // By category
  if (!AFFIXES_BY_CATEGORY.has(affix.category)) {
    AFFIXES_BY_CATEGORY.set(affix.category, []);
  }
  AFFIXES_BY_CATEGORY.get(affix.category)!.push(affix);

  // By tag
  for (const tag of affix.tags) {
    if (!AFFIXES_BY_TAG.has(tag)) {
      AFFIXES_BY_TAG.set(tag, []);
    }
    AFFIXES_BY_TAG.get(tag)!.push(affix);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getAffixById(id: number): Affix | undefined {
  return AFFIX_BY_ID.get(id);
}

export function getAffixesByCategory(category: AffixCategory): Affix[] {
  return AFFIXES_BY_CATEGORY.get(category) || [];
}

export function getAffixesByTag(tag: string): Affix[] {
  return AFFIXES_BY_TAG.get(tag) || [];
}

export function getAffixesByTags(tags: string[], match: 'any' | 'all' = 'any'): Affix[] {
  if (match === 'any') {
    const result = new Set<Affix>();
    for (const tag of tags) {
      for (const affix of getAffixesByTag(tag)) {
        result.add(affix);
      }
    }
    return [...result];
  } else {
    return ALL_AFFIXES.filter((affix) => tags.every((tag) => affix.tags.includes(tag)));
  }
}

export function formatAffixList(affixIds: number[], maxDisplay = 3): string {
  const affixes = affixIds.map((id) => getAffixById(id)).filter((a): a is Affix => !!a);
  if (affixes.length === 0) return '';
  if (affixes.length <= maxDisplay) {
    return affixes.map((a) => a.shortName).join(', ');
  }
  return `${affixes.slice(0, maxDisplay).map((a) => a.shortName).join(', ')}+${affixes.length - maxDisplay}`;
}
