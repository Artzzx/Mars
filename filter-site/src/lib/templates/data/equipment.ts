/**
 * Equipment Type Groupings
 *
 * Organizes equipment types into logical groups for easier
 * rule generation and selection.
 */

import type { EquipmentType } from '../../filters/types';
import type { EquipmentGroup } from '../core/types';

// ============================================================================
// Equipment Groups
// ============================================================================

export const EQUIPMENT_GROUPS: EquipmentGroup[] = [
  // Weapons - One Handed
  {
    id: 'one-handed-melee',
    name: 'One-Handed Melee',
    types: ['ONE_HANDED_AXE', 'ONE_HANDED_MACES', 'ONE_HANDED_SWORD', 'ONE_HANDED_DAGGER', 'ONE_HANDED_SCEPTRE'],
    category: 'weapon',
  },
  {
    id: 'one-handed-ranged',
    name: 'One-Handed Ranged',
    types: ['WAND'],
    category: 'weapon',
  },

  // Weapons - Two Handed
  {
    id: 'two-handed-melee',
    name: 'Two-Handed Melee',
    types: ['TWO_HANDED_AXE', 'TWO_HANDED_MACE', 'TWO_HANDED_SWORD', 'TWO_HANDED_SPEAR'],
    category: 'weapon',
  },
  {
    id: 'two-handed-ranged',
    name: 'Two-Handed Ranged',
    types: ['BOW'],
    category: 'weapon',
  },
  {
    id: 'two-handed-caster',
    name: 'Two-Handed Caster',
    types: ['TWO_HANDED_STAFF'],
    category: 'weapon',
  },

  // Weapon type groups
  {
    id: 'all-swords',
    name: 'All Swords',
    types: ['ONE_HANDED_SWORD', 'TWO_HANDED_SWORD'],
    category: 'weapon',
  },
  {
    id: 'all-axes',
    name: 'All Axes',
    types: ['ONE_HANDED_AXE', 'TWO_HANDED_AXE'],
    category: 'weapon',
  },
  {
    id: 'all-maces',
    name: 'All Maces',
    types: ['ONE_HANDED_MACES', 'TWO_HANDED_MACE'],
    category: 'weapon',
  },
  {
    id: 'caster-weapons',
    name: 'Caster Weapons',
    types: ['WAND', 'ONE_HANDED_SCEPTRE', 'TWO_HANDED_STAFF'],
    category: 'weapon',
  },

  // Armor
  {
    id: 'body-armor',
    name: 'Body Armor',
    types: ['BODY_ARMOR'],
    category: 'armor',
  },
  {
    id: 'helmet',
    name: 'Helmet',
    types: ['HELMET'],
    category: 'armor',
  },
  {
    id: 'gloves',
    name: 'Gloves',
    types: ['GLOVES'],
    category: 'armor',
  },
  {
    id: 'boots',
    name: 'Boots',
    types: ['BOOTS'],
    category: 'armor',
  },
  {
    id: 'belt',
    name: 'Belt',
    types: ['BELT'],
    category: 'armor',
  },
  {
    id: 'all-armor',
    name: 'All Armor',
    types: ['BODY_ARMOR', 'HELMET', 'GLOVES', 'BOOTS', 'BELT'],
    category: 'armor',
  },

  // Off-hand
  {
    id: 'shields',
    name: 'Shields',
    types: ['SHIELD'],
    category: 'offhand',
  },
  {
    id: 'quiver',
    name: 'Quiver',
    types: ['QUIVER'],
    category: 'offhand',
  },
  {
    id: 'catalyst',
    name: 'Catalyst',
    types: ['CATALYST'],
    category: 'offhand',
  },
  {
    id: 'all-offhand',
    name: 'All Off-Hand',
    types: ['SHIELD', 'QUIVER', 'CATALYST'],
    category: 'offhand',
  },

  // Accessories
  {
    id: 'amulet',
    name: 'Amulet',
    types: ['AMULET'],
    category: 'accessory',
  },
  {
    id: 'ring',
    name: 'Ring',
    types: ['RING'],
    category: 'accessory',
  },
  {
    id: 'relic',
    name: 'Relic',
    types: ['RELIC'],
    category: 'accessory',
  },
  {
    id: 'all-accessories',
    name: 'All Accessories',
    types: ['AMULET', 'RING', 'RELIC'],
    category: 'accessory',
  },

  // Idols
  {
    id: 'small-idols',
    name: 'Small Idols (1x1)',
    types: ['IDOL_1x1_ETERRA', 'IDOL_1x1_LAGON'],
    category: 'idol',
  },
  {
    id: 'humble-idols',
    name: 'Humble Idols (1x2, 2x1)',
    types: ['IDOL_1x2', 'IDOL_2x1'],
    category: 'idol',
  },
  {
    id: 'stout-idols',
    name: 'Stout Idols (1x3, 3x1)',
    types: ['IDOL_1x3', 'IDOL_3x1'],
    category: 'idol',
  },
  {
    id: 'grand-idols',
    name: 'Grand Idols (1x4, 4x1)',
    types: ['IDOL_1x4', 'IDOL_4x1'],
    category: 'idol',
  },
  {
    id: 'large-idols',
    name: 'Large Idols (2x2)',
    types: ['IDOL_2x2'],
    category: 'idol',
  },
  {
    id: 'all-idols',
    name: 'All Idols',
    types: [
      'IDOL_1x1_ETERRA', 'IDOL_1x1_LAGON',
      'IDOL_1x2', 'IDOL_2x1',
      'IDOL_1x3', 'IDOL_3x1',
      'IDOL_1x4', 'IDOL_4x1',
      'IDOL_2x2',
    ],
    category: 'idol',
  },
];

