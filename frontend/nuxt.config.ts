const appBase = process.env.NUXT_APP_BASE_URL || '/'

export default defineNuxtConfig({
  srcDir: 'app/',
  ssr: false,
  devtools: { enabled: false },
  experimental: {
    appManifest: false,
  },
  app: {
    baseURL: appBase,
    head: {
      title: '槐花短剧',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0A0E1A' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: `${appBase}favicon.png` },
        { rel: 'shortcut icon', type: 'image/png', href: `${appBase}favicon.png` },
      ],
    },
  },
  vite: {
    server: {
      proxy: {
        '/api': { target: 'http://localhost:5679', changeOrigin: true },
        '/static': { target: 'http://localhost:5679', changeOrigin: true },
      },
    },
  },
  build: {
    transpile: ['vue-i18n'],
  },
  compatibilityDate: '2025-05-15',
})
