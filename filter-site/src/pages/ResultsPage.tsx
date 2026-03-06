// ResultsPage — Phase 5 implementation pending.
// Stub keeps App.tsx import valid and /results route functional.
// Full component (ConfidenceHero, StatsRow, DownloadSection, BuildSummaryCard,
// FilterPreviewAccordion) will be built in Phase 5.

import { useNavigate } from 'react-router-dom';
import { useGeneratorStore } from '../store/generatorStore';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { SpecificityGauge } from '../components/common/SpecificityGauge';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { Header } from '../components/layout/Header';
import { useDownload } from '../hooks/useDownload';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export function ResultsPage() {
  const navigate      = useNavigate();
  const compileResult = useGeneratorStore((s) => s.compileResult)!;
  const { downloadFilter } = useDownload();

  const selectedMastery     = useGeneratorStore((s) => s.selectedMastery);
  const selectedDamageTypes = useGeneratorStore((s) => s.selectedDamageTypes);
  const selectedProgress    = useGeneratorStore((s) => s.selectedProgress);

  const filename = [
    selectedMastery ?? 'filter',
    ...selectedDamageTypes,
    selectedProgress ?? '',
  ]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/\s+/g, '-');

  return (
    <div className="min-h-screen bg-le-dark flex flex-col">
      <Header />

      <ErrorBoundary>
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8">
        {/* Confidence banner */}
        <div
          className={`rounded-xl p-6 flex items-center justify-between gap-6 ${
            compileResult.confidence === 'high'
              ? 'hero-high'
              : compileResult.confidence === 'medium'
              ? 'hero-medium'
              : 'hero-low'
          }`}
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ConfidenceBadge confidence={compileResult.confidence} size="md" />
            </div>
            <h1 className="text-xl font-bold text-white">
              {compileResult.confidence === 'high'
                ? 'Excellent match — your filter is build-specific.'
                : compileResult.confidence === 'medium'
                ? 'Good match — class-level data applied.'
                : 'Generic filter applied.'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {compileResult.confidence === 'high'
                ? `We found ${compileResult.matchedBuilds.length} community-validated build(s). Specificity: ${(compileResult.specificityScore * 100).toFixed(0)}%`
                : compileResult.confidence === 'medium'
                ? 'We matched your class and damage type but have limited mastery-specific data. The filter is still valid.'
                : "We didn't find build-specific data for this combination. A general class filter was used."}
            </p>
          </div>
          <div className="flex-shrink-0 w-48">
            <SpecificityGauge score={compileResult.specificityScore} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Rules Generated', value: compileResult.rulesGenerated, sub: 'out of 75 budget', color: 'text-le-accent' },
            {
              label: 'Affixes Dropped',
              value: compileResult.affixesDropped,
              sub: 'low-priority affixes cut',
              color: compileResult.affixesDropped > 0 ? 'text-le-gold' : 'text-le-green',
            },
            { label: 'Data Sources', value: compileResult.matchedBuilds.length, sub: 'builds matched', color: 'text-le-accent' },
            {
              label: 'Specificity',
              value: `${(compileResult.specificityScore * 100).toFixed(0)}%`,
              sub: 'profile match quality',
              color:
                compileResult.specificityScore >= 0.7
                  ? 'text-le-green'
                  : compileResult.specificityScore >= 0.4
                  ? 'text-le-gold'
                  : 'text-le-red',
            },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
              <div className="text-xs font-semibold text-gray-300 mt-1">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Download + actions */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 card p-6 space-y-4">
            <h2 className="font-semibold text-white">Download Your Filter</h2>
            <button
              type="button"
              onClick={() => downloadFilter(compileResult.xml, filename)}
              className="w-full py-3 rounded-xl bg-le-accent text-le-dark font-bold hover:bg-le-accent-hover transition-colors"
            >
              Download .filter file
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(compileResult.xml)}
                className="flex-1 py-2 rounded-lg border border-le-border text-sm text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
              >
                Copy XML
              </button>
              <button
                type="button"
                onClick={() => navigate('/editor/customize')}
                className="flex-1 py-2 rounded-lg border border-le-border text-sm text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
              >
                Open in Editor
              </button>
              <button
                type="button"
                onClick={() => navigate('/generate')}
                className="flex-1 py-2 rounded-lg border border-le-border text-sm text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
              >
                Regenerate
              </button>
            </div>

            {/* Installation instructions */}
            <details className="text-sm text-gray-400">
              <summary className="cursor-pointer select-none hover:text-gray-300">
                Installation instructions
              </summary>
              <div className="mt-3 space-y-2 font-mono text-xs bg-le-darker rounded-lg p-3">
                <p className="text-gray-500">Place your filter file here:</p>
                <p><span className="text-gray-400">Windows:</span>  %APPDATA%\Last Epoch\Filters\</p>
                <p><span className="text-gray-400">macOS:</span>    ~/Library/Application Support/Last Epoch/Filters/</p>
                <p><span className="text-gray-400">Linux:</span>    ~/.config/unity3d/Eleventh Hour Games/Last Epoch/Filters/</p>
                <p className="text-gray-500 mt-2 font-sans">Then in Last Epoch: Options → Gameplay → Loot Filter → Reload Filters</p>
              </div>
            </details>
          </div>

          {/* Build summary */}
          <div className="lg:col-span-2 card p-6 space-y-3">
            <h2 className="font-semibold text-white text-sm">Build Summary</h2>
            {[
              { label: 'Mastery',   value: selectedMastery    ? capitalize(selectedMastery)    : '—' },
              { label: 'Damage',    value: selectedDamageTypes.map(capitalize).join(', ') || '—' },
              { label: 'Progress',  value: selectedProgress   ? capitalize(selectedProgress)   : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm border-b border-le-border pb-2 last:border-0">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-300 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      </ErrorBoundary>
    </div>
  );
}