// Lookup map
export const EQUIPMENT_GROUP_BY_ID = new Map<string, EquipmentGroup>(
  EQUIPMENT_GROUPS.map((g) => [g.id, g])
);

// ============================================================================
// Helper Functions
// ============================================================================

export function getEquipmentGroup(id: string): EquipmentGroup | undefined {
  return EQUIPMENT_GROUP_BY_ID.get(id);
}

export function getEquipmentGroupsByCategory(category: EquipmentGroup['category']): EquipmentGroup[] {
  return EQUIPMENT_GROUPS.filter((g) => g.category === category);
}

export function getEquipmentTypes(groupId: string): EquipmentType[] {
  return getEquipmentGroup(groupId)?.types || [];
}

export function getEquipmentName(type: EquipmentType): string {
  const NAMES: Record<EquipmentType, string> = {
    HELMET: 'Helmet',
    BODY_ARMOR: 'Body Armor',
    GLOVES: 'Gloves',
    BELT: 'Belt',
    BOOTS: 'Boots',
    ONE_HANDED_AXE: '1H Axe',
    ONE_HANDED_MACES: '1H Mace',
    ONE_HANDED_SWORD: '1H Sword',
    ONE_HANDED_DAGGER: 'Dagger',
    ONE_HANDED_SCEPTRE: 'Sceptre',
    TWO_HANDED_AXE: '2H Axe',
    TWO_HANDED_MACE: '2H Mace',
    TWO_HANDED_SPEAR: 'Spear',
    TWO_HANDED_STAFF: 'Staff',
    TWO_HANDED_SWORD: '2H Sword',
    WAND: 'Wand',
    BOW: 'Bow',
    SHIELD: 'Shield',
    QUIVER: 'Quiver',
    CATALYST: 'Catalyst',
    AMULET: 'Amulet',
    RING: 'Ring',
    RELIC: 'Relic',
    IDOL_1x1_ETERRA: '1x1 Idol',
    IDOL_1x1_LAGON: '1x1 Idol',
    IDOL_1x2: '1x2 Idol',
    IDOL_2x1: '2x1 Idol',
    IDOL_1x3: '1x3 Idol',
    IDOL_3x1: '3x1 Idol',
    IDOL_1x4: '1x4 Idol',
    IDOL_4x1: '4x1 Idol',
    IDOL_2x2: '2x2 Idol',
  };
  return NAMES[type] || type;
}

// Class-specific weapon preferences
export const CLASS_WEAPON_PREFERENCES: Record<string, EquipmentType[]> = {
  Sentinel: ['ONE_HANDED_SWORD', 'TWO_HANDED_SWORD', 'ONE_HANDED_MACES', 'TWO_HANDED_MACE', 'ONE_HANDED_AXE', 'TWO_HANDED_AXE'],
  Mage: ['WAND', 'ONE_HANDED_SCEPTRE', 'TWO_HANDED_STAFF'],
  Primalist: ['TWO_HANDED_AXE', 'TWO_HANDED_MACE', 'TWO_HANDED_STAFF', 'TWO_HANDED_SPEAR'],
  Rogue: ['ONE_HANDED_SWORD', 'ONE_HANDED_DAGGER', 'BOW'],
  Acolyte: ['WAND', 'ONE_HANDED_SCEPTRE', 'TWO_HANDED_STAFF'],
};

export const CLASS_OFFHAND_PREFERENCES: Record<string, EquipmentType[]> = {
  Sentinel: ['SHIELD'],
  Mage: ['CATALYST'],
  Primalist: ['SHIELD', 'CATALYST'],
  Rogue: ['QUIVER'],
  Acolyte: ['CATALYST'],
};
