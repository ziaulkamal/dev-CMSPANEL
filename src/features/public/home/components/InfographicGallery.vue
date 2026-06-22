<!--
  InfographicGallery.vue — galeri infografis di kolom kiri. Header section (reuse
  SectionHeader) + carousel horizontal kartu potret 9:16 (InfographicCard). Tampil
  3 kartu sekaligus (sm+); sisanya digeser dengan scroll horizontal (snap).
-->
<script setup lang="ts">
import type { MockStory } from '@/features/public/data/homeSource';
import SectionHeader from './SectionHeader.vue';
import InfographicCard from './InfographicCard.vue';

withDefaults(
  defineProps<{ items: MockStory[]; title?: string }>(),
  { title: 'Infografis' },
);
</script>

<template>
  <section
    v-if="items.length"
    class="rounded-lg p-4"
    :style="{ border: '1px solid var(--color-pub-line)', backgroundColor: 'var(--color-pub-paper)' }"
    :aria-label="title"
  >
    <SectionHeader :title="title" accent="var(--color-pub-amber)" see-all />
    <!-- Carousel: scroll horizontal + snap. Selalu tampil 3 kartu. -->
    <ul
      role="list"
      class="ig-scroller -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1"
    >
      <li
        v-for="it in items"
        :key="it.id"
        class="ig-slide shrink-0 snap-start"
      >
        <InfographicCard :item="it" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* Lebar tiap kartu = 1/3 area (3 tampil), dikurangi proporsi gap (gap-3 = 12px,
   2 gap antar-3-kartu). Selalu 3 kartu terlihat (mobile, tablet, desktop). */
.ig-slide {
  width: calc((100% - 24px) / 3); /* 3 kartu tampil; 2 gap × 12px */
}

/* Scrollbar tipis & tidak mengganggu. */
.ig-scroller {
  scrollbar-width: thin;
  scrollbar-color: var(--color-pub-line) transparent;
}
.ig-scroller::-webkit-scrollbar {
  height: 6px;
}
.ig-scroller::-webkit-scrollbar-thumb {
  background-color: var(--color-pub-line);
  border-radius: 9999px;
}
</style>
