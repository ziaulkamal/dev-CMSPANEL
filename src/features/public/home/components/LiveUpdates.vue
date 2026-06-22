<!--
  LiveUpdates.vue — timeline berstempel waktu di bawah hero. Titik LIVE berkedip
  + garis vertikal kiri 2px. Tiap baris: waktu relatif (abu) + judul ringkas.
-->
<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { ContentSummary } from '@/types/domain';
import { relativeTime } from '@/lib/datetime';

defineProps<{ items: ContentSummary[] }>();
</script>

<template>
  <section v-if="items.length">
    <div class="mb-3 flex items-center gap-2">
      <span class="pub-live-dot" aria-hidden="true"></span>
      <span class="text-xs font-extrabold tracking-[0.08em]" :style="{ color: 'var(--color-pub-crimson)' }">
        LIVE UPDATES
      </span>
    </div>

    <ul
      class="flex flex-col gap-2.5 pl-4"
      :style="{ borderLeft: '2px solid var(--color-pub-line)' }"
    >
      <li v-for="it in items" :key="it.id" class="text-sm leading-snug">
        <span v-if="relativeTime(it.published_at)" :style="{ color: 'var(--color-pub-muted)' }">
          {{ relativeTime(it.published_at) }}:
        </span>
        <RouterLink
          :to="{ name: 'article', params: { id: it.id, slug: it.slug } }"
          class="pub-link-title"
        >
          {{ it.title }}
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
