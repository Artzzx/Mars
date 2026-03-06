/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
