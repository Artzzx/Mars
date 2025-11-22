import type { FilterTemplate } from '../../lib/filters/types';
import { levelingFilter } from './leveling';

export const FILTER_TEMPLATES: FilterTemplate[] = [
  {
    id: 'leveling',
    name: 'Leveling',
    type: 'leveling',
    description: 'Relaxed filter for leveling characters. Shows more items to help gear up.',
    filter: levelingFilter,
  },
  {
    id: 'standard',
    name: 'Standard',
    type: 'standard',
    description: 'Balanced filter for general gameplay. Good mix of strictness.',
    filter: {
      ...levelingFilter,
      name: 'Standard Filter',
      description: 'A balanced filter for everyday gameplay.',
    },
  },
  {
    id: 'endgame',
    name: 'Endgame',
    type: 'endgame',
    description: 'Strict filter for endgame farming. Focuses on valuable drops only.',
    filter: {
      ...levelingFilter,
      name: 'Endgame Filter',
      description: 'Strict filter for corruption grinding and endgame content.',
    },
  },
  {
    id: 'hardcore',
    name: 'Hardcore',
    type: 'hardcore',
    description: 'Specifically tailored for Hardcore mode. Emphasizes survival gear.',
    filter: {
      ...levelingFilter,
      name: 'Hardcore Filter',
      description: 'Optimized for Hardcore characters with focus on defensive stats.',
    },
  },
];

export { levelingFilter };
