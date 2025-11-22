import { useFilterStore, type TabType } from '../../store/filterStore';
import { clsx } from 'clsx';

const TABS: { id: TabType; label: string }[] = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'customize', label: 'CUSTOMIZE' },
  { id: 'simulate', label: 'SIMULATE' },
  { id: 'themes', label: 'THEMES' },
  { id: 'advanced', label: 'ADVANCED' },
];

export function Tabs() {
  const { activeTab, setActiveTab } = useFilterStore();

  return (
    <nav className="bg-le-darker border-b border-le-border">
      <div className="flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'px-6 py-3 font-medium text-sm transition-colors relative',
              activeTab === tab.id
                ? 'text-le-accent'
                : 'text-gray-400 hover:text-white'
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-le-accent" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
