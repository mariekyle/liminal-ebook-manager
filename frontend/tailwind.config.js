/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ===========================================
        // SEMANTIC TOKENS — Use these in all new code
        // Warm A palette: Swan Song inspired
        // ===========================================

        // Backgrounds — warm charcoal family
        bg: {
          base: '#1a1918',
          surface: '#242220',
          elevated: '#2e2b28',
          overlay: 'rgba(0, 0, 0, 0.65)', // modal backdrops (replaces bg-black/60–70)
        },

        // Text — warm off-whites and grays
        text: {
          primary: '#e8e4df',
          secondary: '#9a958e',
          muted: '#918b84',
          inverse: '#1a1918',
          body: '#cdc8c1',
        },

        // Borders
        border: {
          default: '#3a3633',
          subtle: '#2e2b28',
          focus: '#5e8a8a',
        },

        // Actions — calm, not corporate
        action: {
          primary: '#5e8a8a',
          'primary-hover': '#4d7878',
          success: '#7a9e6a',
          'success-hover': '#698a5b',
          danger: '#c0564e',
          'danger-hover': '#a84940',
          warning: '#c4956a',
          secondary: '#4a4541',
          'secondary-hover': '#5e5954',
        },

        // Chips — desaturated, ambient metadata
        chip: {
          fiction: '#6a8fb0',
          fanfiction: '#8a7eb0',
          nonfiction: '#6a9e88',
          fandom: '#8a7eb0',
          ship: '#b08090',
          character: '#6a9eaa',
          default: '#5e5954',
          filter: '#3a3633',
        },

        // Status
        status: {
          unread: '#7a756e',
          reading: '#5e8a8a',
          finished: '#7a9e6a',
          dnf: '#7a756e',       // NOT red — DNF is neutral, not an error
        },
      },

      // Calm transition timing
      transitionDuration: {
        'calm': '200ms',
      },
      transitionTimingFunction: {
        'calm': 'ease-out',
      },
    },
  },
  plugins: [],
}
