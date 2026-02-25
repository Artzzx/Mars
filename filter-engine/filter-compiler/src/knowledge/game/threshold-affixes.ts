/**
 * threshold-affixes.ts
 * Universal affixes every build needs until a game-defined cap.
 * These bypass the weight/ranking system entirely.
 * The compiler injects them as always-on rules before build-specific rules.
 *
 * Update when game caps change (e.g. if resistance cap ever increases).
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type GamePhase = 'starter' | 'endgame' | 'aspirational';

export interface ThresholdAffix {
  readonly affixId: number;
  readonly name: string;
  /**
   * The game cap this affix is trying to reach.
   * Once a player signals this cap is reached, the rule can be toggled off.
   */
  readonly cap: number;
  readonly capUnit: '%' | 'flat';
  /**
   * Minimum tier worth showing. Below this tier the item is not worth stopping for.
   * Even for threshold affixes, a T1 resistance on an otherwise bad item isn't worth picking up.
   */
  readonly showMinTier: number;
  /**
   * Whether the user can turn this rule off via a toggle.
   * Always true for threshold affixes — once capped, these rules waste filter slots.
   */
  readonly userControllable: true;
  /**
   * UI key for the toggle. Used by the compiler to match user preference flags.
   */
  readonly toggleKey: string;
  /**
   * Which game phases this threshold is relevant in.
   * Some threshold affixes stop mattering at high endgame (e.g. once resistances
   * are permanently capped through gear).
   */
  readonly relevantPhases: readonly GamePhase[];
}

// ─────────────────────────────────────────────
// Threshold Affixes
// Real IDs from data/mappings/affixes.json
// ─────────────────────────────────────────────

export const THRESHOLD_AFFIXES: readonly ThresholdAffix[] = [

  // ── Resistances ──────────────────────────────
  {
    affixId: 17,
    name: 'Cold Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 3,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 80,
    name: 'Elemental Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 3,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 13,
    name: 'Fire Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 3,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 24,
    name: 'Lightning Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 3,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 10,
    name: 'Necrotic Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 3,
    userControllable: true,
    toggleKey: 'necrotic_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 19,
    name: 'Poison Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 3,
    userControllable: true,
    toggleKey: 'poison_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 7,
    name: 'Void Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 3,
    userControllable: true,
    toggleKey: 'void_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 46,
    name: 'All Resistances',
    cap: 75,
    capUnit: '%',
    showMinTier: 3,
    userControllable: true,
    toggleKey: 'all_resistances_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 104,
    name: 'All Resistances While Channelling',
    cap: 75,
    capUnit: '%',
    showMinTier: 3,
    userControllable: true,
    toggleKey: 'all_resistances_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 45,
    name: 'Physical Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 3,
    userControllable: true,
    toggleKey: 'physical_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 117,
    name: 'Idol Elemental Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 111,
    name: 'Idol Fire Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 113,
    name: 'Idol Lightning Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 112,
    name: 'Idol Cold Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 430,
    name: 'Idol Physical Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'physical_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 116,
    name: 'Idol Poison Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'poison_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 114,
    name: 'Idol Necrotic Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'necrotic_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 115,
    name: 'Idol Void Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'void_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 125,
    name: 'Idol Primalist Elemental Resistance While Transformed',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 133,
    name: 'Idol Primalist Totem Elemental Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 14,
    name: 'Freeze Rate Multiplier and Cold Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 3,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 414,
    name: 'Acolyte Poison Damage And Poison Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 3,
    userControllable: true,
    toggleKey: 'poison_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 835,
    name: 'Idol Void Resistance and Minion Void Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'void_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 836,
    name: 'Idol Poison Resistance and Minion Poison Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'poison_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 837,
    name: 'Idol Physical Resistance and Minion Physical Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'physical_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 838,
    name: 'Idol Necrotic Resistance and Minion Necrotic Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'necrotic_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 850,
    name: 'Idol Cold Resistance and Minion Cold Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 851,
    name: 'Idol Elemental Resistance and Minion Elemental Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 852,
    name: 'Idol Fire Resistance and Minion Fire Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 855,
    name: 'Idol Lightning Resistance and Minion Lightning Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 867,
    name: 'Idol Necrotic Resistance and Minion Necrotic Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'necrotic_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 868,
    name: 'Idol Void Resistance and Minion Void Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'void_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 869,
    name: 'Idol Poison Resistance and Minion Poison Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'poison_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 870,
    name: 'Idol Physical Resistance and Minion Physical Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'physical_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 885,
    name: 'Idol Cold Resistance and Minion Cold Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 886,
    name: 'Idol Elemental Resistance and Minion Elemental Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 887,
    name: 'Idol Fire Resistance and Minion Fire Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 888,
    name: 'Idol Lightning Resistance and Minion Lightning Resistance',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 938,
    name: 'Idol Physical Resistance and Bleed Duration',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'physical_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },
  {
    affixId: 939,
    name: 'Idol Fire Resistance and Ignite Duration',
    cap: 75,
    capUnit: '%',
    showMinTier: 1,
    userControllable: true,
    toggleKey: 'elemental_resistance_capped',
    relevantPhases: ['starter', 'endgame'],
  },

] as const;

// ─────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────

export const THRESHOLD_AFFIX_IDS: ReadonlySet<number> = new Set(
  THRESHOLD_AFFIXES.map(t => t.affixId)
);

export function isThresholdAffix(affixId: number): boolean {
  return THRESHOLD_AFFIX_IDS.has(affixId);
}

export function getThresholdAffix(affixId: number): ThresholdAffix | undefined {
  return THRESHOLD_AFFIXES.find(t => t.affixId === affixId);
}

export function getThresholdAffixesForPhase(phase: GamePhase): readonly ThresholdAffix[] {
  return THRESHOLD_AFFIXES.filter(t => t.relevantPhases.includes(phase));
}

export function getControllableToggleKeys(): readonly string[] {
  return THRESHOLD_AFFIXES.filter(t => t.userControllable).map(t => t.toggleKey);
}
