import { X, Check } from 'lucide-react';
import { useFilterStore } from '../../store/filterStore';
import { PRESET_MODULES } from '../../data/modules';
import { clsx } from 'clsx';

interface ModulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModulesModal({ isOpen, onClose }: ModulesModalProps) {
  const { enabledModules, toggleModule, filter, setFilter } = useFilterStore();

  if (!isOpen) return null;

  const groupedModules = PRESET_MODULES.reduce(
    (acc, module) => {
      if (!acc[module.category]) acc[module.category] = [];
      acc[module.category].push(module);
      return acc;
    },
    {} as Record<string, typeof PRESET_MODULES>
  );

  const handleApplyModules = () => {
    // Get all rules from enabled modules
    const moduleRules = PRESET_MODULES.filter((m) => enabledModules.includes(m.id)).flatMap(
      (m) =>
        m.rules.map((rule) => ({
          ...rule,
          id: crypto.randomUUID(),
          nameOverride: rule.nameOverride || `[${m.name}]`,
        }))
    );

    if (moduleRules.length === 0) {
      alert('No modules selected. Enable some modules first.');
      return;
    }

    // Add module rules to the beginning of the filter
    setFilter({
      ...filter,
      rules: [...moduleRules, ...filter.rules],
    });

    alert(`Added ${moduleRules.length} rules from ${enabledModules.length} module(s).`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-le-dark border border-le-border rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-le-border">
          <h2 className="text-lg font-semibold">Filter Modules</h2>
          <button onClick={onClose} className="p-1 hover:bg-le-border rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-180px)]">
          <p className="text-sm text-gray-400 mb-4">
            Select modules to add pre-configured rules to your filter. Click "Apply Selected" to add the rules.
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
                          'w-4 h-4 rounded-sm border flex items-center justify-center',
                          enabledModules.includes(module.id)
                            ? 'bg-le-accent border-le-accent'
                            : 'border-gray-500'
                        )}
                      >
                        {enabledModules.includes(module.id) && <Check size={12} />}
                      </div>
                      <span className="font-medium text-sm">{module.name}</span>
                      <span className="text-xs text-gray-500">
                        ({module.rules.length} rule{module.rules.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">{module.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-le-border flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {enabledModules.length} module{enabledModules.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleApplyModules}
              disabled={enabledModules.length === 0}
              className={clsx(
                'btn-primary',
                enabledModules.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              Apply Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
