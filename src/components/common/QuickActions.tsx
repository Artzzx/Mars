import { Palette, Puzzle, Wand2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ModulesModal } from './ModulesModal';
import { GlobalStyleModal } from './GlobalStyleModal';
import { BuildAnalysisModal } from './BuildAnalysisModal';
import { useBackendAvailable } from '@/hooks/useBackendApi';

export function QuickActions() {
  const [showModules, setShowModules] = useState(false);
  const [showGlobalStyle, setShowGlobalStyle] = useState(false);
  const [showBuildAnalysis, setShowBuildAnalysis] = useState(false);
  const { available, checking } = useBackendAvailable();

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => setShowGlobalStyle(true)}
          className="flex-1 card p-4 hover:border-le-accent/50 transition-colors group"
        >
          <div className="flex items-center justify-center gap-2">
            <Palette size={20} className="text-gray-400 group-hover:text-le-accent" />
            <span className="font-medium">GLOBAL FILTER STYLE</span>
          </div>
        </button>

        <button
          onClick={() => setShowModules(true)}
          className="flex-1 card p-4 hover:border-le-accent/50 transition-colors group"
        >
          <div className="flex items-center justify-center gap-2">
            <Puzzle size={20} className="text-gray-400 group-hover:text-le-accent" />
            <span className="font-medium">MODULES</span>
          </div>
        </button>

        <button
          onClick={() => setShowBuildAnalysis(true)}
          disabled={checking}
          className="flex-1 card p-4 hover:border-le-accent/50 transition-colors group bg-le-purple/10 border-le-purple/30 disabled:opacity-50"
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2">
              {checking ? (
                <Loader2 size={20} className="text-le-purple animate-spin" />
              ) : (
                <Wand2 size={20} className="text-le-purple" />
              )}
              <span className="font-medium">AUTO-ADJUST FOR BUILD</span>
            </div>
            <span className="text-xs text-le-gold">
              {checking ? 'Checking...' : available ? '(AI-POWERED)' : '(LOCAL)'}
            </span>
          </div>
        </button>
      </div>

      <ModulesModal isOpen={showModules} onClose={() => setShowModules(false)} />
      <GlobalStyleModal isOpen={showGlobalStyle} onClose={() => setShowGlobalStyle(false)} />
      <BuildAnalysisModal isOpen={showBuildAnalysis} onClose={() => setShowBuildAnalysis(false)} />
    </>
  );
}
