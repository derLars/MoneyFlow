/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0E14',
        surface: '#151921',
        primary: '#3B82F6',   // blue-500
        secondary: '#9CA3AF', // gray-400
        tertiary: '#6B7280',  // gray-500
        success: '#22C55E',   // green-500
        error: '#EF4444',     // red-500
        info: '#60A5FA',      // blue-400
        // Keeping legacy names mapped to new theme for compatibility during migration,
        // or for specific semantic uses if needed.
        'deep-blue': '#3B82F6', // Remapped to primary
        'vibrant-green': '#22C55E', // Remapped to success
        'alert-red': '#EF4444', // Remapped to error
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem', // 24px
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
