import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: './',
  test: {
    environment: 'happy-dom',
    include: ['tests/vue/**/*.spec.js'],
  },
})
