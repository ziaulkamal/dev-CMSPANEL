<!-- src/layouts/PublicLayout.vue — shell segment publik bergaya newsroom. -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import TheMasthead from '@/features/public/shared/TheMasthead.vue';
import HeadlineBar from '@/features/public/shared/HeadlineBar.vue';
import SecondaryNav from '@/features/public/shared/SecondaryNav.vue';
import PublicBreadcrumbs from '@/features/public/shared/PublicBreadcrumbs.vue';
import BottomNav from '@/features/public/shared/BottomNav.vue';
import PublicPopups from '@/features/public/shared/PublicPopups.vue';
import AdSlotRenderer from '@/features/public/shared/AdSlotRenderer.vue';
import TheFooter from '@/features/public/shared/TheFooter.vue';
import SearchOverlay from '@/features/public/search/SearchOverlay.vue';
import MainMenuSheet from '@/features/public/shared/MainMenuSheet.vue';
import { usePublicTheme } from '@/composables/usePublicTheme';
import { useHomeConfig } from '@/features/public/data/useHomeConfig';
import { useBreadcrumbs } from '@/features/public/shared/useBreadcrumbs';
import { USE_MOCK, getHomeMock } from '@/features/public/data/homeSource';

const rootEl = ref<HTMLElement | null>(null);

// Warna tema publik dari config (live preview saat panel mengubahnya).
const { theme } = useHomeConfig();
usePublicTheme(rootEl, theme);

// Footer: mock saat USE_MOCK; live → fallback ringkas (sebelum ada settings footer).
const footer = computed(() => getHomeMock().footer);

// Menu utama mobile sebagai bottom sheet (dibuka dari BottomNav).
const menuOpen = ref(false);

// Breadcrumb: reset tiap pindah rute (halaman yang butuh akan men-set ulang).
const route = useRoute();
const { clear: clearBreadcrumbs } = useBreadcrumbs();
watch(() => route.fullPath, () => clearBreadcrumbs());
</script>

<template>
  <div ref="rootEl" class="public-theme flex min-h-full flex-col">
    <!-- Iklan floating top nav (admin-driven, gagal diam bila kosong).
         Mobile: kreatif terpisah (floating_top_nav_mobile), tinggi tetap 300px,
         lebar penuh layar (gambar di-cover). Desktop: leaderboard natural. -->
    <div class="block h-[300px] w-full overflow-hidden md:hidden">
      <AdSlotRenderer
        position="floating_top_nav_mobile"
        class="h-full [&_a]:block [&_a]:h-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
      />
    </div>
    <div class="hidden md:block">
      <AdSlotRenderer position="floating_top_nav" />
    </div>

    <!-- Masthead → Headline News (marquee) → menu tambahan (scroll): BAR full-width,
         isi di-center oleh container internal. -->
    <TheMasthead />
    <HeadlineBar />
    <SecondaryNav />

    <!-- Breadcrumb: band full-width terpisah dari kartu konten (di atas <main>). -->
    <PublicBreadcrumbs />

    <!-- Area konten: boxed ~1140px, kartu putih di atas kanvas abu (gaya media Indonesia). -->
    <main
      class="mx-auto mb-6 mt-4 w-full max-w-[1140px] flex-1 px-4 py-8 lg:px-8"
      :style="{ backgroundColor: 'var(--color-pub-paper)', boxShadow: 'var(--shadow-sm)' }"
    >
      <RouterView />
    </main>

    <!-- Footer: bar full-width; pb ekstra di mobile agar isi tak tertutup BottomNav. -->
    <TheFooter :data="footer" class="pb-[72px] md:pb-0" />

    <!-- Navigasi bawah ala app Android (mobile only). -->
    <BottomNav @open-menu="menuOpen = true" />

    <!-- Menu utama mobile (bottom sheet, naik dari bawah). -->
    <MainMenuSheet v-model="menuOpen" />

    <!-- Overlay pencarian (dipicu dari Masthead/BottomNav). -->
    <SearchOverlay />

    <!-- Popup & overlay ad — aktif di seluruh halaman publik -->
    <PublicPopups v-if="!USE_MOCK" />
    <AdSlotRenderer position="flying_carpet" />
    <AdSlotRenderer position="floating_bottom_timer" />
  </div>
</template>
