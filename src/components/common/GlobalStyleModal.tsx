import { X } from 'lucide-react';
import { useState } from 'react';
import { FILTER_COLORS } from '../../lib/filters/types';
import { clsx } from 'clsx';

interface GlobalStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ColorMapping {
  id: string;
  label: string;
  colorId: number;
}

export function GlobalStyleModal({ isOpen, onClose }: GlobalStyleModalProps) {
  const [colorMappings, setColorMappings] = useState<ColorMapping[]>([
    { id: 'unique', label: 'Unique Items', colorId: 5 },
    { id: 'set', label: 'Set Items', colorId: 2 },
    { id: 'exalted', label: 'Exalted Items', colorId: 6 },
    { id: 'legendary', label: 'Legendary Items', colorId: 10 },
    { id: 'valuable', label: 'Valuable Crafting', colorId: 7 },
    { id: 'idols', label: 'Good Idols', colorId: 4 },
  ]);

  const updateColorMapping = (id: string, colorId: number) => {
    setColorMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, colorId } : m))
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-le-dark border border-le-border rounded-lg w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-le-border">
          <h2 className="text-lg font-semibold">Global Filter Style</h2>
          <button onClick={onClose} className="p-1 hover:bg-le-border rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-400 mb-4">
            Customize the highlight colors for different item categories across all rules.
          </p>

          <div className="space-y-4">
            {colorMappings.map((mapping) => {
              const currentColor = FILTER_COLORS.find((c) => c.id === mapping.colorId);

              return (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between p-3 bg-le-card rounded"
                >
                  <span className="font-medium text-sm">{mapping.label}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm"
                      style={{ color: currentColor?.hex }}
                    >
                      {currentColor?.name}
                    </span>
                    <div className="flex gap-1">
                      {FILTER_COLORS.slice(0, 12).map((color) => (
                        <button
                          key={color.id}
                          onClick={() => updateColorMapping(mapping.id, color.id)}
                          className={clsx(
                            'w-5 h-5 rounded border transition-all',
                            mapping.colorId === color.id
                              ? 'border-white scale-110'
                              : 'border-transparent hover:border-white/50'
                          )}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-le-border flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onClose} className="btn-primary">
            Apply Colors
          </button>
        </div>
      </div>
    </div>
  );
}
