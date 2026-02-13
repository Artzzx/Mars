import { useState, useMemo } from 'react';
import { X, Check, Zap, Shield, Swords, Play, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { useFilterStore } from '../../store/filterStore';
import {
  compileFilter,
  getFilterStats,
  STRICTNESS_CONFIGS,
  ALL_BUILDS,
  BUILDS_BY_CLASS,
  type FilterStats,
  type StrictnessConfig,
  type BuildProfile,
} from '../../lib/templates';
import type { CharacterClass } from '../../lib/filters/types';

interface TemplateGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate?: () => void;
}

type StepType = 'strictness' | 'class' | 'build' | 'preview';

const CLASSES: { id: CharacterClass; name: string; color: string }[] = [
  { id: 'Sentinel', name: 'Sentinel', color: 'amber' },
  { id: 'Mage', name: 'Mage', color: 'blue' },
  { id: 'Primalist', name: 'Primalist', color: 'green' },
  { id: 'Rogue', name: 'Rogue', color: 'purple' },
  { id: 'Acolyte', name: 'Acolyte', color: 'red' },
];

export function TemplateGenerator({ isOpen, onClose, onGenerate }: TemplateGeneratorProps) {
  const { setFilter } = useFilterStore();
  const [step, setStep] = useState<StepType>('strictness');
  const [selectedStrictness, setSelectedStrictness] = useState<string>('regular');
  const [selectedClasses, setSelectedClasses] = useState<CharacterClass[]>([]);
  const [selectedBuild, setSelectedBuild] = useState<string | null>(null);

  // Generate preview
  const previewFilter = useMemo(() => {
    try {
      return compileFilter({
        strictnessId: selectedStrictness,
        buildId: selectedBuild || undefined,
        selectedClasses,
      });
    } catch {
      return null;
    }
  }, [selectedStrictness, selectedClasses, selectedBuild]);

  const stats = useMemo(() => {
    return previewFilter ? getFilterStats(previewFilter) : null;
  }, [previewFilter]);

  const handleClassToggle = (classId: CharacterClass) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId]
    );
    // Clear build if class changes
    setSelectedBuild(null);
  };

  const handleApply = () => {
    if (!previewFilter) return;
    setFilter(previewFilter);
    onClose();
    onGenerate?.();
  };

  const handleReset = () => {
    setStep('strictness');
    setSelectedStrictness('regular');
    setSelectedClasses([]);
    setSelectedBuild(null);
  };

  if (!isOpen) return null;

  const strictnessConfig = STRICTNESS_CONFIGS.find((s) => s.id === selectedStrictness);
  const buildConfig = selectedBuild ? ALL_BUILDS.find((b) => b.id === selectedBuild) ?? null : null;
  const availableBuilds = selectedClasses.length === 1
    ? BUILDS_BY_CLASS.get(selectedClasses[0]) || []
    : [];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-le-dark border border-le-border rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-le-border">
          <div>
            <h2 className="text-lg font-semibold">Filter Generator</h2>
            <p className="text-sm text-gray-400">Create a complete filter from template</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-le-border rounded">
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex border-b border-le-border">
          <StepButton
            icon={<Zap size={16} />}
            label="Strictness"
            active={step === 'strictness'}
            completed={!!selectedStrictness}
            onClick={() => setStep('strictness')}
          />
          <StepButton
            icon={<Shield size={16} />}
            label="Class"
            active={step === 'class'}
            completed={selectedClasses.length > 0}
            onClick={() => setStep('class')}
          />
          <StepButton
            icon={<Swords size={16} />}
            label="Build (Optional)"
            active={step === 'build'}
            completed={!!selectedBuild}
            onClick={() => selectedClasses.length === 1 && setStep('build')}
            disabled={selectedClasses.length !== 1}
          />
          <StepButton
            icon={<Play size={16} />}
            label="Preview"
            active={step === 'preview'}
            completed={false}
            onClick={() => setStep('preview')}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Strictness */}
          {step === 'strictness' && (
            <StrictnessSelector
              selected={selectedStrictness}
              onSelect={setSelectedStrictness}
            />
          )}

          {/* Step 2: Class Selection */}
          {step === 'class' && (
            <ClassSelector
              selected={selectedClasses}
              onToggle={handleClassToggle}
            />
          )}

          {/* Step 3: Build Selection */}
          {step === 'build' && (
            <BuildSelector
              builds={availableBuilds}
              selected={selectedBuild}
              onSelect={setSelectedBuild}
              className={selectedClasses[0]}
            />
          )}

          {/* Step 4: Preview */}
          {step === 'preview' && previewFilter && stats && (
            <FilterPreview
              filter={previewFilter}
              stats={stats}
              strictness={strictnessConfig!}
              build={buildConfig}
              classes={selectedClasses}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-le-border bg-le-darker">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handleReset} className="text-sm text-gray-400 hover:text-white">
                Reset
              </button>
              {stats && (
                <div className="text-sm text-gray-400">
                  <span className="text-le-accent font-medium">{stats.totalRules}</span> rules will be generated
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {step !== 'strictness' && (
                <button
                  onClick={() => {
                    const steps: StepType[] = ['strictness', 'class', 'build', 'preview'];
                    const currentIndex = steps.indexOf(step);
                    if (currentIndex > 0) setStep(steps[currentIndex - 1]);
                  }}
                  className="btn-secondary"
                >
                  Back
                </button>
              )}
              {step !== 'preview' ? (
                <button
                  onClick={() => {
                    const steps: StepType[] = ['strictness', 'class', 'build', 'preview'];
                    const currentIndex = steps.indexOf(step);
                    // Skip build step if multiple classes selected
                    if (step === 'class' && selectedClasses.length !== 1) {
                      setStep('preview');
                    } else if (currentIndex < steps.length - 1) {
                      setStep(steps[currentIndex + 1]);
                    }
                  }}
                  className="btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleApply}
                  className="btn-primary"
                  disabled={!previewFilter}
                >
                  Generate Filter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function StepButton({
  icon,
  label,
  active,
  completed,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  completed: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
        active
          ? 'text-le-accent border-b-2 border-le-accent bg-le-accent/5'
          : disabled
            ? 'text-gray-600 cursor-not-allowed'
            : 'text-gray-400 hover:text-white hover:bg-le-border/50',
        completed && !active && 'text-green-400'
      )}
    >
      {completed && !active ? <Check size={16} className="text-green-400" /> : icon}
      {label}
    </button>
  );
}

function StrictnessSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Select Strictness Level</h3>
      <p className="text-sm text-gray-400 mb-6">
        Choose how strict your filter should be. Higher strictness means fewer items shown.
      </p>

      <div className="space-y-3">
        {STRICTNESS_CONFIGS.map((config) => (
          <button
            key={config.id}
            onClick={() => onSelect(config.id)}
            className={clsx(
              'w-full p-4 rounded-lg border text-left transition-all',
              selected === config.id
                ? 'border-le-accent bg-le-accent/10'
                : 'border-le-border hover:border-le-accent/50 hover:bg-le-border/30'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    selected === config.id ? 'bg-le-accent border-le-accent' : 'border-gray-500'
                  )}
                >
                  {selected === config.id && <Check size={12} />}
                </div>
                <span className="font-semibold text-lg">{config.name}</span>
              </div>
              <StrictnessIndicator level={config.order} />
            </div>
            <p className="text-sm text-gray-400 ml-8">{config.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StrictnessIndicator({ level }: { level: number }) {
  const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500'];
  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={clsx('w-2 h-4 rounded-sm', i <= level ? colors[level] : 'bg-gray-700')}
        />
      ))}
    </div>
  );
}

function ClassSelector({
  selected,
  onToggle,
}: {
  selected: CharacterClass[];
  onToggle: (classId: CharacterClass) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Select Class(es)</h3>
      <p className="text-sm text-gray-400 mb-6">
        Select one or more classes. Items for other classes will be hidden.
        Select one class to unlock build-specific options.
      </p>

      <div className="grid grid-cols-5 gap-4">
        {CLASSES.map((cls) => {
          const isSelected = selected.includes(cls.id);
          return (
            <button
              key={cls.id}
              onClick={() => onToggle(cls.id)}
              className={clsx(
                'p-4 rounded-lg border-2 text-center transition-all',
                isSelected
                  ? `border-${cls.color}-500 bg-${cls.color}-500/20`
                  : 'border-le-border hover:border-le-accent/50',
                // Fallback colors since Tailwind needs static classes
                isSelected && cls.color === 'amber' && 'border-amber-500 bg-amber-500/20',
                isSelected && cls.color === 'blue' && 'border-blue-500 bg-blue-500/20',
                isSelected && cls.color === 'green' && 'border-green-500 bg-green-500/20',
                isSelected && cls.color === 'purple' && 'border-purple-500 bg-purple-500/20',
                isSelected && cls.color === 'red' && 'border-red-500 bg-red-500/20'
              )}
            >
              <div className="flex justify-center mb-2">
                <div
                  className={clsx(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                    isSelected ? 'bg-le-accent border-le-accent' : 'border-gray-500'
                  )}
                >
                  {isSelected && <Check size={14} />}
                </div>
              </div>
              <div className="font-semibold">{cls.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {BUILDS_BY_CLASS.get(cls.id)?.length || 0} builds
              </div>
            </button>
          );
        })}
      </div>

      {selected.length > 1 && (
        <div className="mt-4 p-3 bg-le-accent/10 border border-le-accent/30 rounded-lg flex items-start gap-2">
          <Info size={16} className="text-le-accent mt-0.5" />
          <p className="text-sm text-le-accent">
            Multi-class mode enabled. Items usable by {selected.join(' or ')} will be shown.
            Build-specific options are only available with a single class selected.
          </p>
        </div>
      )}
    </div>
  );
}

function BuildSelector({
  builds,
  selected,
  onSelect,
  className,
}: {
  builds: BuildProfile[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  className: CharacterClass;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Select Build (Optional)</h3>
      <p className="text-sm text-gray-400 mb-6">
        Choose a specific build to optimize your filter for. This will highlight gear
        with affixes valuable for that build.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* No build option */}
        <button
          onClick={() => onSelect(null)}
          className={clsx(
            'p-4 rounded-lg border text-left transition-all',
            !selected
              ? 'border-le-accent bg-le-accent/10'
              : 'border-le-border hover:border-le-accent/50'
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={clsx(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                !selected ? 'bg-le-accent border-le-accent' : 'border-gray-500'
              )}
            >
              {!selected && <Check size={12} />}
            </div>
            <span className="font-semibold">Generic {className}</span>
          </div>
          <p className="text-sm text-gray-400 ml-8">
            No build-specific optimizations. Good for playing multiple builds.
          </p>
        </button>

        {/* Build options */}
        {builds.map((build) => (
          <button
            key={build.id}
            onClick={() => onSelect(build.id)}
            className={clsx(
              'p-4 rounded-lg border text-left transition-all',
              selected === build.id
                ? 'border-le-accent bg-le-accent/10'
                : 'border-le-border hover:border-le-accent/50'
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={clsx(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  selected === build.id ? 'bg-le-accent border-le-accent' : 'border-gray-500'
                )}
              >
                {selected === build.id && <Check size={12} />}
              </div>
              <span className="font-semibold">{build.displayName}</span>
            </div>
            <p className="text-sm text-gray-400 ml-8">
              {build.ascendancy} • {build.damageTypes.join(', ')} damage
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterPreview({
  filter,
  stats,
  strictness,
  build,
  classes,
}: {
  filter: { name: string; description: string; rules: { type: string; nameOverride: string }[] };
  stats: FilterStats;
  strictness: StrictnessConfig;
  build: BuildProfile | null;
  classes: CharacterClass[];
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Filter Preview</h3>
      <p className="text-sm text-gray-400 mb-6">
        Review your filter configuration before generating.
      </p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-le-border/30 border border-le-border">
          <div className="text-xs text-gray-400 uppercase mb-1">Strictness</div>
          <div className="font-semibold">{strictness.name}</div>
        </div>
        <div className="p-4 rounded-lg bg-le-border/30 border border-le-border">
          <div className="text-xs text-gray-400 uppercase mb-1">Class(es)</div>
          <div className="font-semibold">{classes.length > 0 ? classes.join(', ') : 'All'}</div>
        </div>
        <div className="p-4 rounded-lg bg-le-border/30 border border-le-border">
          <div className="text-xs text-gray-400 uppercase mb-1">Build</div>
          <div className="font-semibold">{build?.displayName || 'Generic'}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Rules" value={stats.totalRules} color="text-white" />
        <StatCard label="Show Rules" value={stats.showRules} color="text-green-400" />
        <StatCard label="Hide Rules" value={stats.hideRules} color="text-red-400" />
        <StatCard label="Highlight Rules" value={stats.highlightRules} color="text-yellow-400" />
      </div>

      {/* Rule Preview */}
      <div className="border border-le-border rounded-lg overflow-hidden">
        <div className="p-3 bg-le-border/30 border-b border-le-border">
          <div className="font-semibold">{filter.name}</div>
          <div className="text-xs text-gray-400">{filter.rules.length} rules</div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filter.rules.slice(0, 20).map((rule, index) => (
            <div
              key={index}
              className={clsx(
                'px-3 py-2 border-b border-le-border/50 text-sm flex items-center gap-2',
                rule.type === 'HIDE' && 'text-red-400',
                rule.type === 'SHOW' && 'text-green-400',
                rule.type === 'HIGHLIGHT' && 'text-yellow-400'
              )}
            >
              <span className="w-16 text-xs font-mono opacity-50">{rule.type}</span>
              <span>{rule.nameOverride}</span>
            </div>
          ))}
          {filter.rules.length > 20 && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              + {filter.rules.length - 20} more rules...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-le-border/30 border border-le-border text-center">
      <div className={clsx('text-2xl font-bold', color)}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
