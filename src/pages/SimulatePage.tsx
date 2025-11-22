import { useState } from 'react';
import { useFilterStore } from '../store/filterStore';
import { FILTER_COLORS } from '../lib/filters/types';
import { clsx } from 'clsx';

// Sample items for simulation
const SAMPLE_ITEMS = [
  { name: 'Iron Sword', rarity: 'NORMAL', type: 'ONE_HANDED_SWORD', level: 10 },
  { name: 'Enchanted Helm', rarity: 'MAGIC', type: 'HELMET', level: 25 },
  { name: 'Rare Boots of Speed', rarity: 'RARE', type: 'BOOTS', level: 45 },
  { name: 'Exalted Ring', rarity: 'EXALTED', type: 'RING', level: 70 },
  { name: "Titan's Heart", rarity: 'UNIQUE', type: 'BODY_ARMOR', level: 80 },
  { name: 'Adorned Idol', rarity: 'NORMAL', type: 'IDOL_2x2', level: 50 },
  { name: 'Set Gloves', rarity: 'SET', type: 'GLOVES', level: 65 },
  { name: 'Legendary Staff', rarity: 'LEGENDARY', type: 'TWO_HANDED_STAFF', level: 90 },
];

export function SimulatePage() {
  const { filter } = useFilterStore();
  const [playerLevel, setPlayerLevel] = useState(80);

  const simulateItem = (item: (typeof SAMPLE_ITEMS)[0]) => {
    for (const rule of filter.rules) {
      if (!rule.isEnabled) continue;

      // Check level dependency
      if (rule.levelDependent) {
        if (playerLevel < rule.minLvl || (rule.maxLvl > 0 && playerLevel > rule.maxLvl)) {
          continue;
        }
      }

      // Check conditions (simplified)
      let matches = true;
      for (const condition of rule.conditions) {
        if (condition.type === 'RarityCondition') {
          if (!condition.rarity.includes(item.rarity as never)) {
            matches = false;
            break;
          }
        }
        if (condition.type === 'SubTypeCondition') {
          if (!condition.equipmentTypes.includes(item.type as never)) {
            matches = false;
            break;
          }
        }
      }

      if (matches && rule.conditions.length > 0) {
        return {
          action: rule.type,
          color: rule.color,
          emphasized: rule.emphasized,
          nameOverride: rule.nameOverride,
        };
      }
    }

    return { action: 'SHOW' as const, color: 0, emphasized: false, nameOverride: '' };
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
            const colorInfo = FILTER_COLORS.find((c) => c.id === result.color);

            return (
              <div
                key={index}
                className={clsx(
                  'p-3 rounded border transition-all',
                  result.action === 'HIDE'
                    ? 'opacity-30 border-red-500/30 bg-red-500/5'
                    : result.action === 'HIGHLIGHT'
                      ? 'border-le-accent/50 bg-le-card'
                      : 'border-le-border bg-le-card'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className={clsx(
                        'font-medium',
                        result.emphasized && 'text-lg',
                        result.action === 'HIGHLIGHT' && `filter-color-${result.color}`
                      )}
                      style={
                        result.action === 'HIGHLIGHT'
                          ? { color: colorInfo?.hex }
                          : undefined
                      }
                    >
                      {result.nameOverride || item.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.rarity} • {item.type} • Lvl {item.level}
                    </div>
                  </div>
                  <div
                    className={clsx(
                      'px-2 py-1 rounded text-xs font-semibold',
                      result.action === 'SHOW' && 'bg-gray-500/20 text-gray-400',
                      result.action === 'HIDE' && 'bg-red-500/20 text-red-400',
                      result.action === 'HIGHLIGHT' && 'bg-yellow-500/20 text-yellow-400'
                    )}
                  >
                    {result.action}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">TEST CUSTOM ITEM</h2>
        <p className="text-xs text-gray-500 mb-4">
          Coming soon: Test your filter with custom item configurations.
        </p>
      </div>
    </div>
  );
}
