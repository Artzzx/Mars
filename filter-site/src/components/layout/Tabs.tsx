import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

const TABS = [
  { path: '/editor/overview', label: 'OVERVIEW' },
  { path: '/editor/customize', label: 'CUSTOMIZE' },
  { path: '/editor/simulate', label: 'SIMULATE' },
  { path: '/editor/themes', label: 'THEMES' },
  { path: '/editor/advanced', label: 'ADVANCED' },
];

export function Tabs() {
  return (
    <nav className="bg-le-darker border-b border-le-border">
      <div className="flex">
        {TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              clsx(
                'px-6 py-3 font-medium text-sm transition-colors relative',
                isActive
                  ? 'text-le-accent'
                  : 'text-gray-400 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-le-accent" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
