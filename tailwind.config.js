module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'flash-green': 'flash-green 1.2s ease-out',
        'flash-red': 'flash-red 1.2s ease-out',
      },
      keyframes: {
        'flash-green': {
          '0%': { 'box-shadow': 'inset 0 0 200px 200px rgba(16, 185, 129, 0.1), 0 0 0 2px rgba(16, 185, 129, 0.5)', 'border-color': 'rgba(16,185,129,0.8)' },
          '100%': { 'box-shadow': 'inset 0 0 0 0 rgba(16, 185, 129, 0), 0 0 0 0px rgba(16, 185, 129, 0)', 'border-color': 'inherit' }
        },
        'flash-red': {
          '0%': { 'box-shadow': 'inset 0 0 200px 200px rgba(244, 63, 94, 0.1), 0 0 0 2px rgba(244, 63, 94, 0.5)', 'border-color': 'rgba(244,63,94,0.8)' },
          '100%': { 'box-shadow': 'inset 0 0 0 0 rgba(244, 63, 94, 0), 0 0 0 0px rgba(244, 63, 94, 0)', 'border-color': 'inherit' }
        }
      }
    },
  },
  plugins: [],
}
