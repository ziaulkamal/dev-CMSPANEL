<!--
  PopularList.vue — daftar "Most popular" bernomor gaya editorial: angka besar
  crimson + judul + meta (views). Data dari mock (atau feed populer saat live).
-->
<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { PopularStory } from '@/features/public/data/homeSource';

defineProps<{ items: PopularStory[] }>();

/** Ringkas angka besar: 42100 → "42,1k". */
function formatViews(n?: number): string {
  if (!n) return '';
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')}k dibaca`;
  return `${n} dibaca`;
}
</script>

<template>
  <ol class="flex flex-col">
    <li
      v-for="(it, i) in items"
      :key="it.id"
      :style="i ? { borderTop: '1px solid var(--color-pub-line)' } : {}"
    >
      <RouterLink
        :to="{ name: 'article', params: { id: it.id, slug: it.slug } }"
        class="group flex items-start gap-3 py-3"
      >
        <span
          class="flex-none text-2xl font-extrabold leading-none"
          :style="{ fontFamily: 'var(--font-pub-mono)', color: 'var(--color-pub-crimson)' }"
        >{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="min-w-0">
          <span class="pub-link-title block text-sm font-semibold leading-snug">{{ it.title }}</span>
          <span
            v-if="formatViews(it.views)"
            class="mt-1 block text-xs"
            :style="{ color: 'var(--color-pub-muted)' }"
          >{{ formatViews(it.views) }}</span>
        </span>
      </RouterLink>
    </li>
  </ol>
</template>
