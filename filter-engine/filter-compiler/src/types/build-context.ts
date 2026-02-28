// User-facing input and resolved build context types

export type GameProgress =
  | 'campaign'
  | 'early_monolith'
  | 'empowered_monolith'
  | 'high_corruption';

export type Archetype = 'melee' | 'spell' | 'dot' | 'minion' | 'ranged';

export type Phase = 'starter' | 'endgame' | 'aspirational';

// Raw input from the UI / CLI
export interface UserInput {
  mastery: string;
  damageTypes: string[];         // e.g. ["physical", "necrotic"]
  gameProgress: GameProgress;
  archetype: Archetype | null;   // null = user unsure
  strictnessId: string;          // e.g. "regular", "strict", "very-strict"
  resistancesCapped: boolean;
  showCrossClassItems: boolean;
  crossClassWeightThreshold: number; // default 75
}

// Resolved, enriched context passed through all pipeline stages
export interface BuildContext {
  mastery: string;               // normalized lowercase
  damageTypes: string[];         // normalized lowercase
  phase: Phase;
  archetype: Archetype | null;
  attackType: 'melee' | 'spell' | 'bow' | null; // derived from archetype
  usesMinions: boolean;                           // derived from archetype
  usesShield: boolean;                            // false for v1 (not yet in UI)
  strictnessId: string;
  resistancesCapped: boolean;
  showCrossClassItems: boolean;
  crossClassWeightThreshold: number;
  baseClass: string;             // derived from mastery via classes.ts CLASS_HIERARCHY
}
