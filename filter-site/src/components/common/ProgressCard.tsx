import clsx from 'clsx';
import { StrictnessBadge, type StrictnessId } from './StrictnessBadge';

interface ProgressCardProps {
  id: string;
  title: string;
  description: string;
  levelRange: string;
  recommendedStrictness: StrictnessId;
  selected: boolean;
  onClick: () => void;
}

export function ProgressCard({
  title,
  description,
  levelRange,
  recommendedStrictness,
  selected,
  onClick,
}: ProgressCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'selection-card flex flex-col gap-3 text-left w-full',
        !selected && 'bg-le-darker',
      )}
      aria-pressed={selected}
    >
      {/* Level range badge */}
      <span className="inline-block px-2 py-0.5 rounded bg-le-border text-gray-400 text-xs font-mono">
        {levelRange}
      </span>

      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Recommended:</span>
        <StrictnessBadge strictnessId={recommendedStrictness} />
      </div>
    </button>
  );
}
