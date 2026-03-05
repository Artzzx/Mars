import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { StrictnessBadge, type StrictnessId } from '../../common/StrictnessBadge';
import { useGeneratorStore, PROGRESS_TO_STRICTNESS } from '../../../store/generatorStore';
import type { Archetype } from '../../../lib/compiler/client';

const ARCHETYPES: { id: Archetype | null; label: string }[] = [
  { id: 'melee',  label: 'Melee' },
  { id: 'spell',  label: 'Spell' },
  { id: 'dot',    label: 'DoT' },
  { id: 'minion', label: 'Minion' },
  { id: 'ranged', label: 'Ranged' },
  { id: null,     label: 'Not Sure' },
];

const STRICTNESS_OPTIONS: { id: string | null; label: string }[] = [
  { id: null,          label: 'Auto (Recommended)' },
  { id: 'regular',     label: 'Regular' },
  { id: 'strict',      label: 'Strict' },
  { id: 'very-strict', label: 'Very Strict' },
  { id: 'uber-strict', label: 'Uber Strict' },
];

interface OptionsStepProps {
  onGenerate: () => void;
}

export function OptionsStep({ onGenerate }: OptionsStepProps) {
  const selectedArchetype       = useGeneratorStore((s) => s.selectedArchetype);
  const resistancesCapped       = useGeneratorStore((s) => s.resistancesCapped);
  const showCrossClassItems     = useGeneratorStore((s) => s.showCrossClassItems);
  const crossClassWeightThreshold = useGeneratorStore((s) => s.crossClassWeightThreshold);
  const strictnessOverride      = useGeneratorStore((s) => s.strictnessOverride);
  const selectedProgress        = useGeneratorStore((s) => s.selectedProgress);
  const isGenerating            = useGeneratorStore((s) => s.isGenerating);

  const setArchetype            = useGeneratorStore((s) => s.setArchetype);
  const setResistancesCapped    = useGeneratorStore((s) => s.setResistancesCapped);
  const setShowCrossClass       = useGeneratorStore((s) => s.setShowCrossClass);
  const setCrossClassThreshold  = useGeneratorStore((s) => s.setCrossClassThreshold);
  const setStrictnessOverride   = useGeneratorStore((s) => s.setStrictnessOverride);

  const autoStrictness = selectedProgress
    ? (PROGRESS_TO_STRICTNESS[selectedProgress] as StrictnessId)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white">Final Options</h2>
        <p className="text-gray-400 mt-1">
          Optional. All fields have smart defaults — you can skip this step.
        </p>
      </div>

      {/* Archetype */}
      <section className="space-y-3">
        <div>
          <p className="font-medium text-white">Build Archetype</p>
          <p className="text-sm text-gray-500 mt-0.5">Helps us filter melee-only vs spell-only affixes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ARCHETYPES.map(({ id, label }) => (
            <button
              key={String(id)}
              type="button"
              onClick={() => setArchetype(id)}
              className={clsx(
                'px-4 py-2 rounded-full border text-sm font-medium transition-colors',
                selectedArchetype === id
                  ? 'border-le-accent bg-le-accent/10 text-le-accent'
                  : 'border-le-border text-gray-400 hover:border-gray-500 hover:text-gray-300',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Resistances Capped toggle */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">My resistances are capped</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Hides resistance-boosting affixes since you don't need them.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={resistancesCapped}
            onClick={() => setResistancesCapped(!resistancesCapped)}
            className={clsx(
              'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors',
              resistancesCapped ? 'bg-le-accent' : 'bg-le-border',
            )}
          >
            <span
              className={clsx(
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                resistancesCapped ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>
      </section>

      {/* Cross-class items toggle */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Show cross-class items</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Include high-value items from other classes if they score above the threshold.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showCrossClassItems}
            onClick={() => setShowCrossClass(!showCrossClassItems)}
            className={clsx(
              'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors',
              showCrossClassItems ? 'bg-le-accent' : 'bg-le-border',
            )}
          >
            <span
              className={clsx(
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                showCrossClassItems ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        {/* Threshold slider — only visible when cross-class is ON */}
        {showCrossClassItems && (
          <div className="pl-4 border-l-2 border-le-border space-y-2">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-white">Minimum weight threshold</p>
                <p className="text-xs text-gray-500">Only show cross-class items scoring above this value (0–100)</p>
              </div>
              <span className="text-sm font-semibold text-le-accent">{crossClassWeightThreshold}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={crossClassWeightThreshold}
              onChange={(e) => setCrossClassThreshold(Number(e.target.value))}
              className="w-full accent-le-accent"
            />
          </div>
        )}
      </section>

      {/* Strictness override */}
      <section className="space-y-2">
        <div>
          <p className="font-medium text-white">Strictness override</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Leave as Auto to use our recommendation based on your progress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={strictnessOverride ?? ''}
            onChange={(e) => setStrictnessOverride(e.target.value || null)}
            className="input text-sm flex-1"
          >
            {STRICTNESS_OPTIONS.map(({ id, label }) => (
              <option key={String(id)} value={id ?? ''}>
                {label}
              </option>
            ))}
          </select>
          {!strictnessOverride && autoStrictness && (
            <span className="text-sm text-gray-500 whitespace-nowrap">
              Auto →{' '}
              <StrictnessBadge strictnessId={autoStrictness} />
            </span>
          )}
        </div>
      </section>

      {/* Generate button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className={clsx(
          'w-full py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors',
          isGenerating
            ? 'bg-le-accent/50 text-le-dark/70 cursor-not-allowed'
            : 'bg-le-accent text-le-dark hover:bg-le-accent-hover',
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Compiling…
          </>
        ) : (
          'Generate My Filter →'
        )}
      </button>
    </div>
  );
}
