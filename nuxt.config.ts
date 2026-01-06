import pkg from './package.json';
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },
  modules: ['nuxt-auth-utils', '@pinia/nuxt', '@pinia/colada-nuxt', '@nuxt/ui', '@vite-pwa/nuxt'],

  colorMode: {
    preference: 'dark',
  },
  runtimeConfig: {
    // VAPID keys for web push (generate with: npx web-push generate-vapid-keys)
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    public: {
      version: pkg.version,
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    },
  },
  nitro: {
    serverAssets: [{
      baseName: 'migrations',
      dir: './server/database/migrations'
    }]
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Habit Tracker',
      short_name: 'Habits',
      description: 'Track your daily habits and build streaks',
      theme_color: '#000000',
      background_color: '#000000',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },
});
