import { ChevronLeft, Download } from 'lucide-react';
import { useFilterStore } from '../../store/filterStore';
import { downloadFilter } from '../../lib/xml';

export function Header() {
  const { filter, changeCount, hasUnsavedChanges, markSaved } = useFilterStore();

  const handleExport = () => {
    downloadFilter(filter);
    markSaved();
  };

  return (
    <header className="bg-le-darker border-b border-le-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-le-accent hover:text-le-accent-hover transition-colors">
            <ChevronLeft size={20} />
            <span>Back to My Filters</span>
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-white">
              {filter.name}
            </h1>
            {changeCount > 0 && (
              <span className="text-sm text-gray-400">
                ({changeCount} change{changeCount !== 1 ? 's' : ''})
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="text-xs text-le-gold">• Unsaved</span>
            )}
          </div>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-le-accent text-le-dark font-semibold px-4 py-2 rounded hover:bg-le-accent-hover transition-colors"
        >
          <Download size={18} />
          EXPORT TO LAST EPOCH
        </button>
      </div>
    </header>
  );
}
