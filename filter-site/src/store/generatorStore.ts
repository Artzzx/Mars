import { create } from 'zustand';
import type { UserInput, GameProgress, Archetype } from '../lib/compiler/client';
import type { CompileResult } from '../lib/compiler/client';
import { STEP_ORDER, type StepId } from '../types/generator';

// Mapping from gameProgress to recommended strictness ID
export const PROGRESS_TO_STRICTNESS: Record<GameProgress, string> = {
  campaign:            'regular',
  early_monolith:      'strict',
  empowered_monolith:  'very-strict',
  high_corruption:     'uber-strict',
};

interface GeneratorState {
  // Form state — mirrors UserInput fields one-to-one
  selectedClass:              string | null;
  selectedMastery:            string | null;
  selectedDamageTypes:        string[];
  selectedProgress:           GameProgress | null;
  selectedArchetype:          Archetype | null;
  resistancesCapped:          boolean;
  showCrossClassItems:        boolean;
  crossClassWeightThreshold:  number;
  strictnessOverride:         string | null;   // null = use auto-recommended

  // Step navigation
  currentStep:     StepId;
  completedSteps:  Set<StepId>;

  // Compilation
  compileResult:   CompileResult | null;
  isGenerating:    boolean;
  error:           string | null;

  // Derived helper — builds UserInput for the compiler
  buildUserInput: () => UserInput | null;

  // Actions
  setClass:               (cls: string) => void;
  setMastery:             (mastery: string) => void;
  toggleDamageType:       (dt: string) => void;
  setProgress:            (p: GameProgress) => void;
  setArchetype:           (a: Archetype | null) => void;
  setResistancesCapped:   (v: boolean) => void;
  setShowCrossClass:      (v: boolean) => void;
  setCrossClassThreshold: (v: number) => void;
  setStrictnessOverride:  (id: string | null) => void;
  goToStep:               (step: StepId) => void;
  goNext:                 () => void;
  goBack:                 () => void;
  setCompileResult:       (result: CompileResult) => void;
  setGenerating:          (v: boolean) => void;
  setError:               (msg: string | null) => void;
  reset:                  () => void;
}

const initialState = {
  selectedClass:             null,
  selectedMastery:           null,
  selectedDamageTypes:       [] as string[],
  selectedProgress:          null,
  selectedArchetype:         null,
  resistancesCapped:         false,
  showCrossClassItems:       false,
  crossClassWeightThreshold: 75,
  strictnessOverride:        null,
  currentStep:               'class' as StepId,
  completedSteps:            new Set<StepId>(),
  compileResult:             null,
  isGenerating:              false,
  error:                     null,
};

export const useGeneratorStore = create<GeneratorState>()((set, get) => ({
  ...initialState,

  buildUserInput: () => {
    const s = get();
    if (!s.selectedMastery || !s.selectedProgress || s.selectedDamageTypes.length === 0) {
      return null;
    }
    const strictnessId =
      s.strictnessOverride ?? PROGRESS_TO_STRICTNESS[s.selectedProgress];
    return {
      mastery:                   s.selectedMastery,
      damageTypes:               s.selectedDamageTypes,
      gameProgress:              s.selectedProgress,
      archetype:                 s.selectedArchetype,
      strictnessId,
      resistancesCapped:         s.resistancesCapped,
      showCrossClassItems:       s.showCrossClassItems,
      crossClassWeightThreshold: s.crossClassWeightThreshold,
    };
  },

  setClass: (cls) =>
    set((s) => {
      // Changing class resets mastery and damage types
      const clearedCompleted = new Set(s.completedSteps);
      clearedCompleted.delete('mastery');
      clearedCompleted.delete('damage');
      return {
        selectedClass:        cls,
        selectedMastery:      null,
        selectedDamageTypes:  [],
        completedSteps:       clearedCompleted,
      };
    }),

  setMastery: (mastery) =>
    set((s) => {
      const completed = new Set(s.completedSteps);
      completed.add('class');
      completed.add('mastery');
      return { selectedMastery: mastery, completedSteps: completed };
    }),

  toggleDamageType: (dt) =>
    set((s) => {
      const types = s.selectedDamageTypes.includes(dt)
        ? s.selectedDamageTypes.filter((t) => t !== dt)
        : [...s.selectedDamageTypes, dt];
      const completed = new Set(s.completedSteps);
      if (types.length >= 1) completed.add('damage');
      else completed.delete('damage');
      return { selectedDamageTypes: types, completedSteps: completed };
    }),

  setProgress: (p) =>
    set((s) => {
      const completed = new Set(s.completedSteps);
      completed.add('progress');
      return { selectedProgress: p, completedSteps: completed };
    }),

  setArchetype:           (a) => set({ selectedArchetype: a }),
  setResistancesCapped:   (v) => set({ resistancesCapped: v }),
  setShowCrossClass:      (v) => set({ showCrossClassItems: v }),
  setCrossClassThreshold: (v) => set({ crossClassWeightThreshold: v }),
  setStrictnessOverride:  (id) => set({ strictnessOverride: id }),

  goToStep: (step) => set({ currentStep: step }),

  goNext: () =>
    set((s) => {
      const idx = STEP_ORDER.indexOf(s.currentStep);
      if (idx < STEP_ORDER.length - 1) {
        return { currentStep: STEP_ORDER[idx + 1] };
      }
      return {};
    }),

  goBack: () =>
    set((s) => {
      const idx = STEP_ORDER.indexOf(s.currentStep);
      if (idx > 0) {
        return { currentStep: STEP_ORDER[idx - 1] };
      }
      return {};
    }),

  setCompileResult: (result) => set({ compileResult: result }),
  setGenerating:    (v) => set({ isGenerating: v }),
  setError:         (msg) => set({ error: msg }),

  reset: () =>
    set({
      ...initialState,
      completedSteps: new Set<StepId>(),
    }),
}));
