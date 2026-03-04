import { useState } from 'react';
import { ProgressCard } from '../../common/ProgressCard';
import { StrictnessBadge, type StrictnessId } from '../../common/StrictnessBadge';
import { useGeneratorStore, PROGRESS_TO_STRICTNESS } from '../../../store/generatorStore';
import type { GameProgress } from '../../../lib/compiler/client';

interface ProgressOption {
  id: GameProgress;
  title: string;
  description: string;
  levelRange: string;
  recommendedStrictness: StrictnessId;
}

const PROGRESS_OPTIONS: ProgressOption[] = [
  {
    id:                    'campaign',
    title:                 'Still Leveling',
    description:           'Working through the campaign and early acts.',
    levelRange:            'Lv 1–75',
    recommendedStrictness: 'regular',
  },
  {
    id:                    'early_monolith',
    title:                 'Early Monolith',
    description:           'Running standard monolith timelines at the start of endgame.',
    levelRange:            'Lv 75+',
    recommendedStrictness: 'strict',
  },
  {
    id:                    'empowered_monolith',
    title:                 'Empowered Monoliths',
    description:           'Pushing empowered timelines and farming corruption.',
    levelRange:            'Lv 90+',
    recommendedStrictness: 'very-strict',
  },
  {
    id:                    'high_corruption',
    title:                 'High Corruption',
    description:           'Deep corruption, speed farming, min-maxed build.',
    levelRange:            'Lv 100 / 300+ corruption',
    recommendedStrictness: 'uber-strict',
  },
];

interface ProgressStepProps {
  onAutoAdvance: () => void;
}

export function ProgressStep({ onAutoAdvance }: ProgressStepProps) {
  const selectedProgress = useGeneratorStore((s) => s.selectedProgress);
  const setProgress      = useGeneratorStore((s) => s.setProgress);
  const [hovered, setHovered] = useState<GameProgress | null>(null);

  function handleSelect(id: GameProgress) {
    if (id === selectedProgress) return;
    setProgress(id);
    setTimeout(onAutoAdvance, 300);
  }

  const previewId = hovered ?? selectedProgress;
  const previewStrictness = previewId
    ? PROGRESS_TO_STRICTNESS[previewId] as StrictnessId
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">How Far Are You?</h2>
        <p className="text-gray-400 mt-1">
          This determines filter strictness and affix tier thresholds.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {PROGRESS_OPTIONS.map((opt) => (
          <div
            key={opt.id}
            onMouseEnter={() => setHovered(opt.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <ProgressCard
              id={opt.id}
              title={opt.title}
              description={opt.description}
              levelRange={opt.levelRange}
              recommendedStrictness={opt.recommendedStrictness}
              selected={selectedProgress === opt.id}
              onClick={() => handleSelect(opt.id)}
            />
          </div>
        ))}
      </div>

      {/* Inline strictness preview */}
      {previewStrictness && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Based on your progress, your filter will use:</span>
          <StrictnessBadge strictnessId={previewStrictness} />
          <span className="text-gray-600">— you can override this in the next step.</span>
        </div>
      )}
    </div>
  );
}
