import { useState } from 'react';
import { FILTER_COLORS } from '../lib/filters/types';
import { clsx } from 'clsx';

interface Theme {
  id: string;
  name: string;
  description: string;
  colors: Record<string, number>;
}

const PRESET_THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard color scheme matching the game defaults',
    colors: { unique: 5, set: 2, exalted: 6, legendary: 10 },
  },
  {
    id: 'colorblind',
    name: 'Colorblind Friendly',
    description: 'High contrast colors optimized for color vision deficiency',
    colors: { unique: 4, set: 7, exalted: 9, legendary: 11 },
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Subdued colors that are easy on the eyes',
    colors: { unique: 0, set: 3, exalted: 6, legendary: 8 },
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Bright, vibrant colors that pop',
    colors: { unique: 5, set: 2, exalted: 8, legendary: 7 },
  },
];

export function ThemesPage() {
  const [selectedTheme, setSelectedTheme] = useState('default');

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">COLOR THEMES</h2>
        <p className="text-xs text-gray-500 mb-4">
          Select a preset theme or customize individual colors below.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {PRESET_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              className={clsx(
                'p-4 rounded border text-left transition-colors',
                selectedTheme === theme.id
                  ? 'border-le-accent bg-le-accent/10'
                  : 'border-le-border hover:border-le-accent/50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{theme.name}</span>
                <div className="flex gap-1">
                  {Object.values(theme.colors).map((colorId, i) => {
                    const color = FILTER_COLORS.find((c) => c.id === colorId);
                    return (
                      <div
                        key={i}
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: color?.hex }}
                      />
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-gray-500">{theme.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">COLOR PALETTE</h2>
        <p className="text-xs text-gray-500 mb-4">
          Available colors in Last Epoch filters.
        </p>

        <div className="grid grid-cols-8 gap-2">
          {FILTER_COLORS.map((color) => (
            <div key={color.id} className="text-center">
              <div
                className="w-full aspect-square rounded border border-white/10 mb-1"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-xs text-gray-400">{color.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">PREVIEW</h2>
        <div className="bg-le-darker p-4 rounded">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20">Unique:</span>
              <span
                className="font-medium"
                style={{
                  color: FILTER_COLORS.find(
                    (c) => c.id === PRESET_THEMES.find((t) => t.id === selectedTheme)?.colors.unique
                  )?.hex,
                }}
              >
                Titan's Heart
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20">Set:</span>
              <span
                className="font-medium"
                style={{
                  color: FILTER_COLORS.find(
                    (c) => c.id === PRESET_THEMES.find((t) => t.id === selectedTheme)?.colors.set
                  )?.hex,
                }}
              >
                Wings of Argentus
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20">Exalted:</span>
              <span
                className="font-medium"
                style={{
                  color: FILTER_COLORS.find(
                    (c) => c.id === PRESET_THEMES.find((t) => t.id === selectedTheme)?.colors.exalted
                  )?.hex,
                }}
              >
                Exalted Steel Greaves
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20">Legendary:</span>
              <span
                className="font-medium"
                style={{
                  color: FILTER_COLORS.find(
                    (c) => c.id === PRESET_THEMES.find((t) => t.id === selectedTheme)?.colors.legendary
                  )?.hex,
                }}
              >
                Legendary Bastion of Honour
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
