import { useState, useEffect } from 'react';
import { Share2, Check, AlertCircle } from 'lucide-react';
import { TemplateSelector, StrictnessSlider } from '../components/templates';
import { QuickActions, ImportExport, LegacyFilterNotice, FilterValidation } from '../components/common';
import { useFilterStore } from '../store/filterStore';
import { getFilterVersionLabel } from '../lib/filters/types';
import { createShareUrl, loadFilterFromHash } from '../lib/sharing';

export function OverviewPage() {
  const { filter, setFilter, updateFilterMetadata } = useFilterStore();
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'too-large'>('idle');

  // Load shared filter from URL hash on mount
  useEffect(() => {
    const shared = loadFilterFromHash();
    if (shared) {
      setFilter(shared);
      // Clean the hash from the URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = async () => {
    const url = createShareUrl(filter);
    if (!url) {
      setShareStatus('too-large');
      setTimeout(() => setShareStatus('idle'), 3000);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Legacy Filter Warning */}
      <LegacyFilterNotice />

      {/* Filter Metadata */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400">FILTER DETAILS</h2>
          <button
            onClick={handleShare}
            className={
              shareStatus === 'copied'
                ? 'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30'
                : shareStatus === 'too-large'
                  ? 'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-le-accent/10 text-le-accent border border-le-accent/30 hover:bg-le-accent/20 transition-colors'
            }
          >
            {shareStatus === 'copied' ? (
              <><Check size={14} /> Copied!</>
            ) : shareStatus === 'too-large' ? (
              <><AlertCircle size={14} /> Filter too large to share</>
            ) : (
              <><Share2 size={14} /> Share Filter</>
            )}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Filter Name</label>
            <input
              type="text"
              value={filter.name}
              onChange={(e) => updateFilterMetadata({ name: e.target.value })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input
              type="text"
              value={filter.description}
              onChange={(e) => updateFilterMetadata({ description: e.target.value })}
              className="input w-full"
              placeholder="Optional description..."
            />
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">SELECT BASE TEMPLATE</h2>
        <TemplateSelector />
      </div>

      {/* Strictness Slider */}
      <StrictnessSlider />

      {/* Quick Actions */}
      <QuickActions />

      {/* Import/Export */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">Import & Export</h3>
            <p className="text-xs text-gray-500 mt-1">
              Import existing filters or export your current configuration
            </p>
          </div>
          <ImportExport />
        </div>
      </div>

      {/* Stats and Validation */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">FILTER STATISTICS</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-le-accent">{filter.rules.length}</div>
              <div className="text-xs text-gray-500">Total Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {filter.rules.filter((r) => r.type === 'SHOW').length}
              </div>
              <div className="text-xs text-gray-500">Show Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {filter.rules.filter((r) => r.type === 'HIDE').length}
              </div>
              <div className="text-xs text-gray-500">Hide Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {filter.rules.filter((r) => r.type === 'HIGHLIGHT').length}
              </div>
              <div className="text-xs text-gray-500">Highlight Rules</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-le-border text-center">
            <div className="text-sm font-bold text-gray-300">{getFilterVersionLabel(filter)}</div>
            <div className="text-xs text-gray-500">Format Version</div>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">FILTER VALIDATION</h2>
          <FilterValidation filter={filter} />
        </div>
      </div>
    </div>
  );
}
