<!--
  CategoryTag.vue — label kategori kecil berwarna (mis. DUNIA, EKONOMI) untuk
  ditempel di atas judul berita. Warna dari item (category_color) atau crimson.
-->
<script setup lang="ts">
withDefaults(
  defineProps<{ label?: string; color?: string }>(),
  { color: 'var(--color-pub-crimson)' },
);
</script>

<template>
  <span
    v-if="label"
    class="inline-block text-[10px] font-extrabold uppercase tracking-[0.1em]"
    :style="{ color: color || 'var(--color-pub-crimson)' }"
  >{{ label }}</span>
</template>
