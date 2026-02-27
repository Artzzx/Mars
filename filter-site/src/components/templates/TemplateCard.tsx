import { clsx } from 'clsx';

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function TemplateCard({
  name,
  description,
  isSelected,
  onSelect,
}: TemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'card p-4 text-left transition-all hover:border-le-accent/50',
        isSelected && 'border-le-accent ring-1 ring-le-accent'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded bg-le-border flex items-center justify-center">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-le-accent/30 to-le-purple/30" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={clsx(
              'font-semibold text-sm mb-1',
              isSelected ? 'text-le-accent' : 'text-white'
            )}
          >
            {name}
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  );
}
