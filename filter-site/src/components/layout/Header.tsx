import { useEffect } from 'react';
import { ChevronLeft, Download, Filter, Undo2, Redo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../../store/filterStore';
import { downloadFilter } from '../../lib/xml';

export function Header() {
  const navigate = useNavigate();
  const { filter, changeCount, hasUnsavedChanges, markSaved } = useFilterStore();
  const { undo, redo, pastStates, futureStates } = useFilterStore.temporal.getState();

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const handleExport = () => {
    downloadFilter(filter);
    markSaved();
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <header className="bg-le-darker border-b border-le-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-le-accent hover:text-le-accent-hover transition-colors"
          >
            <ChevronLeft size={20} />
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <span>Filter Tool</span>
            </div>
          </button>

          <div className="w-px h-6 bg-le-border" />

          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-white">
              {filter.name}
            </h1>
            {changeCount > 0 && (
              <span className="text-sm text-gray-400">
                ({changeCount} change{changeCount !== 1 ? 's' : ''})
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="text-xs text-le-gold">&bull; Unsaved</span>
            )}
          </div>

          <div className="w-px h-6 bg-le-border" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => undo()}
              disabled={!canUndo}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-le-border/50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={() => redo()}
              disabled={!canRedo}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-le-border/50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 size={16} />
            </button>
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
