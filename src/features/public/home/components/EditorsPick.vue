<!--
  EditorsPick.vue — "Pilihan Editor" untuk kolom kiri: card lembut berisi
  SectionHeader + daftar StoryCard (kategori + thumbnail), dipisah divider.
-->
<script setup lang="ts">
import { computed } from 'vue';
import type { MockStory } from '@/features/public/data/homeSource';
import SectionHeader from './SectionHeader.vue';
import StoryCard from './StoryCard.vue';

const props = defineProps<{ items: MockStory[] }>();

/** Maksimal 5 item, tanpa gambar (daftar ringkas). */
const top5 = computed(() => props.items.slice(0, 5));
</script>

<template>
  <section
    v-if="items.length"
    class="rounded-lg p-4"
    :style="{ border: '1px solid var(--color-pub-line)', backgroundColor: 'var(--color-pub-paper)' }"
  >
    <SectionHeader title="Pilihan Editor" accent="var(--color-pub-crimson)" see-all />
    <div class="-my-2 flex flex-col">
      <div
        v-for="(it, i) in top5"
        :key="it.id"
        :style="i ? { borderTop: '1px solid var(--color-pub-line)' } : {}"
      >
        <StoryCard :item="it" force-text-only />
      </div>
    </div>
  </section>
</template>
