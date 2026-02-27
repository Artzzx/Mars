import { useState, useMemo } from 'react';
import { useFilterStore } from '../store/filterStore';
import type { EquipmentType, Rarity } from '../lib/filters/types';
import { FILTER_COLORS, EQUIPMENT_TYPE_NAMES } from '../lib/filters/types';
import { useAffixDatabase } from '../hooks/useAffixDatabase';
import { clsx } from 'clsx';

const RARITIES: { value: Rarity; label: string; color: string }[] = [
  { value: 'NORMAL', label: 'Normal', color: 'text-gray-400' },
  { value: 'MAGIC', label: 'Magic', color: 'text-blue-400' },
  { value: 'RARE', label: 'Rare', color: 'text-yellow-400' },
  { value: 'EXALTED', label: 'Exalted', color: 'text-purple-400' },
  { value: 'UNIQUE', label: 'Unique', color: 'text-orange-400' },
  { value: 'SET', label: 'Set', color: 'text-green-400' },
  { value: 'LEGENDARY', label: 'Legendary', color: 'text-red-400' },
];

const EQUIPMENT_TYPES = Object.entries(EQUIPMENT_TYPE_NAMES) as [EquipmentType, string][];

// Sample items for simulation
const SAMPLE_ITEMS = [
  { name: 'Iron Sword', rarity: 'NORMAL' as Rarity, type: 'ONE_HANDED_SWORD' as EquipmentType, level: 10 },
  { name: 'Enchanted Helm', rarity: 'MAGIC' as Rarity, type: 'HELMET' as EquipmentType, level: 25 },
  { name: 'Rare Boots of Speed', rarity: 'RARE' as Rarity, type: 'BOOTS' as EquipmentType, level: 45 },
  { name: 'Exalted Ring', rarity: 'EXALTED' as Rarity, type: 'RING' as EquipmentType, level: 70 },
  { name: "Titan's Heart", rarity: 'UNIQUE' as Rarity, type: 'BODY_ARMOR' as EquipmentType, level: 80 },
  { name: 'Adorned Idol', rarity: 'NORMAL' as Rarity, type: 'IDOL_2x2' as EquipmentType, level: 50 },
  { name: 'Set Gloves', rarity: 'SET' as Rarity, type: 'GLOVES' as EquipmentType, level: 65 },
  { name: 'Legendary Staff', rarity: 'LEGENDARY' as Rarity, type: 'TWO_HANDED_STAFF' as EquipmentType, level: 90 },
];

interface SimItem {
  name: string;
  rarity: Rarity;
  type: EquipmentType;
  level: number;
  affixIds?: number[];
}

