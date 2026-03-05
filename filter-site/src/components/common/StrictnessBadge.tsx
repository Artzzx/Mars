import clsx from 'clsx';

export type StrictnessId = 'regular' | 'strict' | 'very-strict' | 'uber-strict';

const LABELS: Record<StrictnessId, string> = {
  'regular':     'Regular',
  'strict':      'Strict',
  'very-strict': 'Very Strict',
  'uber-strict': 'Uber Strict',
};

const COLORS: Record<StrictnessId, string> = {
  'regular':     'bg-le-blue/10 text-le-blue border-le-blue/30',
  'strict':      'bg-le-accent/10 text-le-accent border-le-accent/30',
  'very-strict': 'bg-le-gold/10 text-le-gold border-le-gold/30',
  'uber-strict': 'bg-le-red/10 text-le-red border-le-red/30',
};

interface StrictnessBadgeProps {
  strictnessId: StrictnessId;
  size?: 'sm' | 'md';
}

export function StrictnessBadge({ strictnessId, size = 'sm' }: StrictnessBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        COLORS[strictnessId],
      )}
    >
      {LABELS[strictnessId]}
    </span>
  );
}
