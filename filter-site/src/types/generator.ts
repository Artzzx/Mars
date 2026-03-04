export type StepId = 'class' | 'mastery' | 'damage' | 'progress' | 'options';

export const STEP_ORDER: StepId[] = ['class', 'mastery', 'damage', 'progress', 'options'];

export interface StepMeta {
  id: StepId;
  label: string;
  description: string;
}

export const STEPS: StepMeta[] = [
  { id: 'class',    label: 'Class',       description: 'Choose your character class' },
  { id: 'mastery',  label: 'Mastery',     description: 'Pick your mastery path' },
  { id: 'damage',   label: 'Damage',      description: 'Select your damage types' },
  { id: 'progress', label: 'Progress',    description: 'How far into the game are you?' },
  { id: 'options',  label: 'Options',     description: 'Optional refinements' },
];
