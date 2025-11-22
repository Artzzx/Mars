import { X, ArrowRight, Plus, Minus, RefreshCw } from 'lucide-react';
import type { ItemFilter, Rule } from '../../lib/filters/types';

interface FilterComparisonProps {
  original: ItemFilter;
  upgraded: ItemFilter;
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

interface RuleDiff {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  original?: Rule;
  upgraded?: Rule;
  changes?: string[];
}

function compareRules(original: Rule[], upgraded: Rule[]): RuleDiff[] {
  const diffs: RuleDiff[] = [];

  // Find rules that were removed or modified
  original.forEach((origRule) => {
    const upgradedRule = upgraded.find((r) => r.id === origRule.id);
    if (!upgradedRule) {
      // Check if there's a similar rule by conditions
      const similarRule = upgraded.find(
        (r) =>
          r.type === origRule.type &&
          JSON.stringify(r.conditions) === JSON.stringify(origRule.conditions)
      );
      if (similarRule) {
        const changes: string[] = [];
        if (origRule.levelDependent && !similarRule.levelDependent) {
          changes.push('Level dependency converted to CharacterLevelCondition');
        }
        if (origRule.soundId !== similarRule.soundId) {
          changes.push('Sound ID updated');
        }
        if (origRule.beamId !== similarRule.beamId) {
          changes.push('Beam ID updated');
        }
        diffs.push({
          type: 'modified',
          original: origRule,
          upgraded: similarRule,
          changes,
        });
      } else {
        diffs.push({ type: 'removed', original: origRule });
      }
    }
  });

  // Find rules that were added
  upgraded.forEach((upgradedRule) => {
    const originalRule = original.find((r) => r.id === upgradedRule.id);
    if (!originalRule) {
      const similarRule = original.find(
        (r) =>
          r.type === upgradedRule.type &&
          JSON.stringify(r.conditions) === JSON.stringify(upgradedRule.conditions)
      );
      if (!similarRule) {
        diffs.push({ type: 'added', upgraded: upgradedRule });
      }
    }
  });

  return diffs;
}

export function FilterComparison({
  original,
  upgraded,
  isOpen,
  onClose,
  onApply,
}: FilterComparisonProps) {
  if (!isOpen) return null;

  const diffs = compareRules(original.rules, upgraded.rules);
  const addedCount = diffs.filter((d) => d.type === 'added').length;
  const removedCount = diffs.filter((d) => d.type === 'removed').length;
  const modifiedCount = diffs.filter((d) => d.type === 'modified').length;

  const formatChanges = () => {
    const changes: string[] = [];

    // Version change
    if (original.lootFilterVersion !== upgraded.lootFilterVersion) {
      changes.push(`Filter version: ${original.lootFilterVersion} → ${upgraded.lootFilterVersion}`);
    }

    // Game version change
    if (original.lastModifiedInVersion !== upgraded.lastModifiedInVersion) {
      changes.push(
        `Game version: ${original.lastModifiedInVersion} → ${upgraded.lastModifiedInVersion}`
      );
    }

    return changes;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-le-dark border border-le-border rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-le-border">
          <div className="flex items-center gap-2">
            <RefreshCw size={20} className="text-le-accent" />
            <h2 className="text-lg font-semibold">Filter Upgrade Preview</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-le-border rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-180px)]">
          {/* Summary */}
          <div className="bg-le-card rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold mb-3">Upgrade Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-500/10 rounded p-2">
                <div className="text-2xl font-bold text-green-400">{addedCount}</div>
                <div className="text-xs text-gray-400">Added</div>
              </div>
              <div className="bg-yellow-500/10 rounded p-2">
                <div className="text-2xl font-bold text-yellow-400">{modifiedCount}</div>
                <div className="text-xs text-gray-400">Modified</div>
              </div>
              <div className="bg-red-500/10 rounded p-2">
                <div className="text-2xl font-bold text-red-400">{removedCount}</div>
                <div className="text-xs text-gray-400">Removed</div>
              </div>
            </div>
          </div>

          {/* Version Changes */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">FORMAT CHANGES</h3>
            <div className="space-y-1">
              {formatChanges().map((change, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                  <ArrowRight size={14} className="text-le-accent" />
                  {change}
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <ArrowRight size={14} className="text-le-accent" />
                Level-dependent rules converted to CharacterLevelCondition
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <ArrowRight size={14} className="text-le-accent" />
                Added SoundId, BeamId, Order fields to all rules
              </div>
            </div>
          </div>

          {/* Rule Changes */}
          {diffs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">RULE CHANGES</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {diffs.map((diff, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-xs ${
                      diff.type === 'added'
                        ? 'bg-green-500/10 border-l-2 border-green-500'
                        : diff.type === 'removed'
                          ? 'bg-red-500/10 border-l-2 border-red-500'
                          : 'bg-yellow-500/10 border-l-2 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {diff.type === 'added' && <Plus size={12} className="text-green-400" />}
                      {diff.type === 'removed' && <Minus size={12} className="text-red-400" />}
                      {diff.type === 'modified' && (
                        <RefreshCw size={12} className="text-yellow-400" />
                      )}
                      <span className="font-medium">
                        {diff.type === 'added'
                          ? `New: ${diff.upgraded?.type} rule`
                          : diff.type === 'removed'
                            ? `Removed: ${diff.original?.type} rule`
                            : `Modified: ${diff.original?.type} rule`}
                      </span>
                    </div>
                    {diff.changes && diff.changes.length > 0 && (
                      <div className="ml-5 mt-1 text-gray-400">
                        {diff.changes.map((change, i) => (
                          <div key={i}>• {change}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {diffs.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              No significant rule changes detected. Only metadata will be updated.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-le-border flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onApply} className="btn-primary">
            Apply Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
