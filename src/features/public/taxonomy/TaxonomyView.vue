<!--
  TaxonomyView.vue — halaman kategori (/kategori/:slug). Header kategori + grid
  berita yang terkait. Mock: filter pool story per kategori. Live: TODO menyusul
  (taxonomyService.terms + filter konten per term).
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getMockByCategory, type MockStory } from '@/features/public/data/homeSource';
import { useSeoMeta } from '@/composables/useSeoMeta';
import NewsCard from '@/features/public/home/components/NewsCard.vue';
import LoadMore from '@/components/ui/LoadMore.vue';

const route = useRoute();
const slug = computed(() => (route.params.slug as string) ?? '');

/** Label kategori: dari story pertama (punya `category`) atau slug di-Title. */
const all = computed<MockStory[]>(() => getMockByCategory(slug.value));
const label = computed(
  () => all.value[0]?.category || slug.value.replace(/-/g, ' ').toUpperCase(),
);
const accent = computed(() => all.value[0]?.category_color || 'var(--color-pub-crimson)');

const PAGE = 12;
const visible = ref(PAGE);
watch(slug, () => (visible.value = PAGE));

const shown = computed(() => all.value.slice(0, visible.value));
const hasMore = computed(() => visible.value < all.value.length);

useSeoMeta(() => ({
  title: `Kategori: ${label.value}`,
  description: `Kumpulan berita kategori ${label.value}.`,
}));
</script>

<template>
  <div>
    <header class="mb-6 border-b pb-4" :style="{ borderColor: 'var(--color-pub-line)' }">
      <span
        class="block h-1 w-12 rounded-full"
        :style="{ backgroundColor: accent }"
      ></span>
      <h1 class="mt-3 text-3xl font-extrabold" :style="{ color: 'var(--color-pub-ink)' }">
        {{ label }}
      </h1>
      <p class="mt-1 text-sm" :style="{ color: 'var(--color-pub-muted)' }">
        {{ all.length }} berita
      </p>
    </header>

    <p
      v-if="all.length === 0"
      class="py-8 text-center text-sm"
      :style="{ color: 'var(--color-pub-muted)' }"
    >
      Belum ada berita pada kategori ini.
    </p>

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <NewsCard v-for="item in shown" :key="item.id" :item="item" />
    </div>

    <LoadMore :has-more="hasMore" @more="visible += PAGE" />
  </div>
</template>
