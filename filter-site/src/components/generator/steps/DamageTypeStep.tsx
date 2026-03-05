import { useEffect, useRef } from 'react';
import { DamageTypeChip, type DamageType } from '../../common/DamageTypeChip';
import { useGeneratorStore } from '../../../store/generatorStore';

// The mastery damage type hints (mirrored from MasteryStep for pre-fill)
const MASTERY_HINTS: Record<string, string[]> = {
  void_knight:  ['void', 'physical'],
  paladin:      ['fire', 'physical'],
  forge_guard:  ['physical'],
  sorcerer:     ['fire', 'cold', 'lightning'],
  runemaster:   ['lightning', 'cold'],
  spellblade:   ['fire', 'cold'],
  druid:        ['physical', 'poison'],
  beastmaster:  ['physical'],
  shaman:       ['cold', 'lightning'],
  bladedancer:  ['physical', 'void'],
  marksman:     ['physical', 'poison', 'fire'],
  falconer:     ['physical'],
  lich:         ['necrotic', 'void'],
  necromancer:  ['necrotic', 'physical'],
  warlock:      ['necrotic', 'poison'],
};

const ALL_TYPES: DamageType[] = [
  'physical', 'fire', 'cold', 'lightning', 'void', 'necrotic', 'poison',
];

export function DamageTypeStep() {
  const selectedMastery    = useGeneratorStore((s) => s.selectedMastery);
  const selectedDamageTypes = useGeneratorStore((s) => s.selectedDamageTypes);
  const toggleDamageType    = useGeneratorStore((s) => s.toggleDamageType);
  const prefilled           = useRef(false);

  // Pre-fill from mastery hints on first render (or when mastery changes)
  useEffect(() => {
    if (!selectedMastery || prefilled.current) return;
    const hints = MASTERY_HINTS[selectedMastery] ?? [];
    if (hints.length > 0 && selectedDamageTypes.length === 0) {
      hints.forEach((dt) => toggleDamageType(dt));
    }
    prefilled.current = true;
  }, [selectedMastery]);

  // Reset pre-fill flag when mastery changes
  useEffect(() => {
    prefilled.current = false;
  }, [selectedMastery]);

  const hasHints = selectedMastery && (MASTERY_HINTS[selectedMastery]?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Select Your Damage Type(s)</h2>
        <p className="text-gray-400 mt-1">
          Choose what your build deals. Hybrid builds can pick multiple.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {ALL_TYPES.map((type) => (
          <DamageTypeChip
            key={type}
            type={type}
            selected={selectedDamageTypes.includes(type)}
            onClick={() => toggleDamageType(type)}
            size="md"
          />
        ))}
      </div>

      {/* Contextual hint */}
      <p className="text-sm text-gray-500">
        {hasHints
          ? `Hybrid builds like ${selectedMastery!.replace(/_/g, ' ')} often use ${
              (MASTERY_HINTS[selectedMastery!] ?? [])
                .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                .join(' + ')
            }.`
          : 'Hybrid builds can pick multiple damage types.'}
      </p>

      {selectedDamageTypes.length === 0 && (
        <p className="text-xs text-le-red">Select at least one damage type to continue.</p>
      )}
    </div>
  );
}
