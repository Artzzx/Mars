import { Sword, Flame, Snowflake, Zap, Aperture, Skull, Droplet } from 'lucide-react';
import clsx from 'clsx';

export type DamageType = 'physical' | 'fire' | 'cold' | 'lightning' | 'void' | 'necrotic' | 'poison';

const ICONS: Record<DamageType, React.ElementType> = {
  physical:  Sword,
  fire:      Flame,
  cold:      Snowflake,
  lightning: Zap,
  void:      Aperture,
  necrotic:  Skull,
  poison:    Droplet,
};

const LABELS: Record<DamageType, string> = {
  physical:  'Physical',
  fire:      'Fire',
  cold:      'Cold',
  lightning: 'Lightning',
  void:      'Void',
  necrotic:  'Necrotic',
  poison:    'Poison',
};

interface DamageTypeChipProps {
  type: DamageType;
  selected: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
  readonly?: boolean;
}

export function DamageTypeChip({
  type,
  selected,
  onClick,
  size = 'md',
  readonly = false,
}: DamageTypeChipProps) {
  const Icon = ICONS[type];
  const isSm = size === 'sm';

  return (
    <button
      type="button"
      onClick={readonly ? undefined : onClick}
      disabled={readonly}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border font-medium transition-all duration-150',
        isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm',
        selected
          ? `chip-${type}`
          : 'border-le-border text-gray-500 hover:border-gray-500 hover:text-gray-300',
        readonly && 'cursor-default',
        !readonly && !selected && 'cursor-pointer',
      )}
      aria-pressed={selected}
    >
      <Icon className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />
      {LABELS[type]}
    </button>
  );
}
