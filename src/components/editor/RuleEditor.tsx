import { useFilterStore } from '../../store/filterStore';
import type { Rule, RuleType, Condition } from '../../lib/filters/types';
import { FILTER_COLORS, FILTER_SOUNDS, FILTER_BEAMS, MAX_RULES } from '../../lib/filters/types';
import { ConditionEditor } from './ConditionEditor';
import { Plus, Volume2, Compass } from 'lucide-react';
import { clsx } from 'clsx';

const RULE_TYPES: { value: RuleType; label: string; description: string }[] = [
  { value: 'SHOW', label: 'Show', description: 'Display matching items normally' },
  { value: 'HIDE', label: 'Hide', description: 'Hide matching items from view' },
];

export function RuleEditor() {
  const { filter, selectedRuleId, updateRule } = useFilterStore();

  const selectedRule = filter.rules.find((r) => r.id === selectedRuleId);

  if (!selectedRule) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="mb-2">Select a rule to edit</p>
          <p className="text-sm">or create a new one</p>
        </div>
      </div>
    );
  }

  const handleUpdateRule = (updates: Partial<Rule>) => {
    updateRule(selectedRule.id, updates);
  };

  const hasConditionType = (type: Condition['type']) =>
    selectedRule.conditions.some((c) => c.type === type);

  const handleAddCondition = (type: Condition['type']) => {
    if (filter.rules.length > MAX_RULES) return;

    let newCondition: Condition;

    switch (type) {
      case 'RarityCondition':
        newCondition = {
          type: 'RarityCondition',
          rarity: [],
          minLegendaryPotential: null,
          maxLegendaryPotential: null,
          minWeaversWill: null,
          maxWeaversWill: null,
        };
        break;
      case 'SubTypeCondition':
        newCondition = {
          type: 'SubTypeCondition',
          equipmentTypes: [],
          subTypes: [],
        };
        break;
      case 'AffixCondition':
        newCondition = {
          type: 'AffixCondition',
          affixes: [],
          comparison: 'ANY',
          comparisonValue: 1,
          minOnTheSameItem: 1,
          combinedComparison: 'ANY',
          combinedComparisonValue: 1,
          advanced: false,
        };
        break;
      case 'ClassCondition':
        newCondition = {
          type: 'ClassCondition',
          classes: [],
        };
        break;
      case 'CharacterLevelCondition':
        newCondition = {
          type: 'CharacterLevelCondition',
          minimumLvl: 0,
          maximumLvl: 100,
        };
        break;
      case 'AffixCountCondition':
        newCondition = {
          type: 'AffixCountCondition',
          minPrefixes: null,
          maxPrefixes: null,
          minSuffixes: null,
          maxSuffixes: null,
          sealedType: 'Any',
        };
        break;
      case 'LevelCondition':
        newCondition = {
          type: 'LevelCondition',
          treshold: 0,
          levelType: 'BELOW_LEVEL',
        };
        break;
      case 'FactionCondition':
        newCondition = {
          type: 'FactionCondition',
          factions: ['CircleOfFortune'],
        };
        break;
      case 'KeysCondition':
        newCondition = {
          type: 'KeysCondition',
          flag: 'DungeonKeys',
        };
        break;
      case 'CraftingMaterialsCondition':
        newCondition = {
          type: 'CraftingMaterialsCondition',
          flag: 'CommonShards',
        };
        break;
      case 'ResonancesCondition':
        newCondition = {
          type: 'ResonancesCondition',
          flag: 'GoldResonance',
        };
        break;
      case 'WovenEchoesCondition':
        newCondition = {
          type: 'WovenEchoesCondition',
          flag: 'WovenEchoesRank1',
        };
        break;
      default:
        return;
    }

    handleUpdateRule({
      conditions: [...selectedRule.conditions, newCondition],
    });
  };

  const handleUpdateCondition = (index: number, updates: Partial<Condition>) => {
    const newConditions = [...selectedRule.conditions];
    newConditions[index] = { ...newConditions[index], ...updates } as Condition;
    handleUpdateRule({ conditions: newConditions });
  };

  const handleDeleteCondition = (index: number) => {
    const newConditions = selectedRule.conditions.filter((_, i) => i !== index);
    handleUpdateRule({ conditions: newConditions });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Rule Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Rule Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {RULE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleUpdateRule({ type: type.value })}
                className={clsx(
                  'p-3 rounded border text-left transition-colors',
                  selectedRule.type === type.value
                    ? 'border-le-accent bg-le-accent/10'
                    : 'border-le-border hover:border-le-accent/50'
                )}
              >
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-gray-500 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Highlight Color
          </label>
          <div className="flex flex-wrap gap-2">
            {FILTER_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => handleUpdateRule({ color: color.id })}
                className={clsx(
                  'w-8 h-8 rounded border-2 transition-all',
                  selectedRule.color === color.id
                    ? 'border-white scale-110'
                    : 'border-transparent hover:border-white/50'
                )}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Sound Effect */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <span className="flex items-center gap-2">
              <Volume2 size={16} />
              Drop Sound
            </span>
          </label>
          <select
            value={selectedRule.soundId ?? 0}
            onChange={(e) => handleUpdateRule({ soundId: Number(e.target.value) })}
            className="input w-full"
          >
            {FILTER_SOUNDS.map((sound) => (
              <option key={sound.id} value={sound.id}>
                {sound.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Sound effect played when this item drops
          </p>
        </div>

        {/* Map Beam/Icon */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <span className="flex items-center gap-2">
              <Compass size={16} />
              Map Beam
            </span>
          </label>
          <select
            value={selectedRule.beamId ?? 0}
            onChange={(e) => handleUpdateRule({ beamId: Number(e.target.value) })}
            className="input w-full"
          >
            {FILTER_BEAMS.map((beam) => (
              <option key={beam.id} value={beam.id}>
                {beam.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Colored beam pillar shown on the minimap
          </p>
        </div>

        {/* Emphasized Toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedRule.emphasized}
              onChange={(e) => handleUpdateRule({ emphasized: e.target.checked })}
              className="w-4 h-4 rounded border-le-border bg-le-darker text-le-accent focus:ring-le-accent"
            />
            <div>
              <span className="font-medium text-sm">Emphasized</span>
              <p className="text-xs text-gray-500">
                Makes the item label larger and adds visual emphasis
              </p>
            </div>
          </label>
        </div>

        {/* Name Override */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Custom Label (optional)
          </label>
          <input
            type="text"
            value={selectedRule.nameOverride}
            onChange={(e) => handleUpdateRule({ nameOverride: e.target.value })}
            placeholder="Override item name display"
            className="input w-full"
          />
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">
              Conditions ({selectedRule.conditions.length})
            </label>
          </div>

          <div className="space-y-3">
            {selectedRule.conditions.map((condition, index) => (
              <ConditionEditor
                key={index}
                condition={condition}
                onUpdate={(updates) => handleUpdateCondition(index, updates)}
                onDelete={() => handleDeleteCondition(index)}
              />
            ))}
          </div>

          {/* Add Condition Buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => handleAddCondition('RarityCondition')}
              disabled={hasConditionType('RarityCondition')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-le-border hover:border-le-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-le-border"
            >
              <Plus size={14} />
              Rarity
            </button>
            <button
              onClick={() => handleAddCondition('SubTypeCondition')}
              disabled={hasConditionType('SubTypeCondition')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-le-border hover:border-le-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-le-border"
            >
              <Plus size={14} />
              Item Type
            </button>
            <button
              onClick={() => handleAddCondition('AffixCondition')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-le-border hover:border-le-accent transition-colors"
            >
              <Plus size={14} />
              Affix
            </button>
            <button
              onClick={() => handleAddCondition('ClassCondition')}
              disabled={hasConditionType('ClassCondition')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-le-border hover:border-le-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-le-border"
            >
              <Plus size={14} />
              Class
            </button>
            <button
              onClick={() => handleAddCondition('CharacterLevelCondition')}
              disabled={hasConditionType('CharacterLevelCondition')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-le-border hover:border-le-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-le-border"
            >
              <Plus size={14} />
              Level Range
            </button>
            <button
              onClick={() => handleAddCondition('AffixCountCondition')}
              disabled={hasConditionType('AffixCountCondition')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-le-border hover:border-le-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-le-border"
            >
              <Plus size={14} />
              Affix Count
            </button>
            <button
              onClick={() => handleAddCondition('LevelCondition')}
              disabled={hasConditionType('LevelCondition')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-le-border hover:border-le-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-le-border"
            >
              <Plus size={14} />
              Level
            </button>
            <button
              onClick={() => handleAddCondition('FactionCondition')}
              disabled={hasConditionType('FactionCondition')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-le-border hover:border-le-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-le-border"
            >
              <Plus size={14} />
              Faction
            </button>
            <button
              onClick={() => handleAddCondition('KeysCondition')}
              disabled={hasConditionType('KeysCondition')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-le-border hover:border-le-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-le-border"
            >
              <Plus size={14} />
              Keys
            </button>
            <button
              onClick={() => handleAddCondition('CraftingMaterialsCondition')}
              disabled={hasConditionType('CraftingMaterialsCondition')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-le-border hover:border-le-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-le-border"
            >
              <Plus size={14} />
              Crafting Materials
            </button>
            <button
              onClick={() => handleAddCondition('ResonancesCondition')}
              disabled={hasConditionType('ResonancesCondition')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-le-border hover:border-le-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-le-border"
            >
              <Plus size={14} />
              Resonances
            </button>
            <button
              onClick={() => handleAddCondition('WovenEchoesCondition')}
              disabled={hasConditionType('WovenEchoesCondition')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-le-border hover:border-le-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-le-border"
            >
              <Plus size={14} />
              Woven Echoes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
