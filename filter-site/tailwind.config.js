/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Last Epoch themed colors
        'le-dark': '#0d0d0f',
        'le-darker': '#080809',
        'le-card': '#1a1a1f',
        'le-border': '#2a2a35',
        'le-accent': '#00d4d4',
        'le-accent-hover': '#00e5e5',
        'le-gold': '#d4a017',
        'le-purple': '#8b5cf6',
        'le-red': '#ef4444',
        'le-green': '#22c55e',
        'le-blue': '#3b82f6',
        'le-orange': '#f97316',
        // Filter highlight colors (matching game)
        'filter-white': '#ffffff',
        'filter-red': '#ff4444',
        'filter-green': '#44ff44',
        'filter-blue': '#4444ff',
        'filter-yellow': '#ffff44',
        'filter-orange': '#ff8844',
        'filter-purple': '#aa44ff',
        'filter-cyan': '#44ffff',
        'filter-pink': '#ff44aa',
        'filter-gray': '#888888',
      },
      fontFamily: {
        'game': ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
}
