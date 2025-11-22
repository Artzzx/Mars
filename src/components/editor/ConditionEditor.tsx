import { Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useState } from 'react';
import type {
  Condition,
  RarityCondition,
  SubTypeCondition,
  AffixCondition,
  ClassCondition,
  Rarity,
  EquipmentType,
  CharacterClass,
  ComparisonType,
} from '../../lib/filters/types';
import { EQUIPMENT_TYPE_NAMES } from '../../lib/filters/types';
import { AffixSearch } from './AffixSearch';
import { clsx } from 'clsx';

interface ConditionEditorProps {
  condition: Condition;
  onUpdate: (updates: Partial<Condition>) => void;
  onDelete: () => void;
}

const RARITIES: Rarity[] = ['NORMAL', 'MAGIC', 'RARE', 'EXALTED', 'UNIQUE', 'SET', 'LEGENDARY'];
const CLASSES: CharacterClass[] = ['Primalist', 'Mage', 'Sentinel', 'Rogue', 'Acolyte'];
const COMPARISONS: { value: ComparisonType; label: string }[] = [
  { value: 'ANY', label: 'Any' },
  { value: 'NONE', label: 'None' },
  { value: 'MORE_OR_EQUAL', label: '>=' },
  { value: 'LESS_OR_EQUAL', label: '<=' },
  { value: 'EQUAL', label: '=' },
];

// Group equipment types by category
const EQUIPMENT_GROUPS: { label: string; types: EquipmentType[] }[] = [
  {
    label: 'Armor',
    types: ['HELMET', 'BODY_ARMOR', 'GLOVES', 'BELT', 'BOOTS'],
  },
  {
    label: 'One-Handed Weapons',
    types: ['ONE_HANDED_AXE', 'ONE_HANDED_MACES', 'ONE_HANDED_SWORD', 'ONE_HANDED_DAGGER', 'ONE_HANDED_SCEPTRE', 'WAND'],
  },
  {
    label: 'Two-Handed Weapons',
    types: ['TWO_HANDED_AXE', 'TWO_HANDED_MACE', 'TWO_HANDED_SPEAR', 'TWO_HANDED_STAFF', 'TWO_HANDED_SWORD', 'BOW'],
  },
  {
    label: 'Off-Hand',
    types: ['SHIELD', 'QUIVER', 'CATALYST'],
  },
  {
    label: 'Accessories',
    types: ['AMULET', 'RING', 'RELIC'],
  },
  {
    label: 'Idols',
    types: ['IDOL_1x1_ETERRA', 'IDOL_1x1_LAGON', 'IDOL_1x2', 'IDOL_2x1', 'IDOL_1x3', 'IDOL_3x1', 'IDOL_1x4', 'IDOL_4x1', 'IDOL_2x2'],
  },
];

