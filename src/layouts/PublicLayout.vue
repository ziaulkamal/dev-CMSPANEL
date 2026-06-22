<!-- src/layouts/PublicLayout.vue — shell segment publik bergaya newsroom. -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterView } from 'vue-router';
import TheMasthead from '@/features/public/shared/TheMasthead.vue';
import TrendingBar from '@/features/public/shared/TrendingBar.vue';
import PublicPopups from '@/features/public/shared/PublicPopups.vue';
import AdSlotRenderer from '@/features/public/shared/AdSlotRenderer.vue';
import TheFooter from '@/features/public/shared/TheFooter.vue';
import { usePublicTheme } from '@/composables/usePublicTheme';
import { useHomeConfig } from '@/features/public/data/useHomeConfig';
import { USE_MOCK, getHomeMock } from '@/features/public/data/homeSource';

const rootEl = ref<HTMLElement | null>(null);

// Warna tema publik dari config (live preview saat panel mengubahnya).
const { theme } = useHomeConfig();
usePublicTheme(rootEl, theme);

// Footer: mock saat USE_MOCK; live → fallback ringkas (sebelum ada settings footer).
const footer = computed(() => getHomeMock().footer);
</script>

<template>
  <div ref="rootEl" class="public-theme flex min-h-full flex-col">
    <!-- Iklan floating top nav (admin-driven, gagal diam bila kosong) -->
    <AdSlotRenderer position="floating_top_nav" />

    <TheMasthead />
    <TrendingBar />

    <main class="mx-auto w-full max-w-[1300px] flex-1 px-4 py-8 lg:px-6">
      <RouterView />
    </main>

    <TheFooter :data="footer" />

    <!-- Popup & overlay ad — aktif di seluruh halaman publik -->
    <PublicPopups v-if="!USE_MOCK" />
    <AdSlotRenderer position="flying_carpet" />
    <AdSlotRenderer position="floating_bottom_timer" />
  </div>
</template>
