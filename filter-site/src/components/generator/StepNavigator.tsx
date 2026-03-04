import { Check } from 'lucide-react';
import clsx from 'clsx';
import type { StepId } from '../../types/generator';
import { STEPS } from '../../types/generator';

interface StepNavigatorProps {
  currentStep: StepId;
  completedSteps: Set<StepId>;
  onStepClick: (id: StepId) => void;
}

export function StepNavigator({ currentStep, completedSteps, onStepClick }: StepNavigatorProps) {
  return (
    <nav className="flex flex-col gap-0" aria-label="Generator steps">
      {STEPS.map((step, idx) => {
        const isActive    = step.id === currentStep;
        const isComplete  = completedSteps.has(step.id);
        const isClickable = isComplete && !isActive;
        const isLast      = idx === STEPS.length - 1;

        return (
          <div key={step.id} className="flex flex-col">
            <button
              type="button"
              onClick={isClickable ? () => onStepClick(step.id) : undefined}
              disabled={!isClickable && !isActive}
              className={clsx(
                'flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors',
                isActive   && 'bg-le-accent/10',
                isClickable && 'hover:bg-le-card cursor-pointer',
                !isClickable && !isActive && 'cursor-default opacity-50',
              )}
              aria-current={isActive ? 'step' : undefined}
            >
              {/* Circle badge */}
              <span className="flex-shrink-0 mt-0.5">
                {isComplete ? (
                  <span className="step-circle-complete flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </span>
                ) : isActive ? (
                  <span className="step-circle-active flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                ) : (
                  <span className="step-circle-upcoming flex items-center justify-center text-sm">
                    {idx + 1}
                  </span>
                )}
              </span>

              {/* Label + description */}
              <span className="flex flex-col min-w-0">
                <span
                  className={clsx(
                    'text-sm font-semibold leading-tight',
                    isActive   ? 'text-white'       : 'text-gray-400',
                    isComplete && !isActive && 'text-gray-300',
                  )}
                >
                  {step.label}
                </span>
                <span className="text-xs text-gray-500 mt-0.5 leading-snug">
                  {step.description}
                </span>
              </span>
            </button>

            {/* Connector line between steps */}
            {!isLast && (
              <div className="ml-[1.875rem] w-px h-4 bg-le-border" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
