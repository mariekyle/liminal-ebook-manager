/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors matching your gradient cover palette
      colors: {
        library: {
          bg: '#0f172a',      // Dark blue background
          card: '#1e293b',    // Card background
          accent: '#667eea',  // Primary accent
        }
      }
    },
  },
  plugins: [],
}
