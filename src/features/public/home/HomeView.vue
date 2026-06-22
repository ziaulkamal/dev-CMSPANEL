<!--
  src/features/public/home/HomeView.vue
  Beranda wire-service: grid 3 kolom asimetris (48/27/25), section dirender via
  registry + config (urutan, aktif, varian). Sumber data: mock (USE_MOCK) atau API.
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronDown } from '@lucide/vue';
import { useQuery, useInfiniteQuery } from '@tanstack/vue-query';
import { contentService } from '@/services/content.service';
import { useSeoMeta } from '@/composables/useSeoMeta';
import LoadMore from '@/components/ui/LoadMore.vue';

import HeroBreaking from './components/HeroBreaking.vue';
import LiveUpdates from './components/LiveUpdates.vue';
import StoryCard from './components/StoryCard.vue';
import InfographicGallery from './components/InfographicGallery.vue';
import RailModule from './components/RailModule.vue';
import OpinionItem from './components/OpinionItem.vue';
import VideoThumb from './components/VideoThumb.vue';
import PopularList from './components/PopularList.vue';
import EditorsPick from './components/EditorsPick.vue';
import CategoryNews from './components/CategoryNews.vue';
import SectionHeader from './components/SectionHeader.vue';
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
const analysis = computed<MockStory[]>(() =>
  USE_MOCK ? mock.analysis : (posts.value.slice(4, 9) as MockStory[]),
);
const editorsPick = computed<MockStory[]>(() =>
  USE_MOCK ? mock.editorsPick : (posts.value.slice(9, 12) as MockStory[]),
);
// "Terbaru": daftar seragam — semua item sama (judul, deskripsi, author, waktu).
const centerItems = computed<MockStory[]>(() =>
  USE_MOCK ? (mock.centerList as MockStory[]) : (posts.value.slice(12, 19) as MockStory[]),
);

// ── Lazy-load "Terbaru": tombol memunculkan 5 berita tambahan tiap klik ──
const LATEST_STEP = 5;
const latestPool = computed<MockStory[]>(() => mock.latestMore as MockStory[]);
const visibleExtra = ref(0);
const extraItems = computed<MockStory[]>(() => latestPool.value.slice(0, visibleExtra.value));
const hasMoreLatest = computed(() => USE_MOCK && visibleExtra.value < latestPool.value.length);
function loadMoreLatest(): void {
  visibleExtra.value = Math.min(visibleExtra.value + LATEST_STEP, latestPool.value.length);
}
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
  if (USE_MOCK) return mock.categoryNews as MockStory[];
  return ((moreData.value?.pages.flatMap((p) => p.data) ?? []) as MockStory[]).slice(14);
});
</script>

