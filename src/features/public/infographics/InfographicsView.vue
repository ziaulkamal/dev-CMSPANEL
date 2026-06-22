<!--
  InfographicsView.vue — halaman Format Infografis (/infografis). Grid kartu potret
  9:16 (InfographicCard). Mock: pool `analysis`. Live: TODO filter konten kategori
  infografis menyusul.
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { getMockInfographics, type MockStory } from '@/features/public/data/homeSource';
import { useSeoMeta } from '@/composables/useSeoMeta';
import InfographicCard from '@/features/public/home/components/InfographicCard.vue';
import SectionHeader from '@/features/public/home/components/SectionHeader.vue';
import LoadMore from '@/components/ui/LoadMore.vue';

const all = computed<MockStory[]>(() => getMockInfographics());

const PAGE = 12;
const visible = ref(PAGE);
const shown = computed(() => all.value.slice(0, visible.value));
const hasMore = computed(() => visible.value < all.value.length);

useSeoMeta(() => ({
  title: 'Infografis',
  description: 'Kumpulan infografis dan visualisasi data.',
}));
</script>

<template>
  <div>
    <SectionHeader title="Infografis" accent="var(--color-pub-amber)" />

    <p
      v-if="all.length === 0"
      class="py-8 text-center text-sm"
      :style="{ color: 'var(--color-pub-muted)' }"
    >
      Belum ada infografis.
    </p>

    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <InfographicCard v-for="item in shown" :key="item.id" :item="item" />
    </div>

    <LoadMore :has-more="hasMore" @more="visible += PAGE" />
  </div>
</template>
