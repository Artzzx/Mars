import { useState, useMemo } from 'react';
import { Search, X, Plus, Check, Filter } from 'lucide-react';
import { useAffixDatabase } from '../../hooks/useAffixDatabase';
import {
  AFFIX_TYPE,
  DISPLAY_CATEGORIES,
  getClassFromSpecificity,
  CLASS_SPECIFICITY,
} from '../../lib/filters/affixTypes';
import { clsx } from 'clsx';

interface AffixSearchProps {
  selectedAffixIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onClose?: () => void;
}

export function AffixSearch({ selectedAffixIds, onSelectionChange, onClose }: AffixSearchProps) {
  const { affixes, loading, error, search, getAffixesByIds } = useAffixDatabase();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<number | undefined>(undefined);
  const [classFilter, setClassFilter] = useState<number>(0);

  const results = useMemo(() => {
    if (!query.trim() && !typeFilter && !classFilter) {
      // Show selected affixes first when no search
      return [];
    }
    return search(query, {
      type: typeFilter,
      classSpecificity: classFilter || undefined,
    }).slice(0, 100); // Limit results for performance
  }, [query, typeFilter, classFilter, search]);

  const selectedAffixes = useMemo(() => {
    return getAffixesByIds(selectedAffixIds);
  }, [selectedAffixIds, getAffixesByIds]);

  const toggleAffix = (affixId: number) => {
    if (selectedAffixIds.includes(affixId)) {
      onSelectionChange(selectedAffixIds.filter((id) => id !== affixId));
    } else {
      onSelectionChange([...selectedAffixIds, affixId]);
    }
  };

  const removeAffix = (affixId: number) => {
    onSelectionChange(selectedAffixIds.filter((id) => id !== affixId));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="animate-pulse">Loading affix database...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-400">
        <p>Failed to load affix database</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-le-border">
        <h3 className="font-medium text-sm">Affix Database ({affixes.length} affixes)</h3>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-le-border rounded">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-le-border space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID, or stat..."
            className="input w-full pl-9 pr-9 text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors',
              showFilters
                ? 'border-le-accent bg-le-accent/10 text-le-accent'
                : 'border-le-border hover:border-le-accent/50'
            )}
          >
            <Filter size={12} />
            Filters
          </button>

          {selectedAffixIds.length > 0 && (
            <span className="text-xs text-gray-400">
              {selectedAffixIds.length} selected
            </span>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-2">
            <select
              value={typeFilter ?? ''}
              onChange={(e) => setTypeFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="input text-xs py-1"
            >
              <option value="">All Types</option>
              <option value="0">Prefix</option>
              <option value="1">Suffix</option>
            </select>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(Number(e.target.value))}
              className="input text-xs py-1"
            >
              <option value="0">All Classes</option>
              <option value={CLASS_SPECIFICITY.SENTINEL}>Sentinel</option>
              <option value={CLASS_SPECIFICITY.MAGE}>Mage</option>
              <option value={CLASS_SPECIFICITY.ACOLYTE}>Acolyte</option>
              <option value={CLASS_SPECIFICITY.PRIMALIST}>Primalist</option>
              <option value={CLASS_SPECIFICITY.ROGUE}>Rogue</option>
            </select>
          </div>
        )}
      </div>

      {/* Selected Affixes */}
      {selectedAffixes.length > 0 && (
        <div className="p-3 border-b border-le-border bg-le-accent/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-le-accent">Selected Affixes</span>
            <button
              onClick={clearAll}
              className="text-xs text-gray-400 hover:text-red-400"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {selectedAffixes.map((affix) => (
              <div
                key={affix.affixId}
                className="flex items-center gap-1 px-2 py-0.5 bg-le-accent/20 rounded text-xs"
              >
                <span className="text-gray-400">#{affix.affixId}</span>
                <span className="max-w-32 truncate">{affix.name}</span>
                <button
                  onClick={() => removeAffix(affix.affixId)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!query.trim() && !typeFilter && !classFilter ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Start typing to search affixes
          </div>
        ) : results.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No affixes found matching "{query}"
          </div>
        ) : (
          <div className="divide-y divide-le-border">
            {results.map((affix) => {
              const isSelected = selectedAffixIds.includes(affix.affixId);
              const classes = getClassFromSpecificity(affix.classSpecificity);
              const category = DISPLAY_CATEGORIES[affix.displayCategory] || 'Other';

              return (
                <button
                  key={affix.affixId}
                  onClick={() => toggleAffix(affix.affixId)}
                  className={clsx(
                    'w-full p-3 text-left hover:bg-le-card transition-colors',
                    isSelected && 'bg-le-accent/10'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">#{affix.affixId}</span>
                        <span
                          className={clsx(
                            'text-xs px-1.5 py-0.5 rounded',
                            affix.type === 0
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-green-500/20 text-green-400'
                          )}
                        >
                          {AFFIX_TYPE[affix.type as keyof typeof AFFIX_TYPE]}
                        </span>
                        <span className="text-xs text-gray-500">{category}</span>
                      </div>
                      <div className="font-medium text-sm mb-1">{affix.name}</div>
                      {affix.tiers.length > 0 && (
                        <div className="text-xs text-gray-400">
                          {affix.tiers[affix.tiers.length - 1].text_raw}
                          <span className="text-gray-600 ml-2">
                            (T1-T{affix.tiers.length})
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {affix.levelRequirement > 0 && (
                          <span className="text-xs text-gray-500">
                            Lvl {affix.levelRequirement}+
                          </span>
                        )}
                        {classes[0] !== 'All Classes' && (
                          <span className="text-xs text-le-purple">
                            {classes.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={clsx(
                        'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0',
                        isSelected
                          ? 'bg-le-accent border-le-accent text-le-dark'
                          : 'border-gray-500'
                      )}
                    >
                      {isSelected ? <Check size={12} /> : <Plus size={12} className="text-gray-500" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {results.length === 100 && (
        <div className="p-2 text-center text-xs text-gray-500 border-t border-le-border">
          Showing first 100 results. Refine your search for more specific results.
        </div>
      )}
    </div>
  );
}
