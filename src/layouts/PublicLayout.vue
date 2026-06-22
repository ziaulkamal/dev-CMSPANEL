<!-- src/layouts/PublicLayout.vue — shell segment publik (header + footer). -->
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="flex min-h-full flex-col">
    <header class="border-b border-border bg-surface">
      <nav class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <RouterLink :to="{ name: 'home' }" class="text-lg font-bold text-primary">CMS</RouterLink>
        <RouterLink :to="{ name: 'login' }" class="text-sm text-text-muted">Masuk</RouterLink>
      </nav>
    </header>
    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <RouterView />
    </main>
    <footer class="border-t border-border py-6 text-center text-sm text-text-muted">
      © {{ new Date().getFullYear() }} CMS
    </footer>
  </div>
</template>
