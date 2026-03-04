import clsx from 'clsx';
import { MasteryCard } from '../../common/MasteryCard';
import { useGeneratorStore } from '../../../store/generatorStore';

interface MasteryData {
  id: string;
  name: string;
  description: string;
  damageTypes: string[];
}

const MASTERIES: Record<string, MasteryData[]> = {
  sentinel: [
    { id: 'void_knight',  name: 'Void Knight',  description: 'Melee void damage, time echoes',     damageTypes: ['void', 'physical'] },
    { id: 'paladin',      name: 'Paladin',       description: 'Holy fire, healing auras',           damageTypes: ['fire', 'physical'] },
    { id: 'forge_guard',  name: 'Forge Guard',   description: 'Forged weapons, minion army',        damageTypes: ['physical'] },
  ],
  mage: [
    { id: 'sorcerer',     name: 'Sorcerer',      description: 'Elemental spell damage',             damageTypes: ['fire', 'cold', 'lightning'] },
    { id: 'runemaster',   name: 'Runemaster',    description: 'Rune magic, area spells',            damageTypes: ['lightning', 'cold'] },
    { id: 'spellblade',   name: 'Spellblade',    description: 'Melee spells, close-range burst',    damageTypes: ['fire', 'cold'] },
  ],
  primalist: [
    { id: 'druid',        name: 'Druid',         description: 'Shapeshifting, nature damage',       damageTypes: ['physical', 'poison'] },
    { id: 'beastmaster',  name: 'Beastmaster',   description: 'Companion army, physical',           damageTypes: ['physical'] },
    { id: 'shaman',       name: 'Shaman',        description: 'Totems, cold & lightning',           damageTypes: ['cold', 'lightning'] },
  ],
  rogue: [
    { id: 'bladedancer',  name: 'Bladedancer',   description: 'Fast melee, shadow strikes',         damageTypes: ['physical', 'void'] },
    { id: 'marksman',     name: 'Marksman',      description: 'Bow skills, poison & fire',          damageTypes: ['physical', 'poison', 'fire'] },
    { id: 'falconer',     name: 'Falconer',      description: 'Falcon companion, physical',         damageTypes: ['physical'] },
  ],
  acolyte: [
    { id: 'lich',         name: 'Lich',          description: 'Death seal, necrotic & void',        damageTypes: ['necrotic', 'void'] },
    { id: 'necromancer',  name: 'Necromancer',   description: 'Minion army, necrotic',              damageTypes: ['necrotic', 'physical'] },
    { id: 'warlock',      name: 'Warlock',       description: 'Curses, poison & necrotic DoT',      damageTypes: ['necrotic', 'poison'] },
  ],
};

interface MasteryStepProps {
  onAutoAdvance: () => void;
}

export function MasteryStep({ onAutoAdvance }: MasteryStepProps) {
  const selectedClass   = useGeneratorStore((s) => s.selectedClass);
  const selectedMastery = useGeneratorStore((s) => s.selectedMastery);
  const setMastery      = useGeneratorStore((s) => s.setMastery);

  const masteries = selectedClass ? (MASTERIES[selectedClass] ?? []) : [];
  const className = selectedClass
    ? selectedClass.charAt(0).toUpperCase() + selectedClass.slice(1)
    : 'Your class';

  function handleSelect(id: string) {
    if (id === selectedMastery) return;
    setMastery(id);
    setTimeout(onAutoAdvance, 300);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Pick Your Mastery</h2>
        <p className="text-gray-400 mt-1">
          Masteries refine your build identity. {className} has {masteries.length} options.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {masteries.map((m) => (
          <MasteryCard
            key={m.id}
            id={m.id}
            name={m.name}
            description={m.description}
            damageTypes={m.damageTypes}
            selected={selectedMastery === m.id}
            onClick={() => handleSelect(m.id)}
          />
        ))}
      </div>

      {/* Base class / no mastery yet option */}
      {selectedClass && (
        <button
          type="button"
          onClick={() => handleSelect(selectedClass)}
          className={clsx(
            'w-full py-3 px-4 rounded-xl border-2 text-left transition-all duration-150',
            selectedMastery === selectedClass
              ? 'border-le-accent bg-le-accent/10'
              : 'border-le-border hover:border-le-border/70 bg-le-darker',
          )}
        >
          <p className="text-sm italic text-gray-400">I haven't chosen a mastery yet</p>
          <p className="text-xs text-gray-600 mt-0.5">Uses the base {className} profile</p>
        </button>
      )}
    </div>
  );
}
