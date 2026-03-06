// Loads and caches build-recommendations.json
// This file is OPTIONAL — if missing, the compiler degrades gracefully:
// unique/base rules are disabled, but the filter is still valid.
//
// Browser context: recommendations are not bundled with the site (file not
//   published to public/), so always returns the empty fallback.
// Node.js context: reads from disk; gracefully degrades if file not found.

import type { BuildRecommendations } from '../types/recommendations.js';

const EMPTY_RECOMMENDATIONS: BuildRecommendations = {
  generated_at: '',
  builds: {},
};

let cache: BuildRecommendations | null = null;

export async function loadRecommendations(): Promise<BuildRecommendations> {
  if (cache) return cache;

  if (typeof window !== 'undefined') {
    // Browser environment — recommendations file is not published as a static
    // asset, so degrade gracefully.
    console.warn(
      '[filter-compiler] build-recommendations.json not available in browser — ' +
      'unique item, exalted base, and idol rules will be disabled for this filter.'
    );
    return EMPTY_RECOMMENDATIONS;
  }

  // Node.js environment (CLI) — try to read from disk.
  try {
    const { readFileSync } = await import(/* @vite-ignore */ 'node:fs');
    const { fileURLToPath } = await import(/* @vite-ignore */ 'node:url');
    const path = await import(/* @vite-ignore */ 'node:path');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const RECS_PATH = path.resolve(
      __dirname,
      '../../../../data/sources/recommendations/build-recommendations.json'
    );

    const raw = readFileSync(RECS_PATH, 'utf-8') as string;
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
