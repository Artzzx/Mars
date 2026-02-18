import { Plus, GripVertical, Trash2, Copy, Eye, EyeOff, ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useFilterStore } from '../../store/filterStore';
import { FILTER_COLORS } from '../../lib/filters/types';
import { clsx } from 'clsx';

export function RuleList() {
  const {
    filter,
    selectedRuleId,
    selectRule,
    addRule,
    deleteRule,
    duplicateRule,
    toggleRuleEnabled,
    moveRule,
    enableAllRules,
    disableAllRules,
    deleteDisabledRules,
  } = useFilterStore();

  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const disabledCount = filter.rules.filter((r) => !r.isEnabled).length;
  const enabledCount = filter.rules.filter((r) => r.isEnabled).length;

  const getRuleTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'SHOW':
        return 'bg-green-500/20 text-green-400';
      case 'HIDE':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRuleSummary = (rule: typeof filter.rules[0]) => {
    if (rule.nameOverride) return rule.nameOverride;

    const parts: string[] = [];
    rule.conditions.forEach((condition) => {
      switch (condition.type) {
        case 'RarityCondition':
          parts.push(`Rarity: ${condition.rarity.join(', ')}`);
          break;
        case 'SubTypeCondition':
          parts.push(`Types: ${condition.equipmentTypes.length} items`);
          break;
        case 'AffixCondition':
          parts.push(`Affixes: ${condition.affixes.length} selected`);
          break;
        case 'ClassCondition':
          parts.push(`Class: ${condition.classes.join(', ')}`);
          break;
      }
    });

    return parts.join(' • ') || 'No conditions';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-le-border">
        <h2 className="font-semibold text-white">Rules ({filter.rules.length})</h2>
        <div className="flex items-center gap-2">
          {/* Bulk Actions Menu */}
          {filter.rules.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="p-1.5 hover:bg-le-border rounded text-gray-400 hover:text-white transition-colors"
                title="Bulk actions"
              >
                <MoreHorizontal size={16} />
              </button>
              {showBulkMenu && (
                <div className="absolute right-0 top-full mt-1 bg-le-card border border-le-border rounded-lg shadow-lg z-10 min-w-[160px]">
                  <button
                    onClick={() => {
                      enableAllRules();
                      setShowBulkMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-le-border transition-colors flex items-center gap-2"
                  >
                    <Eye size={14} />
                    Enable All ({enabledCount})
                  </button>
                  <button
                    onClick={() => {
                      disableAllRules();
                      setShowBulkMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-le-border transition-colors flex items-center gap-2"
                  >
                    <EyeOff size={14} />
                    Disable All
                  </button>
                  {disabledCount > 0 && (
                    <button
                      onClick={() => {
                        deleteDisabledRules();
                        setShowBulkMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-le-border transition-colors flex items-center gap-2 text-red-400"
                    >
                      <Trash2 size={14} />
                      Delete Disabled ({disabledCount})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => addRule()}
            className="flex items-center gap-1 text-sm text-le-accent hover:text-le-accent-hover transition-colors"
          >
            <Plus size={16} />
            Add Rule
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filter.rules.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">No rules yet</p>
            <button
              onClick={() => addRule()}
              className="text-le-accent hover:text-le-accent-hover text-sm"
            >
              Add your first rule
            </button>
          </div>
        ) : (
          <div className="divide-y divide-le-border">
            {filter.rules.map((rule, index) => {
              const colorInfo = FILTER_COLORS.find((c) => c.id === rule.color);

              return (
                <div
                  key={rule.id}
                  onClick={() => selectRule(rule.id)}
                  className={clsx(
                    'p-3 cursor-pointer transition-colors group',
                    selectedRuleId === rule.id
                      ? 'bg-le-accent/10'
                      : 'hover:bg-le-card',
                    !rule.isEnabled && 'opacity-50'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveRule(rule.id, 'up');
                        }}
                        disabled={index === 0}
                        className="p-0.5 hover:bg-le-border rounded disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <GripVertical size={14} className="text-gray-500" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveRule(rule.id, 'down');
                        }}
                        disabled={index === filter.rules.length - 1}
                        className="p-0.5 hover:bg-le-border rounded disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={clsx(
                            'text-xs font-semibold px-2 py-0.5 rounded',
                            getRuleTypeBadgeClass(rule.type)
                          )}
                        >
                          {rule.type}
                        </span>

                        {rule.emphasized && (
                          <span className="text-xs bg-le-gold/20 text-le-gold px-2 py-0.5 rounded">
                            EMPHASIZED
                          </span>
                        )}

                        {colorInfo && rule.color !== 0 && (
                          <div
                            className="w-4 h-4 rounded border border-white/20"
                            style={{ backgroundColor: colorInfo.hex }}
                            title={colorInfo.name}
                          />
                        )}
                      </div>

                      <p className="text-sm text-gray-300 truncate">
                        {getRuleSummary(rule)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRuleEnabled(rule.id);
                        }}
                        className="p-1.5 hover:bg-le-border rounded"
                        title={rule.isEnabled ? 'Disable rule' : 'Enable rule'}
                      >
                        {rule.isEnabled ? (
                          <Eye size={14} />
                        ) : (
                          <EyeOff size={14} />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateRule(rule.id);
                        }}
                        className="p-1.5 hover:bg-le-border rounded"
                        title="Duplicate rule"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRule(rule.id);
                        }}
                        className="p-1.5 hover:bg-le-border rounded text-red-400"
                        title="Delete rule"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
