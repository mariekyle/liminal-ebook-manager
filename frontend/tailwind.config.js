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
        // LEGACY ALIASES (keep for existing code)
        // These map to the new warmer values so existing
        // classes shift automatically. Migrate to semantic
        // tokens in new code.
        // ===========================================
        library: {
          bg: '#1a1f2e',       // Was #0f172a — now warmer
          card: '#242b3d',     // Was #1e293b — now warmer
          accent: '#6366f1',   // Was #667eea — now indigo-500
        },

        // ===========================================
        // SEMANTIC TOKENS — Use these in all new code
        // ===========================================

        // Backgrounds
        bg: {
          base: '#1a1f2e',       // Main app background
          surface: '#242b3d',    // Cards, modals, drawers
          elevated: '#2d3548',   // Inputs, hover states, nested surfaces
          overlay: 'rgba(0, 0, 0, 0.5)',  // Modal backdrops
        },

        // Text
        text: {
          primary: '#ffffff',
          secondary: '#9ca3af',    // gray-400
          muted: '#6b7280',        // gray-500
          inverse: '#1a1f2e',      // Text on light backgrounds
        },

        // Borders
        border: {
          default: '#374151',      // gray-700
          subtle: '#2d3548',       // Same as elevated bg
          focus: '#6366f1',        // Matches action-primary
        },

        // Actions (buttons, links, interactive)
        action: {
          primary: '#6366f1',          // indigo-500 — main actions
          'primary-hover': '#5558e3',  // Hover/pressed
          success: '#22c55e',          // green-500 — confirmations only
          'success-hover': '#1ea550',
          danger: '#ef4444',           // red-500 — destructive
          'danger-hover': '#dc2626',
          warning: '#f59e0b',          // amber-500 — alerts
          secondary: '#4b5563',        // gray-600 — cancel/dismiss
          'secondary-hover': '#6b7280',
        },

        // Chips & metadata
        chip: {
          fiction: '#3b82f6',        // blue-500
          fanfiction: '#8b5cf6',     // violet-500
          nonfiction: '#10b981',     // emerald-500
          fandom: '#8b5cf6',         // violet-500
          ship: '#ec4899',           // pink-500
          character: '#06b6d4',      // cyan-500
          rating: '#ef4444',         // red-500
          warning: '#f59e0b',        // amber-500
          default: '#4b5563',        // gray-600
          filter: '#374151',         // gray-700
        },

        // Status
        status: {
          unread: '#6b7280',         // gray-500
          reading: '#3b82f6',        // blue-500
          finished: '#22c55e',       // green-500
          abandoned: '#ef4444',      // red-500
        },
      },
    },
  },
  plugins: [],
}
