<!--
  SearchView.vue — halaman hasil pencarian utuh (/search?q=). Daftar penuh hasil
  (grid NewsCard) + paginasi klien via LoadMore. Sinkron dengan query string `q`.
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { searchMockStories, USE_MOCK } from '@/features/public/data/homeSource';
import { useSeoMeta } from '@/composables/useSeoMeta';
import NewsCard from '@/features/public/home/components/NewsCard.vue';
import SectionHeader from '@/features/public/home/components/SectionHeader.vue';
import LoadMore from '@/components/ui/LoadMore.vue';

const route = useRoute();
const router = useRouter();

const q = computed(() => (route.query.q as string) ?? '');
const term = ref(q.value);

watch(q, (v) => {
  term.value = v;
  visible.value = PAGE;
});

const PAGE = 12;
const visible = ref(PAGE);

/** Hasil penuh (mock: pool besar; live: belum di sini — overlay yg utama). */
const all = computed(() =>
  q.value.trim() ? searchMockStories(q.value, USE_MOCK ? 60 : 30) : [],
);
const shown = computed(() => all.value.slice(0, visible.value));
const hasMore = computed(() => visible.value < all.value.length);

function submit(): void {
  router.replace({ name: 'search', query: term.value.trim() ? { q: term.value.trim() } : {} });
}

useSeoMeta(() => ({
  title: q.value ? `Pencarian: ${q.value}` : 'Pencarian',
  description: `Hasil pencarian untuk "${q.value}".`,
}));
</script>

<template>
  <div>
    <form class="mb-6" @submit.prevent="submit">
      <input
        v-model="term"
        type="search"
        class="w-full rounded-lg px-4 py-3 text-base outline-none"
        :style="{
          border: '1px solid var(--color-pub-line)',
          backgroundColor: 'var(--color-pub-paper)',
          color: 'var(--color-pub-ink)',
        }"
        placeholder="Cari berita, kategori…"
        aria-label="Cari"
      />
    </form>

    <SectionHeader
      :title="q ? `Hasil untuk “${q}”` : 'Pencarian'"
      accent="var(--color-pub-crimson)"
    />

    <p v-if="!q.trim()" class="py-8 text-center text-sm" :style="{ color: 'var(--color-pub-muted)' }">
      Masukkan kata kunci untuk mencari.
    </p>
    <p
      v-else-if="all.length === 0"
      class="py-8 text-center text-sm"
      :style="{ color: 'var(--color-pub-muted)' }"
    >
      Tidak ada hasil untuk “{{ q }}”.
    </p>

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <NewsCard v-for="item in shown" :key="item.id" :item="item" />
    </div>

    <LoadMore :has-more="hasMore" @more="visible += PAGE" />
  </div>
</template>