export function ConditionEditor({ condition, onUpdate, onDelete }: ConditionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getConditionTitle = () => {
    switch (condition.type) {
      case 'RarityCondition':
        return 'Rarity Condition';
      case 'SubTypeCondition':
        return 'Item Type Condition';
      case 'AffixCondition':
        return 'Affix Condition';
      case 'ClassCondition':
        return 'Class Condition';
      default:
        return 'Condition';
    }
  };

  const renderRarityCondition = (cond: RarityCondition) => {
    const toggleRarity = (rarity: Rarity) => {
      const newRarities = cond.rarity.includes(rarity)
        ? cond.rarity.filter((r) => r !== rarity)
        : [...cond.rarity, rarity];
      onUpdate({ rarity: newRarities } as Partial<RarityCondition>);
    };

    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-2">Rarities</label>
          <div className="flex flex-wrap gap-2">
            {RARITIES.map((rarity) => (
              <button
                key={rarity}
                onClick={() => toggleRarity(rarity)}
                className={clsx(
                  'px-2 py-1 text-xs rounded border transition-colors',
                  cond.rarity.includes(rarity)
                    ? 'border-le-accent bg-le-accent/20 text-le-accent'
                    : 'border-le-border hover:border-le-accent/50'
                )}
              >
                {rarity}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={cond.advanced}
            onChange={(e) => onUpdate({ advanced: e.target.checked } as Partial<RarityCondition>)}
            className="w-3 h-3 rounded border-le-border bg-le-darker"
          />
          <span className="text-xs">Advanced mode</span>
        </label>

        {cond.advanced && (
          <div className="flex gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Min Legendary Potential
              </label>
              <input
                type="number"
                min={0}
                max={4}
                value={cond.requiredLegendaryPotential}
                onChange={(e) =>
                  onUpdate({
                    requiredLegendaryPotential: Number(e.target.value),
                  } as Partial<RarityCondition>)
                }
                className="input w-20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Min Weaver's Will
              </label>
              <input
                type="number"
                min={0}
                value={cond.requiredWeaversWill}
                onChange={(e) =>
                  onUpdate({
                    requiredWeaversWill: Number(e.target.value),
                  } as Partial<RarityCondition>)
                }
                className="input w-20 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSubTypeCondition = (cond: SubTypeCondition) => {
    const toggleType = (type: EquipmentType) => {
      const newTypes = cond.equipmentTypes.includes(type)
        ? cond.equipmentTypes.filter((t) => t !== type)
        : [...cond.equipmentTypes, type];
      onUpdate({ equipmentTypes: newTypes } as Partial<SubTypeCondition>);
    };

    const toggleGroup = (types: EquipmentType[]) => {
      const allSelected = types.every((t) => cond.equipmentTypes.includes(t));
      if (allSelected) {
        onUpdate({
          equipmentTypes: cond.equipmentTypes.filter((t) => !types.includes(t)),
        } as Partial<SubTypeCondition>);
      } else {
        const newTypes = [...new Set([...cond.equipmentTypes, ...types])];
        onUpdate({ equipmentTypes: newTypes } as Partial<SubTypeCondition>);
      }
    };

    return (
      <div className="space-y-3">
        {EQUIPMENT_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => toggleGroup(group.types)}
                className="text-xs text-le-accent hover:text-le-accent-hover"
              >
                {group.label}
              </button>
              <span className="text-xs text-gray-500">
                ({cond.equipmentTypes.filter((t) => group.types.includes(t)).length}/{group.types.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {group.types.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={clsx(
                    'px-2 py-0.5 text-xs rounded border transition-colors',
                    cond.equipmentTypes.includes(type)
                      ? 'border-le-accent bg-le-accent/20 text-le-accent'
                      : 'border-le-border hover:border-le-accent/50'
                  )}
                >
                  {EQUIPMENT_TYPE_NAMES[type]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAffixCondition = (cond: AffixCondition) => {
    const [showAffixSearch, setShowAffixSearch] = useState(false);

    return (
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400">
              Selected Affixes ({cond.affixes.length})
            </label>
            <button
              onClick={() => setShowAffixSearch(!showAffixSearch)}
              className="flex items-center gap-1 text-xs text-le-accent hover:text-le-accent-hover"
            >
              <Search size={12} />
              {showAffixSearch ? 'Hide Search' : 'Search Affixes'}
            </button>
          </div>

          {showAffixSearch && (
            <div className="border border-le-border rounded-lg overflow-hidden mb-3">
              <AffixSearch
                selectedAffixIds={cond.affixes}
                onSelectionChange={(affixes) => onUpdate({ affixes } as Partial<AffixCondition>)}
              />
            </div>
          )}

          {!showAffixSearch && cond.affixes.length > 0 && (
            <div className="text-xs text-gray-500 bg-le-darker p-2 rounded max-h-20 overflow-y-auto">
              IDs: {cond.affixes.slice(0, 20).join(', ')}
              {cond.affixes.length > 20 && ` ...and ${cond.affixes.length - 20} more`}
            </div>
          )}

          {!showAffixSearch && cond.affixes.length === 0 && (
            <div className="text-xs text-gray-500 bg-le-darker p-3 rounded text-center">
              No affixes selected. Click "Search Affixes" to add.
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Comparison</label>
            <select
              value={cond.comparison}
              onChange={(e) =>
                onUpdate({ comparison: e.target.value as ComparisonType } as Partial<AffixCondition>)
              }
              className="input w-full text-sm"
            >
              {COMPARISONS.map((comp) => (
                <option key={comp.value} value={comp.value}>
                  {comp.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tier Value</label>
            <input
              type="number"
              min={0}
              value={cond.comparisonValue}
              onChange={(e) =>
                onUpdate({ comparisonValue: Number(e.target.value) } as Partial<AffixCondition>)
              }
              className="input w-full text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Min Matching Affixes on Item
          </label>
          <input
            type="number"
            min={1}
            value={cond.minOnTheSameItem}
            onChange={(e) =>
              onUpdate({ minOnTheSameItem: Number(e.target.value) } as Partial<AffixCondition>)
            }
            className="input w-20 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={cond.advanced}
            onChange={(e) => onUpdate({ advanced: e.target.checked } as Partial<AffixCondition>)}
            className="w-3 h-3 rounded border-le-border bg-le-darker"
          />
          <span className="text-xs">Advanced (combined tier comparison)</span>
        </label>

        {cond.advanced && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Combined Comparison
              </label>
              <select
                value={cond.combinedComparison}
                onChange={(e) =>
                  onUpdate({
                    combinedComparison: e.target.value as ComparisonType,
                  } as Partial<AffixCondition>)
                }
                className="input w-full text-sm"
              >
                {COMPARISONS.map((comp) => (
                  <option key={comp.value} value={comp.value}>
                    {comp.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Combined Value
              </label>
              <input
                type="number"
                min={0}
                value={cond.combinedComparisonValue}
                onChange={(e) =>
                  onUpdate({
                    combinedComparisonValue: Number(e.target.value),
                  } as Partial<AffixCondition>)
                }
                className="input w-full text-sm"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClassCondition = (cond: ClassCondition) => {
    const toggleClass = (cls: CharacterClass) => {
      const newClasses = cond.classes.includes(cls)
        ? cond.classes.filter((c) => c !== cls)
        : [...cond.classes, cls];
      onUpdate({ classes: newClasses } as Partial<ClassCondition>);
    };

    return (
      <div>
        <label className="block text-xs text-gray-400 mb-2">
          Hide for these classes
        </label>
        <div className="flex flex-wrap gap-2">
          {CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => toggleClass(cls)}
              className={clsx(
                'px-3 py-1 text-xs rounded border transition-colors',
                cond.classes.includes(cls)
                  ? 'border-le-accent bg-le-accent/20 text-le-accent'
                  : 'border-le-border hover:border-le-accent/50'
              )}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderConditionBody = () => {
    switch (condition.type) {
      case 'RarityCondition':
        return renderRarityCondition(condition);
      case 'SubTypeCondition':
        return renderSubTypeCondition(condition);
      case 'AffixCondition':
        return renderAffixCondition(condition);
      case 'ClassCondition':
        return renderClassCondition(condition);
      default:
        return <p className="text-gray-500 text-sm">Unknown condition type</p>;
    }
  };

  return (
    <div className="card border-le-border">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-le-card/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span className="text-sm font-medium">{getConditionTitle()}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-le-border rounded text-red-400"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 pt-0 border-t border-le-border">{renderConditionBody()}</div>
      )}
    </div>
  );
}
