import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

interface SpecificityGaugeProps {
  score: number;       // 0.0 – 1.0
  showLabel?: boolean; // default true
}

function getBarColor(score: number): string {
  if (score >= 0.7) return 'bg-confidence-high';
  if (score >= 0.4) return 'bg-confidence-medium';
  return 'bg-le-red';
}

export function SpecificityGauge({ score, showLabel = true }: SpecificityGaugeProps) {
  const [width, setWidth] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      // Trigger animation on mount
      requestAnimationFrame(() => {
        setWidth(Math.min(Math.max(score, 0), 1) * 100);
      });
    } else {
      setWidth(Math.min(Math.max(score, 0), 1) * 100);
    }
  }, [score]);

  const pct = Math.round(score * 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Specificity</span>
          <span
            className={clsx(
              'text-xs font-semibold',
              score >= 0.7
                ? 'text-confidence-high'
                : score >= 0.4
                ? 'text-confidence-medium'
                : 'text-le-red',
            )}
          >
            {pct}%
          </span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-le-border overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all ease-out', getBarColor(score))}
          style={{ width: `${width}%`, transitionDuration: '500ms' }}
        />
      </div>
    </div>
  );
}
