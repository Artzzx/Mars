import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface GeneratorFooterProps {
  canGoBack:    boolean;
  canGoNext:    boolean;
  isLastStep:   boolean;
  isGenerating: boolean;
  onBack:       () => void;
  onNext:       () => void;
  onGenerate:   () => void;
}

export function GeneratorFooter({
  canGoBack,
  canGoNext,
  isLastStep,
  isGenerating,
  onBack,
  onNext,
  onGenerate,
}: GeneratorFooterProps) {
  return (
    <footer className="sticky bottom-0 z-10 bg-le-darker/90 backdrop-blur border-t border-le-border px-6 py-4">
      <div className="flex items-center justify-between gap-4 max-w-full">
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors',
            canGoBack
              ? 'border-le-border text-gray-300 hover:border-gray-500 hover:text-white'
              : 'border-le-border/40 text-gray-600 cursor-not-allowed',
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {/* Next / Generate */}
        {isLastStep ? (
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className={clsx(
              'flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-colors',
              isGenerating
                ? 'bg-le-accent/50 text-le-dark/70 cursor-not-allowed'
                : 'bg-le-accent text-le-dark hover:bg-le-accent-hover',
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Compiling…
              </>
            ) : (
              <>
                Generate My Filter
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className={clsx(
              'flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-colors',
              canGoNext
                ? 'bg-le-accent text-le-dark hover:bg-le-accent-hover'
                : 'bg-le-accent/30 text-le-dark/50 cursor-not-allowed',
            )}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </footer>
  );
}
