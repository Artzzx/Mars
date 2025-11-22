import { Header, Tabs } from './components/layout';
import { useFilterStore } from './store/filterStore';
import {
  OverviewPage,
  CustomizePage,
  SimulatePage,
  ThemesPage,
  AdvancedPage,
} from './pages';

function App() {
  const { activeTab } = useFilterStore();

  const renderPage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'customize':
        return <CustomizePage />;
      case 'simulate':
        return <SimulatePage />;
      case 'themes':
        return <ThemesPage />;
      case 'advanced':
        return <AdvancedPage />;
      default:
        return <OverviewPage />;
    }
  };

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
        <main className="flex-1 p-6 overflow-auto">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
