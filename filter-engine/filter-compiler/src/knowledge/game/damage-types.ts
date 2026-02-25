/**
 * damage-types.ts
 * Damage type profiles — which affixes are primary or synergistic
 * for each damage type. Uses real affix IDs from affixes.json.
 * Update when the game adds new damage types or affix interactions change.
 */

import type { Mastery } from './classes';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type DamageType =
  | 'fire' | 'cold' | 'lightning'
  | 'void' | 'necrotic' | 'poison'
  | 'physical'| '';

export interface DamageTypeProfile {
  readonly label: string;
  /**
   * Affixes this damage type directly scales.
   * High priority for any build using this damage type.
   */
  readonly primaryAffixIds: readonly number[];
  /**
   * Affixes that synergise with this damage type but aren't direct scalers.
   * E.g. penetration, ailment effect, crit for damage type.
   */
  readonly synergyAffixIds: readonly number[];
}

// ─────────────────────────────────────────────
// Damage Type Profiles
// Real affix IDs sourced from data/mappings/affixes.json
// ─────────────────────────────────────────────

export const DAMAGE_TYPE_PROFILES = {

  fire: {
    label: 'Fire',
    primaryAffixIds: [
      12,  // Increased Fire Damage
      32,  // Fire Penetration
      77,  // Added Melee Fire Damage
      127, // Idol Sentinel Increased Fire Damage Over Time
      177, // Idol Mage Increased Fire Damage Over Time
      182, // Idol Mage Fire Penetration With Ignite
      186, // Idol Mage Melee Fire Damage
      189, // Idol Mage Spell Fire Damage
      205, // Idol Sentinel Fire Penetration With Melee Attacks
      293, // Idol Acolyte Minion Increased Fire Damage
      371, // Sentinel Increased Fire Damage Over Time
      389, // Mage Increased Fire Damage Over Time
      434, // Added Bow Fire Damage
      465, // Idol Rogue Fire Penetration while wielding a dagger
      467, // Idol Rogue Fire Penetration With Ignite
      468, // Rogue Fire Penetration With Ignite
      55, // Chance To Ignite
      139, // Idol Ignite Chance
      180, // Idol Mage Chance To Ignite With Fire Skills
      182, // Idol Mage Fire Penetration With Ignite
      209, // Idol Sentinel Ignite Chance While High Health
      391, // Mage Chance To Ignite With Fire Skills
      467, // Idol Rogue Fire Penetration With Ignite
      468, // Rogue Fire Penetration With Ignite
      482, // Idol Rogue Chance to Ignite on Bow Hit
      483, // Rogue Chance to Ignite on Bow Hit
      //== Multi Affix==
      322, // Idol Shared Fire Damage
      361, // Sentinel Increased Fire Damage And Ignite Duration
      404, // Acolyte Shared Increased Fire Damage
      720, // Fire Penetration and Minion Fire Penetration
      848, // Idol Fire Penetration and Minion Fire Penetration
      876, // Idol Chance to Ignite on Hit and Fire Penetration with Ignite
      883, // Idol Fire Penetration and Minion Fire Penetration
    ],
    synergyAffixIds: [
      6,   // Critical Strike Chance
      7,   // Critical Strike Multiplier
      88,  // Cast Speed
      100, // Elemental Damage Over Time (if ignite build)
      117, // Elemental Resistance (defensive, always useful)
    ],
  },

  cold: {
    label: 'Cold',
    primaryAffixIds: [
    78, // Added Melee Cold Damage
    16, // Increased Cold Damage
    176, // Idol Mage Increased Cold Damage Over Time
    188, // Idol Mage Melee Cold Damage
    191, // Idol Mage Spell Cold Damage
    235, // Idol Primalist Increased Cold Damage Per Active Totem
    255, // Idol Mage Increased Cold Damage Doubled Over 300 Max Mana
    294, // Idol Acolyte Minion Increased Cold Damage
    388, // Mage Increased Cold Damage Over Time
    670, // Added Bow Cold Damage
    35,  // Cold Penetration
    183, // Idol Mage Cold Penetration With Frostbite
    339, // Mage Cold Penetration With Frostbite
    721, // Cold Penetration and Minion Cold Penetration
    847, // Idol Cold Penetration and Minion Cold Penetration
    882, // Idol Cold Penetration and Minion Cold Penetration
    163, // Idol Primalist Chance To Apply Frostbite With Cold Skills
    166, // Idol Mage Chance To Apply Frostbite With Cold Skills
    174, // Idol Mage Increased Frostbite Duration
    183, // Idol Mage Cold Penetration With Frostbite
    339, // Mage Cold Penetration With Frostbite
    387, // Mage Chance To Apply Frostbite With Cold Skills
    695, // Mage Frost Wall Duration and Frostbite Chance
    901, // Idol Frostbite Duration and Frostbite chance with Cold Skills
    56, // Chance To Chill
    47, // Chance To Chill Attackers
    217, // Idol Primalist Chance On 10 Mana Spent To Chill Nearby Enemies
    265, // Idol Acolye Chance To Chill With Necrotic Skills
    341, // Freeze Rate Per Stack of Chill
    ],
    synergyAffixIds: [
      6,   // Critical Strike Chance
      7,   // Critical Strike Multiplier
      88,  // Cast Speed
      100, // Elemental Damage Over Time
      117, // Elemental Resistance
    ],
  },

  lightning: {
    label: 'Lightning',
    primaryAffixIds: [
    79,  // Added Melee Lightning Damage
    23,  // Increased Lightning Damage
    187, // Idol Mage Melee Lightning Damage
    203, // Idol Sentinel Lightning Damage Taken As Physical
    252, // Idol Mage Increased Lightning Damage While You Have Lightning Aegis
    254, // Idol Mage Increased Lightning Damage Doubled Over 300 Max Mana
    301, // Idol Sentinel Lightning Damage With Hammer Throw
    669, // Added Bow Lightning Damage
    42,  // Lightning Damage And Leech
    169, // Idol Primalist Increased Cold And Lightning Damage
    320, // Idol Shared Lightning Damage
    333, // Primalist Shared Lightning Damage
    518, // Idol Rogue Lightning Damage with Shurikens
    519, // Rogue Lightning Damage with Shurikens
    39,  // Lightning Penetration
    722, // Lightning Penetration and Minion Lightning Penetration
    849, // Idol Lightning Penetration and Minion Lightning Penetration
    884, // Idol Lightning Penetration and Minion Lightning Penetration
    85,  // Chance To Shock
    94,  // Chance To Shock Attackers
    141, // Idol Shock Chance
    181, // Idol Mage Chance To Shock With Lightning Skills
    184, // Idol Mage Increased Shock Duration
    392, // Mage Chance To Shock With Lightning Skills
    665, // Primalist Upheaval Shockwave Chance
    877, // Idol Chance to Shock on Hit and Increased Shock Duration
    913, // Idol Shock duration and Endurance threshold against shocked enemies
    ],
    synergyAffixIds: [
      6,   // Critical Strike Chance
      7,   // Critical Strike Multiplier
      88,  // Cast Speed
      100, // Elemental Damage Over Time
      117, // Elemental Resistance
    ],
  },

  void: {
    label: 'Void',
    primaryAffixIds: [
    76,  // Added Melee Void Damage
    15,  // Increased Void Damage
    279, // Idol Sentinel Increased Void Damage For 4 Seconds When a Skill Echoes
    326, // Idol Sentinel Increased Melee Void Damage
    365, // Sentinel Void Damage Taken As Physical
    372, // Sentinel Increased Void Damage Over Time
    403, // Idol Sentinel Increased Void Damage Over Time
    323, // Idol Shared Void Damage
    362, // Sentinel Increased Void Damage And Added Spell Void Damage
    916, // Idol Chance to inflict Time Rot on hit with Void Skills and Increased Void Damage
    0,   // Void Penetration
    723, // Void Penetration and Minion Void Penetration
    831, // Idol Void Penetration and Minion Void Penetration
    864, // Idol Void Penetration and Minion Void Penetration
    ],
    synergyAffixIds: [
      1,   // Melee Damage (for VK melee void)
      6,   // Critical Strike Chance
      7,   // Critical Strike Multiplier
      87,  // Melee Attack Speed
    ],
  },

  necrotic: {
    label: 'Necrotic',
    primaryAffixIds: [
    18, // Increased Necrotic Damage
    366, // Sentinel Necrotic Damage Taken As Physical
    402, // Acolyte Necrotic Damage While Transformed
    324, // Idol Shared Necrotic Damage
    405, // Acolyte Shared Increased Necrotic Damage
    943, // Added Melee And Spell Necrotic Damage
    93, // Necrotic Penetration
    724, // Necrotic Penetration and Minion Necrotic Penetration
    834, // Idol Necrotic Penetration and Minion Necrotic Penetration
    863, // Idol Necrotic Penetration and Minion Necrotic Penetration
    ],
    synergyAffixIds: [
      6,   // Critical Strike Chance
      7,   // Critical Strike Multiplier
      88,  // Cast Speed
      252, // Minion Damage (for necromancer)
    ],
  },

  poison: {
    label: 'Poison',
    primaryAffixIds: [
    61, // Increased Poison Damage
    318, // Idol Acolyte Poison Damage during Aura of Decay
    367, // Sentinel Poison Damage Taken As Physical
    172, // Idol Primalist Increased Physical And Poison Damage
    325, // Idol Shared Poison Damage
    414, // Acolyte Poison Damage And Poison Resistance
    37, // Poison Penetration
    725, // Poison Penetration and Minion Poison Penetration
    832, // Idol Poison Penetration and Minion Poison Penetration
    859, // Idol Chance to Poison on Hit and Poison Penetration with Poison
    865, // Idol Poison Penetration and Minion Poison Penetration
    ],
    synergyAffixIds: [
      3,   // Added Melee Physical Damage (poison via physical)
      87,  // Melee Attack Speed (more hits = more poison)
      253, // Poison Chance on Hit
    ],
  },

  physical: {
    label: 'Physical',
    primaryAffixIds: [
    63, // Added Melee Physical Damage
    30, // Increased Physical Damage
    193, // Idol Sentinel Increased Physical Damage Over Time
    359, // Sentinel Melee Physical Damage If Wielding A Sword
    364, // Sentinel Melee Physical Damage If Wielding A Mace
    401, // Acolyte Physical Damage While Transformed
    433, // Added Bow Physical Damage
    466, // Idol Rogue Increased Physical Damage over Time
    470, // Idol Rogue Increased Throwing Physical Damage
    471, // Rogue Increased Throwing Physical Damage
    319, // Idol Shared Physical Damage
    360, // Sentinel Increased Physical Damage And Bleed Duration
    664, // Idol Primalist Melee Physical Damage For Swarm Strike and Locusts
    33, // Physical Penetration
    358, // Sentinel Physical Penetration With Bleed
    464, // Idol Rogue Physical Penetration while wielding a dagger
    486, // Idol Rogue Physical Penetration With Shadow Daggers
    487, // Rogue Physical Penetration With Shadow Daggers
    408, // Acolyte Shared Physical Penetration With Bleed
    719, // Physical Penetration and Minion Physical Penetration
    833, // Idol Physical Penetration and Minion Physical Penetration
    858, // Idol Chance to Inflict Bleed on Hit and Physical Penetration with Bleed
    866, // Idol Physical Penetration and Minion Physical Penetration
    68, // Chance to Inflict Bleed
    126, // Idol Primalist Cold Bleed Chance
    128, // Idol Sentinel Bleed Duration
    138, // Idol Bleed Chance
    152, // Idol Primalist Minion Bleed Chance
    208, // Idol Sentinel Bleed Chance While High Health
    290, // Idol Acolyte Physical Spell Bleed Chance
    347, // Primalist Minion Chance to Inflict Bleed On Hit
    358, // Sentinel Physical Penetration With Bleed
    363, // Sentinel Chance to Inflict Bleed If Wielding An Axe
    450, // Idol Rogue Bleed Chance per Equipped Sword
    451, // Rogue Bleed Chance per Equipped Sword
    493, // Idol Rogue Chance to Inflict Bleed on Bow Hit
    494, // Rogue Chance to Inflict Bleed on Bow Hit
    516, // Idol Rogue Bleed chance with Shurikens
    517, // Rogue Bleed Chance with Shurikens
    160, // Idol Primalist Shared Melee Bleed Chance
    161, // Idol Primalist Shared Bleed Duration
    343, // Primalist Shared Bleed Duration
    360, // Sentinel Increased Physical Damage And Bleed Duration
    406, // Acolyte Shared Bleed Chance
    407, // Acolyte Shared Increased Bleed Duration
    408, // Acolyte Shared Physical Penetration With Bleed
    740, // Idol Rogue Falcon Poison and Bleed Chance
    858, // Idol Chance to Inflict Bleed on Hit and Physical Penetration with Bleed
    938, // Idol Physical Resistance and Bleed Duration
    ],
    synergyAffixIds: [
      6,   // Critical Strike Chance
      7,   // Critical Strike Multiplier
      8,   // Melee Critical Strike Chance
      87,  // Melee Attack Speed
      254, // Armor Shred (scales physical hits)
    ],
  },

} as const satisfies Record<DamageType, DamageTypeProfile>;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function getPrimaryAffixes(damageType: DamageType): readonly number[] {
  return DAMAGE_TYPE_PROFILES[damageType].primaryAffixIds;
}

export function getSynergyAffixes(damageType: DamageType): readonly number[] {
  return DAMAGE_TYPE_PROFILES[damageType].synergyAffixIds;
}

export function getAllDamageTypes(): DamageType[] {
  return Object.keys(DAMAGE_TYPE_PROFILES) as DamageType[];
}
