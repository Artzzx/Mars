import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import clsx from 'clsx';

export type Confidence = 'high' | 'medium' | 'low';

const CONFIG: Record<Confidence, { label: string; Icon: React.ElementType; className: string }> = {
  high:   { label: 'High Confidence',    Icon: CheckCircle,    className: 'text-confidence-high' },
  medium: { label: 'Medium Confidence',  Icon: AlertTriangle,  className: 'text-confidence-medium' },
  low:    { label: 'Generic Filter',     Icon: Info,           className: 'text-confidence-low' },
};

interface ConfidenceBadgeProps {
  confidence: Confidence;
  size?: 'sm' | 'md';
}

export function ConfidenceBadge({ confidence, size = 'md' }: ConfidenceBadgeProps) {
  const { label, Icon, className } = CONFIG[confidence];
  const isSm = size === 'sm';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium',
        className,
        isSm ? 'text-xs' : 'text-sm',
      )}
    >
      <Icon className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />
      {label}
    </span>
  );
}
