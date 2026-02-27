import { Routes, Route, Navigate } from 'react-router-dom';
import { Header, Tabs } from './components/layout';
import {
  LandingPage,
  OverviewPage,
  CustomizePage,
  SimulatePage,
  ThemesPage,
  AdvancedPage,
} from './pages';

function EditorLayout() {
  return (
    <div className="min-h-screen bg-le-dark flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-le-purple/5 to-transparent rotate-12" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-le-accent/5 to-transparent -rotate-12" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        <Tabs />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="overview" element={<OverviewPage />} />
            <Route path="customize" element={<CustomizePage />} />
            <Route path="simulate" element={<SimulatePage />} />
            <Route path="themes" element={<ThemesPage />} />
            <Route path="advanced" element={<AdvancedPage />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/editor/*" element={<EditorLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
