import clsx from 'clsx';
import { DamageTypeChip, type DamageType } from '../common/DamageTypeChip';

interface LivePreviewPanelProps {
  selectedClass:       string | null;
  selectedMastery:     string | null;
  selectedDamageTypes: string[];
  selectedProgress:    string | null;
  selectedArchetype:   string | null;
  resistancesCapped:   boolean;
  showCrossClass:      boolean;
  isGenerating:        boolean;
  estimatedRules?:     number;
}

function PreviewRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2 border-b border-le-border last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-wide flex-shrink-0">{label}</span>
      <span className="text-xs text-right text-gray-300 font-medium">
        {value ?? <span className="text-gray-600 italic">—</span>}
      </span>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export function LivePreviewPanel({
  selectedClass,
  selectedMastery,
  selectedDamageTypes,
  selectedProgress,
  selectedArchetype,
  resistancesCapped,
  showCrossClass,
  isGenerating,
  estimatedRules,
}: LivePreviewPanelProps) {
  return (
    <div className="w-full">
      <div className={clsx('card p-4 relative overflow-hidden', isGenerating && 'pointer-events-none')}>
        {/* Generating skeleton overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-le-card/80 flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-8 h-8 border-2 border-le-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Compiling filter…</span>
          </div>
        )}

        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Build Summary
        </h3>

        <div className={clsx(isGenerating && 'opacity-30')}>
          <PreviewRow
            label="Class"
            value={selectedClass ? capitalize(selectedClass) : undefined}
          />
          <PreviewRow
            label="Mastery"
            value={selectedMastery ? capitalize(selectedMastery) : undefined}
          />
          <PreviewRow
            label="Damage"
            value={
              selectedDamageTypes.length > 0 ? (
                <span className="flex flex-wrap gap-1 justify-end">
                  {selectedDamageTypes.map((dt) => (
                    <DamageTypeChip
                      key={dt}
                      type={dt as DamageType}
                      selected
                      size="sm"
                      readonly
                    />
                  ))}
                </span>
              ) : undefined
            }
          />
          <PreviewRow
            label="Progress"
            value={selectedProgress ? capitalize(selectedProgress) : undefined}
          />
          <PreviewRow
            label="Archetype"
            value={selectedArchetype ? capitalize(selectedArchetype) : 'Not Sure'}
          />

          {(resistancesCapped || showCrossClass) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {resistancesCapped && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-le-green/10 text-le-green border border-le-green/30">
                  Res Capped
                </span>
              )}
              {showCrossClass && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-le-accent/10 text-le-accent border border-le-accent/30">
                  Cross-class
                </span>
              )}
            </div>
          )}

          {estimatedRules !== undefined && (
            <div className="mt-3 pt-3 border-t border-le-border">
              <span className="text-xs text-gray-500">Est. rules: </span>
              <span className="text-xs font-semibold text-le-accent">{estimatedRules} / 75</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
