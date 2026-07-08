/** vite.config.ts — konfigurasi build SPA Vue 3 + Tailwind v4. */
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // host:true → server dengar di 0.0.0.0 agar terjangkau dari luar container.
  server: { host: true, port: 40201 },
});
