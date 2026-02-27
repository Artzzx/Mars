import { X, Loader2, Wand2, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useFilterStore } from '../../store/filterStore';
import { useBuildAnalysis, useBackendAvailable, useBuildProfiles } from '@/hooks/useBackendApi';
import { compileFilter } from '@/lib/templates/core/engine';
import { ALL_BUILDS, getBuildsByClass } from '@/lib/templates/schemas/builds';
import { clsx } from 'clsx';

interface BuildAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHARACTER_CLASSES = [
  { id: 'Sentinel', name: 'Sentinel' },
  { id: 'Mage', name: 'Mage' },
  { id: 'Primalist', name: 'Primalist' },
  { id: 'Rogue', name: 'Rogue' },
  { id: 'Acolyte', name: 'Acolyte' },
];

const DAMAGE_TYPES = [
  { id: 'physical', name: 'Physical' },
  { id: 'fire', name: 'Fire' },
  { id: 'cold', name: 'Cold' },
  { id: 'lightning', name: 'Lightning' },
  { id: 'void', name: 'Void' },
  { id: 'necrotic', name: 'Necrotic' },
  { id: 'poison', name: 'Poison' },
];

export function BuildAnalysisModal({ isOpen, onClose }: BuildAnalysisModalProps) {
  const { setFilter, strictness } = useFilterStore();
  const { available } = useBackendAvailable();
  const { analyze, analysis, loading, error, clearAnalysis } = useBuildAnalysis();
  const { data: _backendBuilds } = useBuildProfiles();

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDamageTypes, setSelectedDamageTypes] = useState<string[]>([]);
  const [selectedBuild, setSelectedBuild] = useState<string>('');
  const [applied, setApplied] = useState(false);

  // Get available builds for selected class
  const availableBuilds = selectedClass
    ? getBuildsByClass(selectedClass)
    : ALL_BUILDS;

  const handleDamageTypeToggle = (damageType: string) => {
    setSelectedDamageTypes((prev) =>
      prev.includes(damageType)
        ? prev.filter((dt) => dt !== damageType)
        : [...prev, damageType]
    );
  };

  const handleAnalyze = useCallback(async () => {
    if (!selectedClass) return;

    setApplied(false);
    await analyze({
      character_class: selectedClass,
      damage_types: selectedDamageTypes,
      build_id: selectedBuild || undefined,
    });
  }, [selectedClass, selectedDamageTypes, selectedBuild, analyze]);

  const handleApplyToFilter = useCallback(() => {
    // Use local compilation with the selected build
    const newFilter = compileFilter({
      strictnessId: strictness,
      buildId: selectedBuild || undefined,
      selectedClasses: selectedClass ? [selectedClass as any] : [],
    });

    setFilter(newFilter);
    setApplied(true);
  }, [selectedBuild, selectedClass, strictness, setFilter]);

  const handleClose = () => {
    clearAnalysis();
    setApplied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-le-bg-dark border border-le-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-le-border">
          <div className="flex items-center gap-3">
            <Wand2 className="text-le-purple" size={24} />
            <div>
              <h2 className="text-lg font-bold">Auto-Adjust for Build</h2>
              <p className="text-sm text-gray-400">
                {available
                  ? 'AI-powered analysis with backend optimization'
                  : 'Using local build profiles'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-le-bg-light rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Character Class</label>
            <div className="grid grid-cols-5 gap-2">
              {CHARACTER_CLASSES.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClass(cls.id);
                    setSelectedBuild('');
                  }}
                  className={clsx(
                    'px-3 py-2 rounded border transition-colors text-sm',
                    selectedClass === cls.id
                      ? 'border-le-accent bg-le-accent/20 text-le-accent'
                      : 'border-le-border hover:border-le-accent/50'
                  )}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          </div>

          {/* Build Selection */}
          {selectedClass && (
            <div>
              <label className="block text-sm font-medium mb-2">Build Profile (Optional)</label>
              <select
                value={selectedBuild}
                onChange={(e) => setSelectedBuild(e.target.value)}
                className="w-full bg-le-bg-light border border-le-border rounded px-3 py-2"
              >
                <option value="">-- Select a build --</option>
                {availableBuilds.map((build) => (
                  <option key={build.id} value={build.id}>
                    {build.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Damage Types */}
          <div>
            <label className="block text-sm font-medium mb-2">Damage Types</label>
            <div className="flex flex-wrap gap-2">
              {DAMAGE_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => handleDamageTypeToggle(dt.id)}
                  className={clsx(
                    'px-3 py-1 rounded border transition-colors text-sm',
                    selectedDamageTypes.includes(dt.id)
                      ? 'border-le-gold bg-le-gold/20 text-le-gold'
                      : 'border-le-border hover:border-le-gold/50'
                  )}
                >
                  {dt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          {available && (
            <button
              onClick={handleAnalyze}
              disabled={!selectedClass || loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Analyze Build
                </>
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-le-accent">Analysis Results</h3>

              {/* Recommended Affixes */}
              <div className="bg-le-bg-light rounded p-4">
                <h4 className="text-sm font-medium mb-2">Top Recommended Affixes</h4>
                <div className="grid grid-cols-2 gap-2">
                  {analysis.recommended_affixes.slice(0, 10).map((affix) => (
                    <div
                      key={affix.id}
                      className="flex items-center justify-between text-sm bg-le-bg-dark px-3 py-2 rounded"
                    >
                      <span>{affix.name}</span>
                      <span className="text-xs text-gray-400">{affix.category}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rule Preview */}
              {analysis.rule_preview.length > 0 && (
                <div className="bg-le-bg-light rounded p-4">
                  <h4 className="text-sm font-medium mb-2">Rule Patterns</h4>
                  <div className="space-y-1">
                    {analysis.rule_preview.slice(0, 5).map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm text-gray-300"
                      >
                        <span>{rule.pattern}</span>
                        <span className="text-xs px-2 py-0.5 bg-le-bg-dark rounded">
                          {rule.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Applied Success */}
          {applied && (
            <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/50 rounded text-green-400">
              <CheckCircle size={18} />
              <span>Filter updated successfully!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-le-border flex justify-end gap-3">
          <button onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleApplyToFilter}
            disabled={!selectedClass}
            className="btn-primary disabled:opacity-50"
          >
            Apply to Filter
          </button>
        </div>
      </div>
    </div>
  );
}
