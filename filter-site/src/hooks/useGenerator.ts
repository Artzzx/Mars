import { useGeneratorStore } from '../store/generatorStore';
import { STEP_ORDER, type StepId } from '../types/generator';
import type { UserInput } from '../lib/compiler/client';

// Per-step validation: returns true when the step's required field is filled
function isStepComplete(stepId: StepId, state: ReturnType<typeof useGeneratorStore.getState>): boolean {
  switch (stepId) {
    case 'class':    return state.selectedClass !== null;
    case 'mastery':  return state.selectedMastery !== null;
    case 'damage':   return state.selectedDamageTypes.length >= 1;
    case 'progress': return state.selectedProgress !== null;
    case 'options':  return true; // all fields have defaults
  }
}

export function useGenerator() {
  const state = useGeneratorStore();

  const currentIndex = STEP_ORDER.indexOf(state.currentStep);
  const isLastStep   = state.currentStep === 'options';
  const canGoBack    = currentIndex > 0;
  const canGoNext    = isStepComplete(state.currentStep, state);

  const userInput: Partial<UserInput> = {
    mastery:                   state.selectedMastery ?? undefined,
    damageTypes:               state.selectedDamageTypes,
    gameProgress:              state.selectedProgress ?? undefined,
    archetype:                 state.selectedArchetype,
    resistancesCapped:         state.resistancesCapped,
    showCrossClassItems:       state.showCrossClassItems,
    crossClassWeightThreshold: state.crossClassWeightThreshold,
  };

  return {
    currentStep:    state.currentStep,
    completedSteps: state.completedSteps,
    canGoNext,
    canGoBack,
    goNext:         state.goNext,
    goBack:         state.goBack,
    goToStep:       state.goToStep,
    isLastStep,
    userInput,
  };
}
