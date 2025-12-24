/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-blue': '#003366', // Primary (Estimate based on Deep Blue)
        'light-gray': '#F8F9FA', // Secondary (From spec)
        'vibrant-green': '#28A745', // Accent
        'alert-red': '#DC3545', // Warning/Error
        'charcoal-gray': '#333333', // Text
      },
    },
  },
  plugins: [],
}