<template>
  <div>
    <p v-if="isLoading && !USE_MOCK" :style="{ color: 'var(--color-pub-muted)' }">Memuat…</p>

    <div v-else>
      <!-- 2 kolom: area konten (kiri+tengah) | rail. Gap lega agar rail tak dempet. -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-10 lg:[grid-template-columns:72%_25%]">
        <!-- ── Area kiri+tengah (75%): sub-grid 2 kolom (≈48/27) ──
             Baris 1: [Hero+Live | Pilihan Editor]
             Baris 2: Infografis (span 2)
             Baris 3: Terbaru (span 2) -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 lg:[grid-template-columns:64%_36%]">
          <!-- Kolom kiri sub-grid: Hero + Live -->
          <section class="flex flex-col gap-6">
            <template v-for="key in leftKeys" :key="key">
              <HeroBreaking
                v-if="key === 'hero' && hero"
                :item="hero"
                :variant="variantOf('hero')"
              />
              <LiveUpdates v-else-if="key === 'live'" :items="liveItems" :limit="3" />
            </template>
          </section>

          <!-- Kolom kanan sub-grid: Pilihan Editor (sejajar top Hero di desktop) -->
          <section class="flex flex-col">
            <template v-for="key in centerKeys" :key="key">
              <EditorsPick v-if="key === 'editorsPick'" :items="editorsPick" />
            </template>
          </section>

          <!-- Infografis: span 2 kolom (selebar kiri+tengah) -->
          <InfographicGallery
            v-if="leftKeys.includes('analysis')"
            :items="analysis"
            title="Infografis"
            class="md:col-span-2"
          />

          <!-- Terbaru: span 2 kolom (selebar kiri+tengah) -->
          <div
            v-if="leftKeys.includes('centerFeed')"
            class="rounded-lg px-5 pt-4 pb-5 md:col-span-2"
            :style="{ border: '1px solid var(--color-pub-line)', backgroundColor: 'var(--color-pub-paper)' }"
          >
            <SectionHeader title="Terbaru" accent="var(--color-pub-crimson)" see-all />
            <!-- Daftar baris memanjang seragam: thumbnail kiri + judul, deskripsi,
                 author, dan waktu tayang. Semua item sama (tanpa item utama). -->
            <div class="flex flex-col">
              <!-- Daftar utama + lazy-load (extraItems) digabung: divider seragam,
                   baris tambahan muncul mulus dengan animasi reveal. -->
              <div
                v-for="(it, i) in [...centerItems, ...extraItems]"
                :key="it.id"
                class="pub-reveal"
                :style="i > 0 ? { borderTop: '1px solid var(--color-pub-line)' } : undefined"
              >
                <StoryCard
                  :item="it"
                  thumb-left
                  thumb-size="lg"
                  thumb-fill
                  show-author
                  show-stats
                  :clamp-title="2"
                  :excerpt-lines="2"
                  title-class="text-[23px]"
                  padding-class="py-5"
                  :show-excerpt="variantOf('centerFeed') !== 'text-only'"
                  :force-text-only="variantOf('centerFeed') === 'text-only'"
                />
              </div>
            </div>
            <!-- Footer: tombol "muat lebih" (lazy-load) atau tautan arsip saat habis -->
            <div
              class="mt-5 flex flex-col items-center gap-2 pt-5"
              :style="{ borderTop: '1px solid var(--color-pub-line)' }"
            >
              <button
                v-if="hasMoreLatest"
                type="button"
                class="pub-loadmore"
                @click="loadMoreLatest"
              >
                Muat 5 berita lagi
                <ChevronDown class="pub-loadmore__icon" :size="16" aria-hidden="true" />
              </button>
              <a v-else href="/" class="pub-archive-link">
                Lihat semua berita terbaru
                <span class="pub-archive-link__arrow" aria-hidden="true">→</span>
              </a>
              <span
                v-if="USE_MOCK && extraItems.length"
                class="text-[11px]"
                :style="{ color: 'var(--color-pub-muted)' }"
              >Menampilkan {{ centerItems.length + extraItems.length }} dari {{ centerItems.length + latestPool.length }} berita</span>
            </div>
          </div>
        </div>

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

            <!-- Most popular: menempel (sticky) saat scroll di desktop -->
            <div v-else-if="key === 'popular' && popular.length" class="lg:sticky lg:top-6">
              <RailModule label="Most popular">
                <PopularList :items="popular" />
              </RailModule>
            </div>
          </template>

          <!-- Iklan rail (admin-driven) -->
          <AdSlotRenderer position="post_sidebar_left" />
        </aside>
      </div>

      <!-- Iklan in-feed (leaderboard) di antara grid & "berita lainnya" -->
      <div class="mt-8 flex justify-center">
        <AdSlotRenderer position="in_post_below_title" />
      </div>

      <!-- ── Berita per Kategori (full width, kartu grid) ── -->
      <div v-for="key in fullKeys" :key="key">
        <CategoryNews
          v-if="key === 'moreNews'"
          :items="moreItems"
          :per-category="4"
        />
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
