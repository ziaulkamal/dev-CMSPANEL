<!-- src/layouts/PublicLayout.vue — shell segment publik bergaya newsroom. -->
<script setup lang="ts">
import { RouterView } from 'vue-router';
import TheMasthead from '@/features/public/shared/TheMasthead.vue';
import TrendingBar from '@/features/public/shared/TrendingBar.vue';
import PublicPopups from '@/features/public/shared/PublicPopups.vue';
import AdSlotRenderer from '@/features/public/shared/AdSlotRenderer.vue';
</script>

<template>
  <div class="public-theme flex min-h-full flex-col">
    <!-- Iklan floating top nav (admin-driven, gagal diam bila kosong) -->
    <AdSlotRenderer position="floating_top_nav" />

    <TheMasthead />
    <TrendingBar />

    <main class="mx-auto w-full max-w-[1300px] flex-1 px-4 py-8 lg:px-6">
      <RouterView />
    </main>

    <footer :style="{ backgroundColor: 'var(--color-pub-ink)' }">
      <div
        class="mx-auto flex max-w-[1300px] flex-wrap items-center justify-between gap-4 px-4 py-9 lg:px-6"
      >
        <span
          class="text-[11px] tracking-[0.1em]"
          :style="{ fontFamily: 'var(--font-pub-mono)', color: '#8a857c' }"
        >NEWSROOM · {{ new Date().getFullYear() }}</span>
        <span class="text-xs" :style="{ color: '#8a857c' }">
          Portal berita digital — dibangun dengan CMS
        </span>
      </div>
    </footer>

    <!-- Popup & flying carpet ad — aktif di seluruh halaman publik -->
    <PublicPopups />
    <AdSlotRenderer position="flying_carpet" />
    <AdSlotRenderer position="floating_bottom_timer" />
  </div>
</template>
