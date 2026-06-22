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
    <a v-if="seeAll" :href="seeAllHref" class="pub-seeall">
      Lihat semua
      <span class="pub-seeall__arrow" aria-hidden="true">→</span>
    </a>
  </div>
</template>

<style scoped>
/* Tombol-pill "Lihat semua": garis crimson tipis → terisi penuh saat hover. */
.pub-seeall {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  color: var(--color-pub-crimson);
  border: 1px solid color-mix(in srgb, var(--color-pub-crimson) 35%, transparent);
  transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
}
.pub-seeall:hover {
  background-color: var(--color-pub-crimson);
  border-color: var(--color-pub-crimson);
  color: #fff;
}
.pub-seeall__arrow {
  transition: transform 200ms ease;
}
.pub-seeall:hover .pub-seeall__arrow {
  transform: translateX(2px);
}
</style>
