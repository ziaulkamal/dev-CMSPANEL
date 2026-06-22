<!--
  LiveUpdates.vue — card breaking: header "LIVE" + dot berkedip, isi timeline
  berstempel waktu yang BISA di-scroll (tinggi tetap) bila item banyak.
  Tiap baris: titik di garis vertikal + waktu relatif + judul ringkas.
-->
<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { ContentSummary } from '@/types/domain';
import { relativeTime } from '@/lib/datetime';

defineProps<{ items: ContentSummary[] }>();
</script>

<template>
  <section
    v-if="items.length"
    class="overflow-hidden rounded-lg"
    :style="{ border: '1px solid var(--color-pub-line)', backgroundColor: 'var(--color-pub-paper)' }"
  >
    <!-- Header card -->
    <div
      class="flex items-center justify-between px-4 py-2.5"
      :style="{ borderBottom: '1px solid var(--color-pub-line)' }"
    >
      <div class="flex items-center gap-2">
        <span class="pub-live-dot" aria-hidden="true"></span>
        <span class="text-xs font-extrabold tracking-[0.08em]" :style="{ color: 'var(--color-pub-crimson)' }">
          LIVE UPDATES
        </span>
      </div>
      <a href="/" class="text-[11px] font-semibold transition-opacity hover:opacity-70" :style="{ color: 'var(--color-pub-crimson)' }">
        Lihat semua →
      </a>
    </div>

    <!-- Timeline scrollable (maks ~5 item terlihat) -->
    <ul class="pub-live-scroll flex max-h-[248px] flex-col gap-3.5 overflow-y-auto px-4 py-3.5">
      <li
        v-for="it in items"
        :key="it.id"
        class="relative pl-4 text-sm leading-snug"
        :style="{ borderLeft: '2px solid var(--color-pub-line)' }"
      >
        <span
          class="absolute -left-[5px] top-1.5 block h-2 w-2 rounded-full"
          :style="{ backgroundColor: 'var(--color-pub-crimson)' }"
          aria-hidden="true"
        ></span>
        <span v-if="relativeTime(it.published_at)" class="mr-1 text-xs font-semibold" :style="{ color: 'var(--color-pub-muted)' }">
          {{ relativeTime(it.published_at) }}
        </span>
        <RouterLink
          :to="{ name: 'article', params: { id: it.id, slug: it.slug } }"
          class="pub-link-title font-medium"
        >{{ it.title }}</RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* Scrollbar tipis selaras tema. */
.pub-live-scroll::-webkit-scrollbar { width: 5px; }
.pub-live-scroll::-webkit-scrollbar-thumb {
  background: var(--color-pub-line);
  border-radius: 9999px;
}
</style>
