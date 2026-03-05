import type { ReactNode } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Header, EditorTabs } from './components/layout';
import { ToastProvider } from './components/common/ToastProvider';
import {
  LandingPage,
  OverviewPage,
  CustomizePage,
  SimulatePage,
  ThemesPage,
  AdvancedPage,
  GeneratorPage,
  ResultsPage,
} from './pages';
import { useGeneratorStore } from './store/generatorStore';

// ── Route guard — /results requires a CompileResult in the store ──────────────

function RequireResult({ children }: { children: ReactNode }) {
  const result = useGeneratorStore((s) => s.compileResult);
  return result ? <>{children}</> : <Navigate to="/generate" replace />;
}

// ── Editor layout ─────────────────────────────────────────────────────────────

function EditorLayout() {
  const navigate  = useNavigate();
  const hasResult = useGeneratorStore((s) => s.compileResult !== null);

  return (
    <div className="min-h-screen bg-le-dark flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-le-purple/5 to-transparent rotate-12" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-le-accent/5 to-transparent -rotate-12" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Header />

        {/* Context banner — only when opened from a generated result */}
        {hasResult && (
          <div className="bg-le-card border-b border-le-border px-6 py-2 flex items-center gap-3">
            <span className="text-xs text-gray-400">Advanced Editor</span>
            <span className="text-xs text-le-border">·</span>
            <button
              type="button"
              onClick={() => navigate('/results')}
              className="text-xs text-le-accent hover:underline"
            >
              ← Back to results
            </button>
          </div>
        )}

        <EditorTabs />

        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route index           element={<Navigate to="overview" replace />} />
            <Route path="overview"  element={<OverviewPage />} />
            <Route path="customize" element={<CustomizePage />} />
            <Route path="themes"    element={<ThemesPage />} />
            <Route path="advanced"  element={<AdvancedPage />} />
            {/* SIMULATE deferred */}
            <Route path="simulate"  element={<SimulatePage />} />
            <Route path="*"         element={<Navigate to="overview" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  return (
    <>
      <ToastProvider />
      <Routes>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/generate" element={<GeneratorPage />} />
        <Route
          path="/results"
          element={
            <RequireResult>
              <ResultsPage />
            </RequireResult>
          }
        />
        <Route path="/editor/*" element={<EditorLayout />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
