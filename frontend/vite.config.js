import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Colours copied from tailwind.config.js (bg.base / bg.surface) — the config is the token
// authority; a manifest can't reference a class, so these are the only hexes outside it.
// A palette change must be mirrored here by hand.
const BG_BASE = '#1a1918'
const BG_SURFACE = '#242220'

export default defineConfig({
  plugins: [
    react(),
    // PWA shell (D-013): installable from the HTTPS origin, updates itself, precaches only
    // the built assets. /api/* never touches the service worker — a stale library list
    // would be a silent failure — so navigation fallback is denied for it and no runtime
    // caching is configured.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Liminal',
        short_name: 'Liminal',
        description: 'Personal reading library',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: BG_SURFACE,
        background_color: BG_BASE,
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        globIgnores: ['icon.png'],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    port: 5173,
    // Proxy API requests to backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
