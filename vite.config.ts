import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['iOS >= 9', 'Safari >= 9'],
      modernPolyfills: true,
      renderLegacyChunks: true,
    })
  ],
  base: '/MaybeSomethingSeasonal/',
  build: {
    outDir: 'dist',
    target: 'es5',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
  }
})
