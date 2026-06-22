<!--
  src/features/public/home/HomeView.vue
  Beranda wire-service: grid 3 kolom asimetris (48/27/25), section dirender via
  registry + config (urutan, aktif, varian). Sumber data: mock (USE_MOCK) atau API.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useQuery, useInfiniteQuery } from '@tanstack/vue-query';
import { contentService } from '@/services/content.service';
import { useSeoMeta } from '@/composables/useSeoMeta';
import LoadMore from '@/components/ui/LoadMore.vue';

import HeroBreaking from './components/HeroBreaking.vue';
import LiveUpdates from './components/LiveUpdates.vue';
import StoryCard from './components/StoryCard.vue';
import RailModule from './components/RailModule.vue';
import OpinionItem from './components/OpinionItem.vue';
import VideoThumb from './components/VideoThumb.vue';
import PopularList from './components/PopularList.vue';
import AdSlotRenderer from '@/features/public/shared/AdSlotRenderer.vue';

import {
  USE_MOCK,
  getHomeMock,
  type MockStory,
  type SectionKey,
} from '@/features/public/data/homeSource';
import { useHomeConfig } from '@/features/public/data/useHomeConfig';
import { SECTION_REGISTRY, type SectionColumn } from './sectionRegistry';

useSeoMeta({ title: 'Beranda', description: 'Berita terkini dari seluruh dunia.' });

const { sections, variantOf } = useHomeConfig();

// ── Data: mock atau API ───────────────────────────────────────────
const mock = getHomeMock();

const { data: postsRes, isLoading } = useQuery({
  queryKey: ['public-home', 'post'],
  queryFn: () =>
    contentService
      .list({ type: 'post', status: 'published', sort: '-published_at', limit: 14 })
      .then((r) => r.data),
  staleTime: 60_000,
  enabled: !USE_MOCK,
});
const posts = computed<MockStory[]>(() => (postsRes.value ?? []) as MockStory[]);

const hero = computed(() => (USE_MOCK ? mock.hero : posts.value[0]));
const liveItems = computed(() => (USE_MOCK ? mock.liveUpdates : posts.value.slice(1, 5)));
const analysis = computed(() => (USE_MOCK ? mock.analysis : posts.value[5]));
const centerFeatured = computed(() => (USE_MOCK ? mock.centerFeatured : posts.value[6]));
const centerList = computed(() => (USE_MOCK ? mock.centerList : posts.value.slice(7, 13)));
const popular = computed(() => (USE_MOCK ? mock.popular : []));

const { data: videoRes } = useQuery({
  queryKey: ['public-home', 'video'],
  queryFn: () =>
    contentService
      .list({ type: 'video', status: 'published', sort: '-published_at', limit: 3 })
      .then((r) => r.data),
  retry: false,
  staleTime: 60_000,
  enabled: !USE_MOCK,
});
const videos = computed<MockStory[]>(() =>
  USE_MOCK ? mock.videos : ((videoRes.value ?? []) as MockStory[]),
);
const opinions = computed<MockStory[]>(() =>
  USE_MOCK ? mock.opinions : (posts.value.slice(13, 16) as MockStory[]),
);

// ── Section per kolom (sesuai urutan & aktif dari config) ─────────
function keysFor(column: SectionColumn): SectionKey[] {
  return sections.value
    .map((s) => s.key)
    .filter((k) => SECTION_REGISTRY[k].column === column);
}
const leftKeys = computed(() => keysFor('left'));
const centerKeys = computed(() => keysFor('center'));
const rightKeys = computed(() => keysFor('right'));
const fullKeys = computed(() => keysFor('full'));

// ── "Muat lebih" (hanya mode live; mock cukup section moreNews) ────
const { data: moreData, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['public-feed-more', 'post'],
  queryFn: ({ pageParam }) =>
    contentService.list({
      type: 'post',
      status: 'published',
      limit: 12,
      sort: '-published_at',
      cursor: pageParam,
    }),
  initialPageParam: null as string | null,
  getNextPageParam: (last) => last.meta?.next_cursor ?? undefined,
  enabled: !USE_MOCK,
});
const moreItems = computed<MockStory[]>(() => {
  if (USE_MOCK) return mock.centerList as MockStory[];
  return ((moreData.value?.pages.flatMap((p) => p.data) ?? []) as MockStory[]).slice(14);
});
</script>

