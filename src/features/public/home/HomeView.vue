<!--
  src/features/public/home/HomeView.vue
  Beranda bergaya wire-service: grid 3 kolom asimetris (48% / 27% / 25%), tersusun
  OTOMATIS dari feed konten published. Kiri = hero + live updates + analysis,
  tengah = featured + daftar story, kanan = rail modular (video/opini).
  Graceful-degradation: tetap rapi tanpa gambar/kategori dari backend.
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
import AdSlotRenderer from '@/features/public/shared/AdSlotRenderer.vue';

useSeoMeta({ title: 'Beranda', description: 'Berita terkini dari seluruh dunia.' });

/** Feed utama: post terbaru → dibagi ke hero / live / story. */
const { data: postsRes, isLoading } = useQuery({
  queryKey: ['public-home', 'post'],
  queryFn: () =>
    contentService
      .list({ type: 'post', status: 'published', sort: '-published_at', limit: 14 })
      .then((r) => r.data),
  staleTime: 60_000,
});
const posts = computed(() => postsRes.value ?? []);

const hero = computed(() => posts.value[0]);
const liveItems = computed(() => posts.value.slice(1, 5));
const analysis = computed(() => posts.value[5]);
const centerFeatured = computed(() => posts.value[6]);
const centerList = computed(() => posts.value.slice(7, 13));

/** Rail kanan: video (fase 1 — query per type; kategori menyusul saat BE dukung ?term=). */
const { data: videoRes } = useQuery({
  queryKey: ['public-home', 'video'],
  queryFn: () =>
    contentService
      .list({ type: 'video', status: 'published', sort: '-published_at', limit: 3 })
      .then((r) => r.data),
  retry: false,
  staleTime: 60_000,
});
const videos = computed(() => videoRes.value ?? []);

/** Opini diambil dari sisa feed post (konvensi; ganti ke ?term=opinion di fase 2). */
const opinions = computed(() => posts.value.slice(13, 16));

/** "Muat lebih" di bawah grid — pertahankan pola infinite query yang sudah ada. */
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
});
/** Lewati 14 item pertama (sudah tampil di grid) agar tak duplikat. */
const moreItems = computed(() =>
  (moreData.value?.pages.flatMap((p) => p.data) ?? []).slice(14),
);
</script>

<template>
  <div>
    <p v-if="isLoading" :style="{ color: 'var(--color-pub-muted)' }">Memuat…</p>
    <p v-else-if="!posts.length" :style="{ color: 'var(--color-pub-muted)' }">Belum ada berita.</p>

    <!-- Grid 3 kolom asimetris: 48% / 27% / 25% (→ 2 → 1 saat menyempit) -->
    <div v-else>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 lg:[grid-template-columns:48%_27%_25%]">
        <!-- ── Kolom kiri (48%) ── -->
        <section class="flex flex-col gap-5">
          <HeroBreaking v-if="hero" :item="hero" />
          <LiveUpdates :items="liveItems" />
          <div v-if="analysis" :style="{ borderTop: '1px solid var(--color-pub-line)' }">
            <StoryCard :item="analysis" eyebrow="ANALYSIS" show-excerpt />
          </div>
        </section>

        <!-- ── Kolom tengah (27%) ── -->
        <section class="flex flex-col">
          <StoryCard v-if="centerFeatured" :item="centerFeatured" show-excerpt />
          <div
            v-for="it in centerList"
            :key="it.id"
            :style="{ borderTop: '1px solid var(--color-pub-line)' }"
          >
            <StoryCard :item="it" />
          </div>
        </section>

        <!-- ── Rail kanan (25%) ── -->
        <aside class="flex flex-col gap-8 md:col-span-2 lg:col-span-1">
          <RailModule v-if="videos.length" label="Video">
            <VideoThumb v-for="v in videos" :key="v.id" :item="v" />
          </RailModule>

          <RailModule v-if="opinions.length" label="Opinion">
            <div
              v-for="(op, i) in opinions"
              :key="op.id"
              :style="i ? { borderTop: '1px solid var(--color-pub-line)' } : {}"
            >
              <OpinionItem :item="op" />
            </div>
          </RailModule>

          <!-- Iklan rail (admin-driven) -->
          <AdSlotRenderer position="post_sidebar_left" />
        </aside>
      </div>
    </div>

    <!-- Muat lebih banyak -->
    <div
      v-if="moreItems.length"
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

    <LoadMore :has-more="!!hasNextPage" :loading="isFetchingNextPage" @more="fetchNextPage()" />
  </div>
</template>
