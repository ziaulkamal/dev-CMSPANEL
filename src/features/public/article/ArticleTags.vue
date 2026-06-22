<!--
  ArticleTags.vue — daftar tag/topik artikel sebagai pill, ditampilkan di akhir
  tulisan sebelum area komentar. Tiap tag menautkan ke TaxonomyView (kategori).
-->
<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Tag } from '@lucide/vue';

defineProps<{ tags: Array<{ label: string; slug?: string }> }>();

function slugOf(t: { label: string; slug?: string }): string {
  return t.slug || t.label.toLowerCase().trim().replace(/\s+/g, '-');
}
</script>

<template>
  <div v-if="tags.length" class="mt-10 flex flex-wrap items-center gap-2">
    <span class="mr-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" :style="{ color: 'var(--color-pub-muted)' }">
      <Tag :size="14" /> Tag
    </span>
    <RouterLink
      v-for="t in tags"
      :key="t.label"
      :to="{ name: 'taxonomy', params: { slug: slugOf(t) } }"
      class="pub-tag"
    >#{{ t.label }}</RouterLink>
  </div>
</template>

<style scoped>
.pub-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 9999px;
  font-family: var(--font-pub-sans);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-pub-ink);
  background: var(--color-pub-canvas);
  border: 1px solid var(--color-pub-line);
  transition: background-color 150ms var(--ease-default), color 150ms var(--ease-default),
    border-color 150ms var(--ease-default);
}
.pub-tag:hover {
  color: var(--color-pub-crimson);
  background: color-mix(in srgb, var(--color-pub-crimson) 6%, transparent);
  border-color: color-mix(in srgb, var(--color-pub-crimson) 35%, transparent);
}
</style>
