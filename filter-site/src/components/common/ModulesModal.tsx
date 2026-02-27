import { X, Check, AlertTriangle, Shield, Zap, Users, Swords } from 'lucide-react';
import { useFilterStore } from '../../store/filterStore';
import {
  ASCENDANCY_MODULES,
  STRICTNESS_MODULES,
  PLAYSTYLE_MODULES,
  BUILD_MODULES,
  STRICTNESS_LEVELS,
  mergeModuleRules,
  getModuleConflicts,
  getModuleById,
  type FilterModule,
} from '../../data/modules';
import { clsx } from 'clsx';
import { useState, useMemo } from 'react';

interface ModulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'ascendancy' | 'strictness' | 'playstyle' | 'build';

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'ascendancy', label: 'Ascendancy', icon: <Shield size={16} /> },
  { id: 'strictness', label: 'Strictness', icon: <Zap size={16} /> },
  { id: 'playstyle', label: 'Playstyle', icon: <Users size={16} /> },
  { id: 'build', label: 'Builds', icon: <Swords size={16} /> },
];

export function ModulesModal({ isOpen, onClose }: ModulesModalProps) {
  const { enabledModules, toggleModule, filter, setFilter } = useFilterStore();
  const [activeTab, setActiveTab] = useState<TabType>('ascendancy');

  // Check for conflicts
  const conflicts = useMemo(() => getModuleConflicts(enabledModules), [enabledModules]);

  // Get selected modules info
  const selectedAscendancies = enabledModules.filter((id) => id.startsWith('ascendancy-'));
  const selectedStrictness = enabledModules.find((id) => id.startsWith('strictness-'));
  const selectedPlaystyles = enabledModules.filter((id) => id.startsWith('playstyle-'));
  const selectedBuilds = enabledModules.filter((id) => id.startsWith('build-'));

  // Handle strictness selection (only one allowed)
  const handleStrictnessSelect = (moduleId: string) => {
    // Remove any existing strictness module first
    const currentStrictness = enabledModules.find((id) => id.startsWith('strictness-'));
    if (currentStrictness && currentStrictness !== moduleId) {
      toggleModule(currentStrictness);
    }
    toggleModule(moduleId);
  };

  // Calculate total rules that will be added
  const previewRules = useMemo(() => mergeModuleRules(enabledModules), [enabledModules]);

  const handleApplyModules = () => {
    if (previewRules.length === 0) {
      alert('No modules selected. Enable some modules first.');
      return;
    }

    // Create rules with IDs
    const moduleRules = previewRules.map((rule, index) => ({
      ...rule,
      id: crypto.randomUUID(),
      order: index,
    }));

    // Add module rules to the beginning of the filter
    setFilter({
      ...filter,
      rules: [...moduleRules, ...filter.rules],
    });

    alert(`Added ${moduleRules.length} rules from ${enabledModules.length} module(s).`);
    onClose();
  };

  if (!isOpen) return null;

  // Group builds by subcategory (base class)
  const buildsByClass = BUILD_MODULES.reduce(
    (acc, module) => {
      const key = module.subcategory || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(module);
      return acc;
    },
    {} as Record<string, FilterModule[]>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-le-dark border border-le-border rounded-lg w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-le-border">
          <div>
            <h2 className="text-lg font-semibold">Filter Modules</h2>
            <p className="text-sm text-gray-400">Select modules to customize your filter</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-le-border rounded">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-le-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-le-accent border-b-2 border-le-accent bg-le-accent/5'
                  : 'text-gray-400 hover:text-white hover:bg-le-border/50'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'ascendancy' && selectedAscendancies.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-le-accent/20 text-le-accent rounded">
                  {selectedAscendancies.length}
                </span>
              )}
              {tab.id === 'strictness' && selectedStrictness && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-le-accent/20 text-le-accent rounded">1</span>
              )}
              {tab.id === 'playstyle' && selectedPlaystyles.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-le-accent/20 text-le-accent rounded">
                  {selectedPlaystyles.length}
                </span>
              )}
              {tab.id === 'build' && selectedBuilds.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-le-accent/20 text-le-accent rounded">
                  {selectedBuilds.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Ascendancy Tab */}
          {activeTab === 'ascendancy' && (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                Select one or more classes. Multi-class selection will show items for ALL selected classes.
              </p>
              <div className="grid grid-cols-5 gap-3">
                {ASCENDANCY_MODULES.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    isSelected={enabledModules.includes(module.id)}
                    onToggle={() => toggleModule(module.id)}
                    variant="ascendancy"
                  />
                ))}
              </div>
              {selectedAscendancies.length > 1 && (
                <div className="mt-4 p-3 bg-le-accent/10 border border-le-accent/30 rounded-lg">
                  <p className="text-sm text-le-accent">
                    Multi-class mode: Your filter will show items usable by{' '}
                    {selectedAscendancies.map((id) => getModuleById(id)?.name).join(' and ')}.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Strictness Tab */}
          {activeTab === 'strictness' && (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                Select a strictness level. Only one can be active at a time.
              </p>
              <div className="space-y-3">
                {STRICTNESS_MODULES.map((module, index) => {
                  const level = STRICTNESS_LEVELS[index];
                  return (
                    <button
                      key={module.id}
                      onClick={() => handleStrictnessSelect(module.id)}
                      className={clsx(
                        'w-full p-4 rounded-lg border text-left transition-all',
                        enabledModules.includes(module.id)
                          ? 'border-le-accent bg-le-accent/10'
                          : 'border-le-border hover:border-le-accent/50 hover:bg-le-border/30'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={clsx(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                              enabledModules.includes(module.id)
                                ? 'bg-le-accent border-le-accent'
                                : 'border-gray-500'
                            )}
                          >
                            {enabledModules.includes(module.id) && <Check size={12} />}
                          </div>
                          <span className="font-semibold">{level?.name || module.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{module.rules.length} rules</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2 ml-8">{level?.description || module.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Playstyle Tab */}
          {activeTab === 'playstyle' && (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                Select playstyle modules to optimize your filter for your play mode.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PLAYSTYLE_MODULES.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    isSelected={enabledModules.includes(module.id)}
                    onToggle={() => toggleModule(module.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Build Tab */}
          {activeTab === 'build' && (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                Select specific build modules for optimized gear highlighting. These add specialized rules for your build.
              </p>
              {Object.entries(buildsByClass).map(([className, builds]) => (
                <div key={className} className="mb-6">
                  <h3 className="text-sm font-semibold text-le-accent mb-3 flex items-center gap-2">
                    <Shield size={14} />
                    {className}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {builds.map((module) => (
                      <ModuleCard
                        key={module.id}
                        module={module}
                        isSelected={enabledModules.includes(module.id)}
                        onToggle={() => toggleModule(module.id)}
                        compact
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conflicts Warning */}
        {conflicts.length > 0 && (
          <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-500 text-sm">
              <AlertTriangle size={16} />
              <span>
                Conflict detected: {getModuleById(conflicts[0].id)?.name} conflicts with{' '}
                {getModuleById(conflicts[0].conflictsWith)?.name}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-le-border bg-le-darker">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-400">Selected: </span>
              <span className="text-white font-medium">{enabledModules.length} modules</span>
              <span className="text-gray-500 mx-2">|</span>
              <span className="text-gray-400">Rules to add: </span>
              <span className="text-le-accent font-medium">{previewRules.length}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleApplyModules}
                disabled={previewRules.length === 0}
                className={clsx('btn-primary', previewRules.length === 0 && 'opacity-50 cursor-not-allowed')}
              >
                Apply Modules
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Module Card Component
interface ModuleCardProps {
  module: FilterModule;
  isSelected: boolean;
  onToggle: () => void;
  variant?: 'default' | 'ascendancy';
  compact?: boolean;
}

function ModuleCard({ module, isSelected, onToggle, variant = 'default', compact = false }: ModuleCardProps) {
  const classColors: Record<string, string> = {
    Sentinel: 'border-amber-500/50 bg-amber-500/10',
    Mage: 'border-blue-500/50 bg-blue-500/10',
    Primalist: 'border-green-500/50 bg-green-500/10',
    Rogue: 'border-purple-500/50 bg-purple-500/10',
    Acolyte: 'border-red-500/50 bg-red-500/10',
  };

  const selectedClassColors: Record<string, string> = {
    Sentinel: 'border-amber-500 bg-amber-500/20',
    Mage: 'border-blue-500 bg-blue-500/20',
    Primalist: 'border-green-500 bg-green-500/20',
    Rogue: 'border-purple-500 bg-purple-500/20',
    Acolyte: 'border-red-500 bg-red-500/20',
  };

  const getCardClass = () => {
    if (variant === 'ascendancy' && module.subcategory) {
      return isSelected
        ? selectedClassColors[module.subcategory] || 'border-le-accent bg-le-accent/10'
        : classColors[module.subcategory] || 'border-le-border';
    }
    return isSelected ? 'border-le-accent bg-le-accent/10' : 'border-le-border hover:border-le-accent/50';
  };

  return (
    <button
      onClick={onToggle}
      className={clsx(
        'p-3 rounded-lg border text-left transition-all',
        getCardClass(),
        compact ? 'p-2' : 'p-3'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className={clsx(
            'w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0',
            isSelected ? 'bg-le-accent border-le-accent' : 'border-gray-500'
          )}
        >
          {isSelected && <Check size={12} />}
        </div>
        <span className={clsx('font-medium', compact ? 'text-sm' : '')}>{module.name}</span>
        {!compact && (
          <span className="text-xs text-gray-500 ml-auto">
            {module.rules.length} rule{module.rules.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {!compact && <p className="text-xs text-gray-500 ml-6 line-clamp-2">{module.description}</p>}
    </button>
  );
}
