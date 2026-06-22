/**
 * src/main.ts
 * Bootstrap aplikasi: Pinia, Vue Query, Router, lalu mount.
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import { router } from './router';
import { queryClient } from './lib/queryClient';
import './assets/app.css';

createApp(App)
  .use(createPinia())
  .use(VueQueryPlugin, { queryClient })
  .use(router)
  .mount('#app');
