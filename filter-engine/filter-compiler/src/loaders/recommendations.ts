// Loads and caches build-recommendations.json
// This file is OPTIONAL — if missing, the compiler degrades gracefully:
// unique/base rules are disabled, but the filter is still valid.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { BuildRecommendations } from '../types/recommendations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve to: filter-engine/data/sources/recommendations/build-recommendations.json
const RECS_PATH = path.resolve(
  __dirname,
  '../../../../data/sources/recommendations/build-recommendations.json'
);

const EMPTY_RECOMMENDATIONS: BuildRecommendations = {
  generated_at: '',
  builds: {},
};

let cache: BuildRecommendations | null = null;

export function loadRecommendations(): BuildRecommendations {
  if (cache) return cache;

  try {
    const raw = readFileSync(RECS_PATH, 'utf-8');
    const data = JSON.parse(raw) as BuildRecommendations;
    cache = data;
    return cache;
  } catch {
    console.warn(
      '[filter-compiler] build-recommendations.json not found or unreadable — ' +
      'unique item, exalted base, and idol rules will be disabled for this filter.'
    );
    return EMPTY_RECOMMENDATIONS;
  }
}

/** Reset the module-level cache (useful for testing) */
export function resetRecommendationsCache(): void {
  cache = null;
}
