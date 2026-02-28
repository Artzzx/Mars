// Loads and caches knowledge-base.json
// knowledge-base.json is the output of the Python knowledge pipeline
// and lives alongside the game knowledge constants.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { KnowledgeBase } from '../types/knowledge-base.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve relative to this file: src/loaders/ → src/knowledge/knowledge-base.json
const KB_PATH = path.resolve(__dirname, '../knowledge/knowledge-base.json');

let cache: KnowledgeBase | null = null;

export function loadKnowledgeBase(): KnowledgeBase {
  if (cache) return cache;

  let raw: string;
  try {
    raw = readFileSync(KB_PATH, 'utf-8');
  } catch {
    throw new Error(
      `[filter-compiler] knowledge-base.json not found at ${KB_PATH}. ` +
      'Run the knowledge pipeline first: python -m packages.knowledge_pipeline.pipeline'
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`[filter-compiler] knowledge-base.json is malformed JSON: ${KB_PATH}`);
  }

  const kb = data as KnowledgeBase;

  // Validate required top-level fields
  if (!kb.version || !kb.generated_at || !kb.builds) {
    throw new Error(
      `[filter-compiler] knowledge-base.json is missing required fields ` +
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
