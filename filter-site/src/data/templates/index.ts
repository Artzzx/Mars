import type { FilterTemplate } from '../../lib/filters/types';
import { levelingFilter } from './leveling';
import { endgameFilter } from './endgame';
import { freshFilter } from './fresh';

export const FILTER_TEMPLATES: FilterTemplate[] = [
  {
    id: 'fresh',
    name: 'Start Fresh',
    type: 'standard',
    description: 'Empty filter to build from scratch. Add your own rules.',
    filter: freshFilter,
  },
  {
    id: 'leveling',
    name: 'Leveling',
    type: 'leveling',
    description: 'Relaxed filter for leveling. Shows upgrades based on character level.',
    filter: levelingFilter,
  },
  {
    id: 'endgame',
    name: 'Endgame Strict',
    type: 'endgame',
    description: 'Strict filter for corruption farming. Hides most items.',
    filter: endgameFilter,
  },
  {
    id: 'import',
    name: 'Import File',
    type: 'standard',
    description: 'Import your existing XML filter using the Import button below.',
    filter: {
      ...freshFilter,
      name: 'Imported Filter',
      description: 'Use the Import button to load your filter file.',
    },
  },
];

export { levelingFilter, endgameFilter, freshFilter };
