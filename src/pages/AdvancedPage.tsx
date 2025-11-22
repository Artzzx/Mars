import { useState } from 'react';
import { useFilterStore } from '../store/filterStore';
import { generateFilterXml, parseFilterXml } from '../lib/xml';

export function AdvancedPage() {
  const { filter, setFilter } = useFilterStore();
  const [xmlContent, setXmlContent] = useState(() => generateFilterXml(filter));
  const [error, setError] = useState<string | null>(null);

  const handleXmlChange = (value: string) => {
    setXmlContent(value);
    setError(null);
  };

  const handleApplyXml = () => {
    try {
      const parsed = parseFilterXml(xmlContent);
      setFilter(parsed);
      setError(null);
      alert('XML applied successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid XML');
    }
  };

  const handleRefresh = () => {
    setXmlContent(generateFilterXml(filter));
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400">RAW XML EDITOR</h2>
          <div className="flex gap-2">
            <button onClick={handleRefresh} className="btn-secondary text-sm">
              Refresh from Filter
            </button>
            <button onClick={handleApplyXml} className="btn-primary text-sm">
              Apply XML
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Edit the raw XML directly. Be careful - invalid XML will cause errors.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <textarea
          value={xmlContent}
          onChange={(e) => handleXmlChange(e.target.value)}
          className="input w-full h-[500px] font-mono text-sm resize-none"
          spellCheck={false}
        />
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">FILTER INFO</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Version:</span>
            <span className="ml-2">{filter.lastModifiedInVersion}</span>
          </div>
          <div>
            <span className="text-gray-500">Filter Version:</span>
            <span className="ml-2">{filter.lootFilterVersion}</span>
          </div>
          <div>
            <span className="text-gray-500">Icon:</span>
            <span className="ml-2">
              {filter.filterIcon} (Color: {filter.filterIconColor})
            </span>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">DANGER ZONE</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Reset Filter</p>
            <p className="text-xs text-gray-500">
              Clear all rules and start fresh. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset the filter? This cannot be undone.')) {
                useFilterStore.getState().resetFilter();
              }
            }}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded border border-red-500/30 hover:bg-red-500/30 transition-colors text-sm"
          >
            Reset Filter
          </button>
        </div>
      </div>
    </div>
  );
}
