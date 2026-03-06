// Loads and caches knowledge-base.json
// knowledge-base.json is the output of the Python knowledge pipeline.
//
// Browser context: fetches from /data/knowledge-base.json (served from public/)
// Node.js context: reads from disk relative to this file

import type { KnowledgeBase } from '../types/knowledge-base.js';

let cache: KnowledgeBase | null = null;

export async function loadKnowledgeBase(): Promise<KnowledgeBase> {
  if (cache) return cache;

  let kb: KnowledgeBase;

  if (typeof window !== 'undefined') {
    // Browser environment — fetch from the public static asset
    const res = await fetch('/data/knowledge-base.json');
    if (!res.ok) {
      throw new Error(
        `[filter-compiler] Failed to fetch knowledge-base.json: ${res.status} ${res.statusText}`
      );
    }
    kb = (await res.json()) as KnowledgeBase;
  } else {
    // Node.js environment (CLI) — read from disk
    // Dynamic imports avoid bundling node: modules into the browser build.
    const { readFileSync } = await import(/* @vite-ignore */ 'node:fs');
    const { fileURLToPath } = await import(/* @vite-ignore */ 'node:url');
    const path = await import(/* @vite-ignore */ 'node:path');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const KB_PATH = path.resolve(__dirname, '../knowledge/knowledge-base.json');

    let raw: string;
    try {
      raw = readFileSync(KB_PATH, 'utf-8') as string;
    } catch {
      throw new Error(
        `[filter-compiler] knowledge-base.json not found at ${KB_PATH}. ` +
        'Run the knowledge pipeline first: python -m packages.knowledge_pipeline.pipeline'
      );
    }

    try {
      kb = JSON.parse(raw) as KnowledgeBase;
    } catch {
      throw new Error(`[filter-compiler] knowledge-base.json is malformed JSON: ${KB_PATH}`);
    }
  }

  // Validate required top-level fields
  if (!kb.version || !kb.generated_at || !kb.builds) {
    throw new Error(
      '[filter-compiler] knowledge-base.json is missing required fields ' +
      '(version, generated_at, builds). Re-run the knowledge pipeline.'
    );
  }

  if (Object.keys(kb.builds).length === 0) {
    console.warn(
      '[filter-compiler] knowledge-base.json contains 0 builds. ' +
      'All filters will use the baseline fallback profile.'
    );
  }

  cache = kb;
  return cache;
}

/** Reset the module-level cache (useful for testing) */
export function resetKnowledgeBaseCache(): void {
  cache = null;
}
