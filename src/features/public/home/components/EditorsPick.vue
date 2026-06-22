<!--
  EditorsPick.vue — "Pilihan Editor" untuk kolom kiri: card lembut berisi
  SectionHeader + daftar StoryCard (kategori + thumbnail), dipisah divider.
-->
<script setup lang="ts">
import { computed } from 'vue';
import type { MockStory } from '@/features/public/data/homeSource';
import SectionHeader from './SectionHeader.vue';
import StoryCard from './StoryCard.vue';

const props = withDefaults(defineProps<{ items: MockStory[]; title?: string }>(), {
  title: 'Pilihan Editor',
});

/** Maksimal 5 item, tanpa gambar (daftar ringkas). */
const top5 = computed(() => props.items.slice(0, 5));
</script>

<template>
  <section
    v-if="items.length"
    class="rounded-lg p-4"
    :style="{ border: '1px solid var(--color-pub-line)', backgroundColor: 'var(--color-pub-paper)' }"
  >
    <SectionHeader :title="title" accent="var(--color-pub-crimson)" see-all />
    <div class="flex flex-col">
      <div
        v-for="(it, i) in top5"
        :key="it.id"
        class="py-[5px]"
        :style="i ? { borderTop: '1px solid var(--color-pub-line)' } : {}"
      >
        <StoryCard
          :item="it"
          force-text-only
          padding-class="py-0"
          title-class="text-[19px]"
          raw-title-size
          :shrink-threshold="43"
          :clamp-title="2"
          date-beside-category
        />
      </div>
    </div>
  </section>
</template>
