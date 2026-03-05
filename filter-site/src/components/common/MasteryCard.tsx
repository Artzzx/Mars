import clsx from 'clsx';
import { DamageTypeChip, type DamageType } from './DamageTypeChip';

interface MasteryCardProps {
  id: string;
  name: string;
  description: string;
  damageTypes: string[];
  selected: boolean;
  onClick: () => void;
}

export function MasteryCard({ name, description, damageTypes, selected, onClick }: MasteryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx('selection-card flex flex-col gap-3 text-left w-full', !selected && 'bg-le-darker')}
      aria-pressed={selected}
    >
      <p className="font-semibold text-white">{name}</p>
      <p className="text-sm text-gray-400 leading-snug">{description}</p>

      {damageTypes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {damageTypes.map((dt) => (
            <DamageTypeChip
              key={dt}
              type={dt as DamageType}
              selected
              size="sm"
              readonly
            />
          ))}
        </div>
      )}
    </button>
  );
}
