<!--
  CategoryNews.vue — section full-width "Berita per Kategori". Mengelompokkan item
  berdasarkan kategori, lalu tiap kategori jadi blok: header label kategori (reuse
  SectionHeader, accent dari category_color) + grid kartu modern (NewsCard).
  Grid auto responsif: 1 kolom (mobile) / 2 (tablet) / 4 (desktop). Tiap kategori
  dibatasi `perCategory` item (default 4, nantinya bisa diatur via admin panel).
-->
<script setup lang="ts">
import { computed } from 'vue';
import type { MockStory } from '@/features/public/data/homeSource';
import SectionHeader from './SectionHeader.vue';
import NewsCard from './NewsCard.vue';

const props = withDefaults(
  defineProps<{
    items: MockStory[];
    /** Jumlah maksimum kartu per kategori. */
    perCategory?: number;
    /** Batas jumlah blok kategori yang ditampilkan (opsional). */
    maxCategories?: number;
  }>(),
  { perCategory: 4 },
);

interface CategoryGroup {
  category: string;
  color?: string;
  items: MockStory[];
}

/**
 * Kelompokkan item per kategori. Urutan kategori mengikuti kemunculan pertama;
 * item tanpa kategori dilewati agar blok tetap bersih. Tiap grup dipotong ke
 * `perCategory`, dan jumlah blok dibatasi `maxCategories` bila diset.
 */
const groups = computed<CategoryGroup[]>(() => {
  const map = new Map<string, CategoryGroup>();
  for (const it of props.items) {
    const cat = it.category;
    if (!cat) continue;
    let group = map.get(cat);
    if (!group) {
      group = { category: cat, color: it.category_color, items: [] };
      map.set(cat, group);
    }
    if (group.items.length < props.perCategory) group.items.push(it);
  }
  const all = [...map.values()];
  return props.maxCategories ? all.slice(0, props.maxCategories) : all;
});
</script>

<template>
  <div v-if="groups.length" class="mt-8 flex flex-col gap-8">
    <section
      v-for="group in groups"
      :key="group.category"
      :aria-label="group.category"
    >
      <SectionHeader
        :title="group.category"
        :accent="group.color || 'var(--color-pub-crimson)'"
        see-all
      />
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <NewsCard v-for="it in group.items" :key="it.id" :item="it" />
      </div>
    </section>
  </div>
</template>