<template>
  <div>
    <p v-if="isLoading && !USE_MOCK" :style="{ color: 'var(--color-pub-muted)' }">Memuat…</p>

    <div v-else>
      <!-- Grid 3 kolom asimetris: 48% / 27% / 25% (→ 2 → 1 saat menyempit) -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 lg:[grid-template-columns:48%_27%_25%]">
        <!-- ── Kolom kiri (48%) ── -->
        <section class="flex flex-col gap-5">
          <template v-for="key in leftKeys" :key="key">
            <HeroBreaking
              v-if="key === 'hero' && hero"
              :item="hero"
              :variant="variantOf('hero')"
            />
            <LiveUpdates v-else-if="key === 'live'" :items="liveItems" />
            <div
              v-else-if="key === 'analysis' && analysis"
              :style="{ borderTop: '1px solid var(--color-pub-line)' }"
            >
              <StoryCard :item="analysis" eyebrow="ANALYSIS" show-excerpt />
            </div>
          </template>
        </section>

        <!-- ── Kolom tengah (27%) ── -->
        <section class="flex flex-col">
          <template v-for="key in centerKeys" :key="key">
            <template v-if="key === 'centerFeed'">
              <StoryCard
                v-if="centerFeatured"
                :item="centerFeatured"
                :show-excerpt="variantOf('centerFeed') !== 'text-only'"
              />
              <div
                v-for="it in centerList"
                :key="it.id"
                :style="{ borderTop: '1px solid var(--color-pub-line)' }"
              >
                <StoryCard :item="it" :force-text-only="variantOf('centerFeed') === 'text-only'" />
              </div>
            </template>
          </template>
        </section>

        <!-- ── Rail kanan (25%) ── -->
        <aside class="flex flex-col gap-8 md:col-span-2 lg:col-span-1">
          <template v-for="key in rightKeys" :key="key">
            <RailModule v-if="key === 'videoRail' && videos.length" label="Video">
              <VideoThumb v-for="v in videos" :key="v.id" :item="v" />
            </RailModule>

            <RailModule v-else-if="key === 'opinionRail' && opinions.length" label="Opinion">
              <div
                v-for="(op, i) in opinions"
                :key="op.id"
                :style="i ? { borderTop: '1px solid var(--color-pub-line)' } : {}"
              >
                <OpinionItem :item="op" />
              </div>
            </RailModule>

            <RailModule v-else-if="key === 'popular' && popular.length" label="Most popular">
              <PopularList :items="popular" />
            </RailModule>
          </template>

          <!-- Iklan rail (admin-driven) -->
          <AdSlotRenderer position="post_sidebar_left" />
        </aside>
      </div>

      <!-- Iklan in-feed (leaderboard) di antara grid & "berita lainnya" -->
      <div class="mt-8 flex justify-center">
        <AdSlotRenderer position="in_post_below_title" />
      </div>

      <!-- ── Berita lainnya (full width) ── -->
      <div
        v-for="key in fullKeys"
        :key="key"
      >
        <div
          v-if="key === 'moreNews' && moreItems.length"
          class="mt-8 border-t pt-6"
          :style="{ borderColor: 'var(--color-pub-line)' }"
        >
          <h2 class="pub-eyebrow mb-4">Berita lainnya</h2>
          <div class="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            <div
              v-for="it in moreItems"
              :key="it.id"
              :style="{ borderTop: '1px solid var(--color-pub-line)' }"
            >
              <StoryCard :item="it" />
            </div>
          </div>
        </div>
      </div>

      <LoadMore
        v-if="!USE_MOCK"
        :has-more="!!hasNextPage"
        :loading="isFetchingNextPage"
        @more="fetchNextPage()"
      />
    </div>
  </div>
</template>
