import pako from 'pako';
import type { ItemFilter } from './filters/types';

/**
 * Encode a filter state into a shareable URL hash string.
 * Uses: JSON → gzip → base64url
 */
export function encodeFilter(filter: ItemFilter): string {
  // Strip client-side-only IDs to reduce size
  const stripped = {
    ...filter,
    rules: filter.rules.map((rule) => {
      const { id: _id, ...rest } = rule;
      return rest;
    }),
  };
  const json = JSON.stringify(stripped);
  const compressed = pako.deflate(new TextEncoder().encode(json));
  return base64UrlEncode(compressed);
}

/**
 * Decode a filter from a URL hash string.
 * Reverses: base64url → gunzip → JSON
 */
export function decodeFilter(encoded: string): ItemFilter {
  const compressed = base64UrlDecode(encoded);
  const json = new TextDecoder().decode(pako.inflate(compressed));
  const parsed = JSON.parse(json);
  // Restore client-side IDs
  return {
    ...parsed,
    rules: parsed.rules.map((rule: Record<string, unknown>) => ({
      ...rule,
      id: crypto.randomUUID(),
    })),
  };
}

/**
 * Create a shareable URL for the current filter.
 * Returns null if the encoded filter exceeds maxLength (default 8000 chars).
 */
export function createShareUrl(filter: ItemFilter, maxLength = 8000): string | null {
  const encoded = encodeFilter(filter);
  if (encoded.length > maxLength) return null;
  const base = window.location.origin + '/editor/overview';
  return `${base}#filter=${encoded}`;
}

/**
 * Extract and decode a filter from the current URL hash.
 * Returns null if no filter hash is present.
 */
export function loadFilterFromHash(): ItemFilter | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#filter=')) return null;
  try {
    const encoded = hash.slice('#filter='.length);
    return decodeFilter(encoded);
  } catch (e) {
    console.error('Failed to decode shared filter:', e);
    return null;
  }
}

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
