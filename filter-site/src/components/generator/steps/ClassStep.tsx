import { useEffect } from 'react';
import { ClassCard, type ClassName } from '../../common/ClassCard';
import { useGeneratorStore } from '../../../store/generatorStore';

const CLASSES: { id: ClassName; name: string; masteryCount: number }[] = [
  { id: 'sentinel',  name: 'Sentinel',  masteryCount: 3 },
  { id: 'mage',      name: 'Mage',      masteryCount: 3 },
  { id: 'primalist', name: 'Primalist', masteryCount: 3 },
  { id: 'rogue',     name: 'Rogue',     masteryCount: 3 },
  { id: 'acolyte',   name: 'Acolyte',   masteryCount: 3 },
];

interface ClassStepProps {
  onAutoAdvance: () => void;
}

export function ClassStep({ onAutoAdvance }: ClassStepProps) {
  const selectedClass = useGeneratorStore((s) => s.selectedClass);
  const setClass      = useGeneratorStore((s) => s.setClass);

  function handleSelect(id: ClassName) {
    if (id === selectedClass) return;
    setClass(id);
    // Auto-advance after visual confirm pause
    setTimeout(onAutoAdvance, 300);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Choose Your Class</h2>
        <p className="text-gray-400 mt-1">Your class determines which items the filter focuses on.</p>
      </div>

      {/* 2-column grid; last card (Acolyte) is centred via CSS */}
      <div className="grid grid-cols-2 gap-4">
        {CLASSES.map((cls, idx) => {
          const isLast = idx === CLASSES.length - 1;
          return (
            <div key={cls.id} className={isLast && CLASSES.length % 2 !== 0 ? 'col-span-2 flex justify-center' : ''}>
              <div className={isLast && CLASSES.length % 2 !== 0 ? 'w-1/2' : 'w-full'}>
                <ClassCard
                  id={cls.id}
                  name={cls.name}
                  masteryCount={cls.masteryCount}
                  selected={selectedClass === cls.id}
                  onClick={() => handleSelect(cls.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
