import { AlertTriangle, ArrowUpCircle, X, Eye } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useFilterStore } from '../../store/filterStore';
import { isLegacyFilter, getFilterVersionLabel, upgradeLegacyFilter, FILTER_VERSION, GAME_VERSION } from '../../lib/filters/types';
import { FilterComparison } from './FilterComparison';

export function LegacyFilterNotice() {
  const { filter, setFilter } = useFilterStore();
  const [dismissed, setDismissed] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Memoize the upgraded filter for comparison
  const upgradedFilter = useMemo(() => {
    if (isLegacyFilter(filter)) {
      return upgradeLegacyFilter(filter);
    }
    return filter;
  }, [filter]);

  if (!isLegacyFilter(filter) || dismissed) {
    return null;
  }

  const handleUpgrade = () => {
    setFilter(upgradedFilter);
    setShowComparison(false);
  };

  const handlePreviewUpgrade = () => {
    setShowComparison(true);
  };

  return (
    <>
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-yellow-400">Outdated Filter Format Detected</h3>
              <button
                onClick={() => setDismissed(true)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              This filter uses <span className="text-yellow-400">{getFilterVersionLabel(filter)}</span> format,
              which is incompatible with Last Epoch {GAME_VERSION.CURRENT}+.
              The game now requires <span className="text-green-400">v{FILTER_VERSION.CURRENT}</span> format.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handlePreviewUpgrade}
                className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                <Eye size={16} />
                Preview Changes
              </button>
              <button
                onClick={handleUpgrade}
                className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                <ArrowUpCircle size={16} />
                Upgrade Now
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-yellow-500/20">
          <h4 className="text-xs font-semibold text-gray-400 mb-2">What's new in v{FILTER_VERSION.CURRENT}:</h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Sound notifications for item drops</li>
            <li>• Beam effects for highlighted items</li>
            <li>• Rule ordering controls</li>
            <li>• Character level conditions (replaces rule-level level dependency)</li>
            <li>• Unique item modifiers filtering</li>
            <li>• Min/Max Legendary Potential and Weaver's Will ranges</li>
          </ul>
        </div>
      </div>

      <FilterComparison
        original={filter}
        upgraded={upgradedFilter}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        onApply={handleUpgrade}
      />
    </>
  );
}
