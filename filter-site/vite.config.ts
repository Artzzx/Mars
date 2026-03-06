/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream, copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Absolute path to the knowledge-base JSON (lives in filter-engine, outside this package)
const KB_SRC = resolve(__dirname, '../filter-engine/filter-compiler/src/knowledge/knowledge-base.json')
const KB_PUBLIC_URL = '/data/knowledge-base.json'

/**
 * Serves knowledge-base.json directly from its source location.
 *
 * Using a symlink in public/ is unreliable: Windows git clients leave symlinks
 * as plain-text files containing the link target, so `res.json()` gets a path
 * string instead of JSON and throws "Unexpected token '.'…".
 *
 * Instead, this plugin:
 *  - Dev / preview: intercepts requests to /data/knowledge-base.json and
 *    streams the file from its real path on disk.
 *  - Production build: copies the file into dist/data/ after bundling.
 */
function knowledgeBasePlugin(): Plugin {
  function addMiddleware(server: { middlewares: { use: (path: string, handler: (req: unknown, res: { setHeader: (k: string, v: string) => void; statusCode: number; end: (m: string) => void }) => void) => void } }) {
    server.middlewares.use(KB_PUBLIC_URL, (_req, res) => {
      if (!existsSync(KB_SRC)) {
        res.statusCode = 404
        res.end('knowledge-base.json not found')
        return
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      // Cast needed: Vite's Connect types diverge from Node's http.ServerResponse
      createReadStream(KB_SRC).pipe(res as unknown as NodeJS.WritableStream)
    })
  }

  return {
    name: 'knowledge-base-static',
    // Dev server
    configureServer(server) { addMiddleware(server) },
    // `vite preview` (serving the production dist)
    configurePreviewServer(server) { addMiddleware(server) },
    // After `vite build` finishes writing the bundle, copy the file
    writeBundle({ dir }) {
      const outDir = resolve(dir ?? 'dist', 'data')
      mkdirSync(outDir, { recursive: true })
      if (existsSync(KB_SRC)) {
        copyFileSync(KB_SRC, resolve(outDir, 'knowledge-base.json'))
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), knowledgeBasePlugin()],
  resolve: {
    alias: {
      '@': '/src',
      // Matches filter-compiler's tsconfig path: "@filter-site/*" → "../../filter-site/src/*"
      '@filter-site': '/src',
    },
  },
  server: {
    fs: {
      // Allow serving files from the monorepo root so the dev server can
      // reach filter-engine sources imported via relative paths.
      allow: ['..'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
