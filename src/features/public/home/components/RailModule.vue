<!--
  RailModule.vue — modul rail kanan dibungkus card lembut: SectionHeader (tick
  amber + label kapital + "Lihat semua") lalu isi via slot.
-->
<script setup lang="ts">
import SectionHeader from './SectionHeader.vue';

withDefaults(
  defineProps<{ label: string; accent?: string; seeAll?: boolean }>(),
  { accent: 'var(--color-pub-amber)', seeAll: true },
);
</script>

<template>
  <section
    class="rounded-lg p-4"
    :style="{ border: '1px solid var(--color-pub-line)', backgroundColor: 'var(--color-pub-paper)' }"
  >
    <SectionHeader :title="label" :accent="accent" :see-all="seeAll" />
    <div class="flex flex-col">
      <slot />
    </div>
  </section>
</template>
