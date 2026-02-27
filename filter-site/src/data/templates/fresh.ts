import type { ItemFilter } from '../../lib/filters/types';
import { FILTER_VERSION, GAME_VERSION } from '../../lib/filters/types';

export const freshFilter: ItemFilter = {
  name: 'My Custom Filter',
  filterIcon: 1,
  filterIconColor: 0,
  description: 'A brand new filter created from scratch.',
  lastModifiedInVersion: GAME_VERSION.CURRENT,
  lootFilterVersion: FILTER_VERSION.CURRENT,
  rules: [],
};
