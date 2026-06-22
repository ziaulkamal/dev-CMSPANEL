<!--
  SectionHeader.vue — kepala section tegas: tick aksen (crimson/amber) + judul
  kapital + tautan "Lihat semua" opsional. Dipakai rail & blok konten.
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    /** Warna tick aksen. */
    accent?: string;
    /** Tampilkan tautan "Lihat semua". */
    seeAll?: boolean;
    seeAllHref?: string;
  }>(),
  { accent: 'var(--color-pub-amber)', seeAll: false, seeAllHref: '/' },
);
</script>

<template>
  <div class="mb-3 flex items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <span class="block" :style="{ width: '4px', height: '16px', backgroundColor: accent }"></span>
      <h3 class="text-xs font-bold uppercase tracking-[0.08em]" :style="{ color: 'var(--color-pub-muted)' }">
        {{ title }}
      </h3>
    </div>
    <a
      v-if="seeAll"
      :href="seeAllHref"
      class="text-[11px] font-semibold transition-opacity hover:opacity-70"
      :style="{ color: 'var(--color-pub-crimson)' }"
    >Lihat semua →</a>
  </div>
</template>
