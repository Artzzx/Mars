import { TemplateSelector, StrictnessSlider } from '../components/templates';
import { QuickActions, ImportExport, LegacyFilterNotice } from '../components/common';
import { useFilterStore } from '../store/filterStore';
import { getFilterVersionLabel } from '../lib/filters/types';

export function OverviewPage() {
  const { filter, updateFilterMetadata } = useFilterStore();

  return (
    <div className="space-y-6">
      {/* Legacy Filter Warning */}
      <LegacyFilterNotice />

      {/* Filter Metadata */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">FILTER DETAILS</h2>
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

      {/* Stats */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">FILTER STATISTICS</h2>
        <div className="grid grid-cols-5 gap-4">
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
          <div className="text-center">
            <div className="text-lg font-bold text-gray-300">{getFilterVersionLabel(filter)}</div>
            <div className="text-xs text-gray-500">Format Version</div>
          </div>
        </div>
      </div>
    </div>
  );
}
