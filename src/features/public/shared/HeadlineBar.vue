<!--
  HeadlineBar.vue — strip "Headline News" di bawah masthead: badge crimson pulsing
  di kiri (tidak ikut berjalan) + judul berjalan horizontal (marquee/running text).
  Track = 2 grup identik digeser -50% → loop infinite mulus; pause saat hover;
  dapat di-scroll manual bila reduce-motion. Gagal diam bila feed kosong.
  (Sebelumnya: TrendingBar.)
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink } from 'vue-router';
import { contentService } from '@/services/content.service';
import { USE_MOCK, getHomeMock } from '@/features/public/data/homeSource';

const { data } = useQuery({
  queryKey: ['public-trending'],
  queryFn: () =>
    contentService
      .list({ type: 'post', status: 'published', sort: '-published_at', limit: 6 })
      .then((r) => r.data),
  retry: false,
  staleTime: 5 * 60_000,
  enabled: !USE_MOCK,
});

/** Mode mock: judul dari JSON (string). Mode live: judul dari feed. */
const items = computed<Array<{ id: string; slug: string; title: string }>>(() => {
  if (USE_MOCK) {
    return getHomeMock().trending.map((title, i) => ({ id: `t${i}`, slug: '', title }));
  }
  return (data.value ?? []).map((c) => ({ id: c.id, slug: c.slug, title: c.title }));
});
</script>

<template>
  <div
    v-if="items.length"
    :style="{ backgroundColor: 'var(--color-pub-paper)', borderBottom: '1px solid var(--color-pub-line)' }"
  >
    <!-- Mobile: full-width tanpa padding kiri-kanan; desktop: boxed dgn padding. -->
    <div class="mx-auto flex max-w-[1140px] items-stretch px-0 md:px-4 lg:px-6">
      <!-- Badge "Headline News" (tetap, tidak berjalan) -->
      <span
        class="relative z-10 flex flex-none items-center gap-2 px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white"
        :style="{ backgroundColor: 'var(--color-pub-crimson)' }"
      >
        <span class="pub-live-dot pub-live-dot--on-crimson" aria-hidden="true"></span>
        Berita Utama
        <!-- Taji kanan (panah) agar badge terasa seperti label berita -->
        <span class="pub-headline-notch" aria-hidden="true"></span>
      </span>

      <!-- Viewport marquee: 2 grup identik bergeser -50% → loop tak terputus.
           Jeda saat hover. -->
      <div class="pub-marquee-viewport relative min-w-0 flex-1 overflow-hidden">
        <!-- Gradien tepi agar teks masuk/keluar halus -->
        <div class="pub-headline-fade pub-headline-fade--right" aria-hidden="true"></div>
        <div class="pub-marquee py-2.5" aria-label="Headline News">
          <!-- Grup ke-2 disembunyikan dari screen reader (duplikat visual). -->
          <div
            v-for="group in 2"
            :key="group"
            class="pub-marquee__group"
            :aria-hidden="group === 2 ? 'true' : undefined"
          >
            <template v-for="it in items" :key="`${group}-${it.id}`">
              <span class="pub-headline-sep" aria-hidden="true">●</span>
              <RouterLink
                v-if="it.slug"
                :to="{ name: 'article', params: { id: it.id, slug: it.slug } }"
                class="pub-link-title text-xs font-semibold"
                :style="{ color: 'var(--color-pub-ink)' }"
              >{{ it.title }}</RouterLink>
              <span
                v-else
                class="text-xs font-semibold"
                :style="{ color: 'var(--color-pub-ink)' }"
              >{{ it.title }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Titik pulsing di atas latar crimson (badge) — kontras putih. */
.pub-live-dot--on-crimson {
  background-color: #fff;
}

/* Pemisah antar-judul. */
.pub-headline-sep {
  margin: 0 14px;
  font-size: 6px;
  line-height: 1;
  color: color-mix(in srgb, var(--color-pub-crimson) 70%, transparent);
}

/* Taji segitiga di kanan badge → estetika label berita (ikut tinggi badge). */
.pub-headline-notch {
  position: absolute;
  right: -8px;
  top: 0;
  bottom: 0;
  width: 8px;
  background-color: var(--color-pub-crimson);
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

/* Gradien tepi kanan agar judul keluar memudar (bukan terpotong tajam). */
.pub-headline-fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40px;
  z-index: 5;
  pointer-events: none;
}
.pub-headline-fade--right {
  right: 0;
  background: linear-gradient(to right, transparent, var(--color-pub-paper));
}
</style>
