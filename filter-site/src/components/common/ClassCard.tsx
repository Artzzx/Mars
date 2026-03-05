import clsx from 'clsx';

export type ClassName = 'sentinel' | 'mage' | 'primalist' | 'rogue' | 'acolyte';

interface ClassCardProps {
  id: ClassName;
  name: string;
  masteryCount: number;
  selected: boolean;
  onClick: () => void;
}

// Tailwind class map (must be complete strings for purge to keep them)
const CLASS_COLOR: Record<ClassName, string> = {
  sentinel:  'text-class-sentinel border-class-sentinel bg-class-sentinel/10',
  mage:      'text-class-mage border-class-mage bg-class-mage/10',
  primalist: 'text-class-primalist border-class-primalist bg-class-primalist/10',
  rogue:     'text-class-rogue border-class-rogue bg-class-rogue/10',
  acolyte:   'text-class-acolyte border-class-acolyte bg-class-acolyte/10',
};

const CLASS_ICON_COLOR: Record<ClassName, string> = {
  sentinel:  'text-class-sentinel',
  mage:      'text-class-mage',
  primalist: 'text-class-primalist',
  rogue:     'text-class-rogue',
  acolyte:   'text-class-acolyte',
};

// Placeholder icon letters until SVG assets are added
const CLASS_INITIAL: Record<ClassName, string> = {
  sentinel:  'S',
  mage:      'M',
  primalist: 'P',
  rogue:     'R',
  acolyte:   'A',
};

export function ClassCard({ id, name, masteryCount, selected, onClick }: ClassCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'selection-card flex flex-col items-center gap-3 text-center w-full',
        selected && CLASS_COLOR[id],
        !selected && 'bg-le-darker',
      )}
      aria-pressed={selected}
    >
      {/* Icon area */}
      <div
        className={clsx(
          'w-20 h-20 rounded-xl flex items-center justify-center text-4xl font-bold font-game',
          CLASS_ICON_COLOR[id],
          selected ? 'bg-current/10' : 'bg-le-card',
        )}
      >
        {CLASS_INITIAL[id]}
      </div>

      <div>
        <p className="font-semibold text-lg text-white">{name}</p>
        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-le-border text-gray-400 text-xs">
          {masteryCount} masteries
        </span>
      </div>
    </button>
  );
}
