/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode colors
        'deep-blue': '#003366',
        'light-gray': '#F8F9FA',
        'vibrant-green': '#28A745',
        'alert-red': '#DC3545',
        'charcoal-gray': '#333333',
        
        // Dark mode colors
        'dark': {
          'bg': '#0F172A',      // slate-900
          'surface': '#1E293B',  // slate-800
          'surface-hover': '#334155', // slate-700
          'primary': '#3B82F6',  // blue-500
          'text': '#E2E8F0',     // slate-200
          'text-secondary': '#94A3B8', // slate-400
          'border': '#334155',   // slate-700
        }
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
    },
  },
  plugins: [],
}
