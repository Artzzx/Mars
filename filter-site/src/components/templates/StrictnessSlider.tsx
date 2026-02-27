import { useFilterStore } from '../../store/filterStore';
import { STRICTNESS_LEVELS, type StrictnessLevel } from '../../lib/filters/types';
import { clsx } from 'clsx';

export function StrictnessSlider() {
  const { strictness, setStrictness } = useFilterStore();

  const currentIndex = STRICTNESS_LEVELS.findIndex((l) => l.value === strictness);

  return (
    <div className="card p-6">
      <h3 className="text-sm text-gray-400 text-center mb-4">
        STRICTNESS - how much the filter hides
      </h3>

      <div className="relative">
        {/* Track */}
        <div className="h-1 bg-le-border rounded-full relative">
          {/* Progress */}
          <div
            className="absolute h-full bg-le-accent rounded-full transition-all"
            style={{
              width: `${(currentIndex / (STRICTNESS_LEVELS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Thumb */}
        <input
          type="range"
          min={0}
          max={STRICTNESS_LEVELS.length - 1}
          value={currentIndex}
          onChange={(e) =>
            setStrictness(STRICTNESS_LEVELS[Number(e.target.value)].value as StrictnessLevel)
          }
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-le-accent rounded-sm shadow-lg transition-all pointer-events-none"
          style={{
            left: `calc(${(currentIndex / (STRICTNESS_LEVELS.length - 1)) * 100}% - 8px)`,
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-4">
        {STRICTNESS_LEVELS.map((level, index) => (
          <button
            key={level.value}
            onClick={() => setStrictness(level.value)}
            className={clsx(
              'text-xs font-medium transition-colors',
              index === currentIndex ? 'text-le-accent' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
}
