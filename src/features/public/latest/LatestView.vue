<!--
  LatestView.vue — Daftar Berita Terbaru (/terbaru). Feed kronologis grid NewsCard
  + paginasi via LoadMore. Mock: pool story terurut terbaru. Live: feed cursor
  contentService (TODO wiring cursor penuh menyusul).
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { contentService } from '@/services/content.service';
import { USE_MOCK, getMockStoryPool, type MockStory } from '@/features/public/data/homeSource';
import { useSeoMeta } from '@/composables/useSeoMeta';
import NewsCard from '@/features/public/home/components/NewsCard.vue';
import SectionHeader from '@/features/public/home/components/SectionHeader.vue';
import LoadMore from '@/components/ui/LoadMore.vue';

const PAGE = 12;
const visible = ref(PAGE);

const { data } = useQuery({
  queryKey: ['public-latest'],
  queryFn: () =>
    contentService
      .list({ type: 'post', status: 'published', sort: '-published_at', limit: 60 })
      .then((r) => r.data),
  retry: false,
  staleTime: 5 * 60_000,
  enabled: !USE_MOCK,
});

const all = computed<MockStory[]>(() =>
  USE_MOCK ? getMockStoryPool() : ((data.value ?? []) as MockStory[]),
);
const shown = computed(() => all.value.slice(0, visible.value));
const hasMore = computed(() => visible.value < all.value.length);

useSeoMeta(() => ({
  title: 'Berita Terbaru',
  description: 'Kumpulan berita terbaru, terurut dari yang paling baru.',
}));
</script>

<template>
  <div>
    <SectionHeader title="Berita Terbaru" accent="var(--color-pub-crimson)" />
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <NewsCard v-for="item in shown" :key="item.id" :item="item" />
    </div>
    <LoadMore :has-more="hasMore" @more="visible += PAGE" />
  </div>
</template>
