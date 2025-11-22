import { X } from 'lucide-react';
import { useFilterStore } from '../../store/filterStore';
import { clsx } from 'clsx';

interface ModulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODULES = [
  {
    id: 'trade',
    name: 'Trade League',
    category: 'Playstyle',
    description: 'Optimized for trading. Highlights valuable items for selling.',
  },
  {
    id: 'ssf',
    name: 'Solo Self-Found',
    category: 'Playstyle',
    description: 'Shows more crafting materials and upgrades for self-progression.',
  },
  {
    id: 'magic-find',
    name: 'Magic Find',
    category: 'Playstyle',
    description: 'Emphasizes items with increased drop rate modifiers.',
  },
  {
    id: 'sentinel',
    name: 'Sentinel Focus',
    category: 'Class',
    description: 'Highlights Sentinel-specific gear and affixes.',
  },
  {
    id: 'mage',
    name: 'Mage Focus',
    category: 'Class',
    description: 'Highlights Mage-specific gear and affixes.',
  },
  {
    id: 'primalist',
    name: 'Primalist Focus',
    category: 'Class',
    description: 'Highlights Primalist-specific gear and affixes.',
  },
  {
    id: 'rogue',
    name: 'Rogue Focus',
    category: 'Class',
    description: 'Highlights Rogue-specific gear and affixes.',
  },
  {
    id: 'acolyte',
    name: 'Acolyte Focus',
    category: 'Class',
    description: 'Highlights Acolyte-specific gear and affixes.',
  },
  {
    id: 'monolith',
    name: 'Monolith Farming',
    category: 'Content',
    description: 'Optimized for Monolith of Fate grinding.',
  },
  {
    id: 'arena',
    name: 'Arena Push',
    category: 'Content',
    description: 'Focus on survival and defensive stats for Arena.',
  },
  {
    id: 'dungeons',
    name: 'Dungeon Keys',
    category: 'Content',
    description: 'Highlights dungeon keys and related items.',
  },
];

export function ModulesModal({ isOpen, onClose }: ModulesModalProps) {
  const { enabledModules, toggleModule } = useFilterStore();

  if (!isOpen) return null;

  const groupedModules = MODULES.reduce(
    (acc, module) => {
      if (!acc[module.category]) acc[module.category] = [];
      acc[module.category].push(module);
      return acc;
    },
    {} as Record<string, typeof MODULES>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-le-dark border border-le-border rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-le-border">
          <h2 className="text-lg font-semibold">Filter Modules</h2>
          <button onClick={onClose} className="p-1 hover:bg-le-border rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          <p className="text-sm text-gray-400 mb-4">
            Enable modules to add specialized rules to your filter. Multiple modules can be combined.
          </p>

          {Object.entries(groupedModules).map(([category, modules]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-le-accent mb-3">{category}</h3>
              <div className="grid grid-cols-2 gap-2">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => toggleModule(module.id)}
                    className={clsx(
                      'p-3 rounded border text-left transition-colors',
                      enabledModules.includes(module.id)
                        ? 'border-le-accent bg-le-accent/10'
                        : 'border-le-border hover:border-le-accent/50'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={clsx(
                          'w-3 h-3 rounded-sm border',
                          enabledModules.includes(module.id)
                            ? 'bg-le-accent border-le-accent'
                            : 'border-gray-500'
                        )}
                      />
                      <span className="font-medium text-sm">{module.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-5">{module.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-le-border flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