export function SimulatePage() {
  const { filter } = useFilterStore();
  const { search, getAffixesByIds } = useAffixDatabase();
  const [playerLevel, setPlayerLevel] = useState(80);

  // Custom item builder state
  const [customRarity, setCustomRarity] = useState<Rarity>('RARE');
  const [customType, setCustomType] = useState<EquipmentType>('HELMET');
  const [customLevel, setCustomLevel] = useState(75);
  const [customAffixIds, setCustomAffixIds] = useState<number[]>([]);
  const [affixQuery, setAffixQuery] = useState('');
  const [showCustomResult, setShowCustomResult] = useState(false);

  const affixResults = useMemo(() => {
    if (!affixQuery.trim()) return [];
    return search(affixQuery).slice(0, 10);
  }, [affixQuery, search]);

  const selectedAffixes = useMemo(
    () => getAffixesByIds(customAffixIds),
    [customAffixIds, getAffixesByIds]
  );

  const simulateItem = (item: SimItem) => {
    for (const rule of filter.rules) {
      if (!rule.isEnabled) continue;

      let matches = true;
      for (const condition of rule.conditions) {
        if (condition.type === 'RarityCondition') {
          if (!condition.rarity.includes(item.rarity)) {
            matches = false;
            break;
          }
        }
        if (condition.type === 'SubTypeCondition') {
          if (!condition.equipmentTypes.includes(item.type)) {
            matches = false;
            break;
          }
        }
        if (condition.type === 'CharacterLevelCondition') {
          if (playerLevel < condition.minimumLvl ||
              (condition.maximumLvl > 0 && playerLevel > condition.maximumLvl)) {
            matches = false;
            break;
          }
        }
        if (condition.type === 'AffixCondition' && item.affixIds) {
          const matchCount = condition.affixes.filter((a) => item.affixIds!.includes(a)).length;
          if (condition.comparison === 'ANY' && matchCount === 0) {
            matches = false;
            break;
          }
          if (condition.comparison === 'MORE_OR_EQUAL' && matchCount < condition.comparisonValue) {
            matches = false;
            break;
          }
          if (condition.comparison === 'EQUAL' && matchCount !== condition.comparisonValue) {
            matches = false;
            break;
          }
        }
      }

      // Legacy v2 format: level dependency at rule level
      if (rule.levelDependent && rule.minLvl !== undefined && rule.maxLvl !== undefined) {
        if (playerLevel < rule.minLvl || (rule.maxLvl > 0 && playerLevel > rule.maxLvl)) {
          matches = false;
        }
      }

      if (matches && rule.conditions.length > 0) {
        return {
          action: rule.type,
          color: rule.color,
          emphasized: rule.emphasized,
          nameOverride: rule.nameOverride,
          ruleName: rule.nameOverride || `Rule #${filter.rules.indexOf(rule) + 1}`,
        };
      }
    }

    return { action: 'SHOW' as const, color: 0, emphasized: false, nameOverride: '', ruleName: 'No match (default show)' };
  };

  const customItem: SimItem = {
    name: `Custom ${EQUIPMENT_TYPE_NAMES[customType]}`,
    rarity: customRarity,
    type: customType,
    level: customLevel,
    affixIds: customAffixIds,
  };

  const customResult = showCustomResult ? simulateItem(customItem) : null;

  const handleAddAffix = (affixId: number) => {
    if (!customAffixIds.includes(affixId)) {
      setCustomAffixIds([...customAffixIds, affixId]);
    }
    setAffixQuery('');
  };

  const handleRemoveAffix = (affixId: number) => {
    setCustomAffixIds(customAffixIds.filter((id) => id !== affixId));
  };

  const renderItemResult = (item: SimItem, result: ReturnType<typeof simulateItem>, index: number) => {
    const colorInfo = FILTER_COLORS.find((c) => c.id === result.color);
    return (
      <div
        key={index}
        className={clsx(
          'p-3 rounded border transition-all',
          result.action === 'HIDE'
            ? 'opacity-30 border-red-500/30 bg-red-500/5'
            : result.color !== 0
              ? 'border-le-accent/50 bg-le-card'
              : 'border-le-border bg-le-card'
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <div
              className={clsx(
                'font-medium',
                result.emphasized && 'text-lg'
              )}
              style={
                result.color !== 0 ? { color: colorInfo?.hex } : undefined
              }
            >
              {result.nameOverride || item.name}
            </div>
            <div className="text-xs text-gray-500">
              {item.rarity} &bull; {EQUIPMENT_TYPE_NAMES[item.type]} &bull; Lvl {item.level}
              {item.affixIds && item.affixIds.length > 0 && ` \u2022 ${item.affixIds.length} affix(es)`}
            </div>
          </div>
          <div
            className={clsx(
              'px-2 py-1 rounded text-xs font-semibold',
              result.action === 'SHOW' && 'bg-green-500/20 text-green-400',
              result.action === 'HIDE' && 'bg-red-500/20 text-red-400'
            )}
          >
            {result.action}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">SIMULATION SETTINGS</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-300">Player Level:</label>
          <input
            type="number"
            min={1}
            max={100}
            value={playerLevel}
            onChange={(e) => setPlayerLevel(Number(e.target.value))}
            className="input w-20"
          />
          <input
            type="range"
            min={1}
            max={100}
            value={playerLevel}
            onChange={(e) => setPlayerLevel(Number(e.target.value))}
            className="flex-1"
          />
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">SIMULATED DROPS</h2>
        <p className="text-xs text-gray-500 mb-4">
          See how your filter would handle these sample items.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {SAMPLE_ITEMS.map((item, index) => {
            const result = simulateItem(item);
            return renderItemResult(item, result, index);
          })}
        </div>
      </div>

      {/* Custom Item Tester */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">TEST CUSTOM ITEM</h2>
        <p className="text-xs text-gray-500 mb-4">
          Configure a custom item and test how your filter handles it.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Rarity */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rarity</label>
            <select
              value={customRarity}
              onChange={(e) => { setCustomRarity(e.target.value as Rarity); setShowCustomResult(false); }}
              className="input w-full"
            >
              {RARITIES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Equipment Type */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Equipment Type</label>
            <select
              value={customType}
              onChange={(e) => { setCustomType(e.target.value as EquipmentType); setShowCustomResult(false); }}
              className="input w-full"
            >
              {EQUIPMENT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Item Level */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Item Level</label>
            <input
              type="number"
              min={1}
              max={100}
              value={customLevel}
              onChange={(e) => { setCustomLevel(Number(e.target.value)); setShowCustomResult(false); }}
              className="input w-full"
            />
          </div>
        </div>

        {/* Affix Selection */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Affixes (optional)</label>
          <div className="relative">
            <input
              type="text"
              value={affixQuery}
              onChange={(e) => setAffixQuery(e.target.value)}
              placeholder="Search affixes by name or ID..."
              className="input w-full"
            />
            {affixResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-le-card border border-le-border rounded-lg max-h-48 overflow-y-auto shadow-lg">
                {affixResults.map((affix) => (
                  <button
                    key={affix.affixId}
                    onClick={() => handleAddAffix(affix.affixId)}
                    className={clsx(
                      'w-full px-3 py-2 text-left text-sm hover:bg-le-border/50 flex justify-between items-center',
                      customAffixIds.includes(affix.affixId) && 'opacity-50'
                    )}
                    disabled={customAffixIds.includes(affix.affixId)}
                  >
                    <span>{affix.name || `Affix #${affix.affixId}`}</span>
                    <span className="text-xs text-gray-500">#{affix.affixId}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected affixes */}
          {selectedAffixes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedAffixes.map((affix) => (
                <span
                  key={affix.affixId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-le-accent/10 border border-le-accent/30 rounded text-xs"
                >
                  {affix.name || `#${affix.affixId}`}
                  <button
                    onClick={() => handleRemoveAffix(affix.affixId)}
                    className="text-gray-400 hover:text-red-400 ml-1"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Test Button */}
        <button
          onClick={() => setShowCustomResult(true)}
          className="btn-primary"
        >
          Test Item
        </button>

        {/* Custom Result */}
        {customResult && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">RESULT</div>
            {renderItemResult(customItem, customResult, -1)}
            <div className="mt-2 text-xs text-gray-500">
              Matched: <span className="text-gray-300">{customResult.ruleName}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
