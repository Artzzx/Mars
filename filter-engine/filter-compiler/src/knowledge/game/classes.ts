/**
 * classes.ts
 * Last Epoch class hierarchy — static game facts.
 * Update only when the game adds new classes or masteries.
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type BaseClass = 'primalist' | 'mage' | 'sentinel' | 'rogue' | 'acolyte';

export type Mastery =
  | 'beastmaster' | 'shaman'    | 'druid'
  | 'sorcerer'    | 'runemaster' | 'spellblade'
  | 'paladin'     | 'void_knight'| 'forge_guard'
  | 'bladedancer' | 'falconer'   | 'marksman'
  | 'lich'        | 'necromancer'| 'warlock';

export type ItemAffinity =
  | 'axes' | 'maces' | 'swords' | 'sceptres' | 'daggers' | 'wands'
  | 'staves' | 'spears' | 'bows'
  | 'shields' | 'quivers' | 'catalysts' | 'relics'
  | 'helmets' | 'body_armor' | 'gloves' | 'boots' | 'belts'
  | 'amulets' | 'rings';

export interface ClassDefinition {
  readonly baseClass: BaseClass;
  readonly masteries: readonly Mastery[];
  /** Item types this class can equip that others cannot, or strongly prefers */
  readonly exclusiveAffinities: readonly ItemAffinity[];
  /** Item types this class never uses — safe to hide */
  readonly irrelevantAffinities: readonly ItemAffinity[];
  /** Display name for UI */
  readonly label: string;
}

// ─────────────────────────────────────────────
// Class Definitions
// ─────────────────────────────────────────────

export const CLASS_HIERARCHY = {

  primalist: {
    baseClass: 'primalist',
    masteries: ['beastmaster', 'shaman', 'druid'],
    exclusiveAffinities: ['axes', 'staves', 'shields', 'relics'],
    irrelevantAffinities: ['wands', 'catalysts', 'quivers'],
    label: 'Primalist',
  },

  mage: {
    baseClass: 'mage',
    masteries: ['sorcerer', 'runemaster', 'spellblade'],
    exclusiveAffinities: ['wands', 'staves', 'catalysts', 'swords'],
    irrelevantAffinities: ['bows', 'quivers', 'axes', 'spears', 'shields'],
    label: 'Mage',
  },

  sentinel: {
    baseClass: 'sentinel',
    masteries: ['paladin', 'void_knight', 'forge_guard'],
    exclusiveAffinities: ['swords', 'axes', 'maces', 'sceptres', 'shields', 'spears'],
    irrelevantAffinities: ['bows', 'quivers', 'wands', 'catalysts', 'staves'],
    label: 'Sentinel',
  },

  rogue: {
    baseClass: 'rogue',
    masteries: ['bladedancer', 'falconer', 'marksman'],
    exclusiveAffinities: ['daggers', 'swords', 'bows', 'quivers', 'relics'],
    irrelevantAffinities: ['shields', 'staves', 'sceptres', 'catalysts'],
    label: 'Rogue',
  },

  acolyte: {
    baseClass: 'acolyte',
    masteries: ['lich', 'necromancer', 'warlock'],
    exclusiveAffinities: ['wands', 'sceptres', 'catalysts', 'relics'],
    irrelevantAffinities: ['bows', 'quivers', 'axes', 'spears', 'shields'],
    label: 'Acolyte',
  },

} as const satisfies Record<BaseClass, ClassDefinition>;

// ─────────────────────────────────────────────
// Mastery → Base Class lookup
// ─────────────────────────────────────────────

export const MASTERY_TO_CLASS: Record<Mastery, BaseClass> = {
  beastmaster: 'primalist',
  shaman:      'primalist',
  druid:       'primalist',
  sorcerer:    'mage',
  runemaster:  'mage',
  spellblade:  'mage',
  paladin:     'sentinel',
  void_knight: 'sentinel',
  forge_guard: 'sentinel',
  bladedancer: 'rogue',
  falconer:    'rogue',
  marksman:    'rogue',
  lich:        'acolyte',
  necromancer: 'acolyte',
  warlock:     'acolyte',
} as const;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function getBaseClass(mastery: Mastery): BaseClass {
  return MASTERY_TO_CLASS[mastery];
}

export function getMasteries(baseClass: BaseClass): readonly Mastery[] {
  return CLASS_HIERARCHY[baseClass].masteries;
}

export function getIrrelevantAffinities(mastery: Mastery): readonly ItemAffinity[] {
  return CLASS_HIERARCHY[getBaseClass(mastery)].irrelevantAffinities;
}
