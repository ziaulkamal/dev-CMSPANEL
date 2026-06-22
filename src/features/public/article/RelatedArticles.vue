<!--
  RelatedArticles.vue — section "Artikel Terkait" di akhir detail berita.
  Grid kartu gambar-atas (NewsCard, reuse beranda): 6 item di desktop, 4 di mobile
  (item ke-5 & 6 disembunyikan <md). Sumber: kategori sama dari pool mock (induk).
-->
<script setup lang="ts">
import { computed } from 'vue';
import type { MockStory } from '@/features/public/data/homeSource';
import SectionHeader from '@/features/public/home/components/SectionHeader.vue';
import NewsCard from '@/features/public/home/components/NewsCard.vue';

const props = defineProps<{ items: MockStory[] }>();

/** Maksimum 6 kartu (mobile dibatasi ke 4 via class responsif). */
const visible = computed(() => props.items.slice(0, 6));
</script>

<template>
  <section v-if="visible.length" class="mt-12">
    <SectionHeader title="Artikel Terkait" accent="var(--color-pub-crimson)" />
    <div class="grid grid-cols-2 gap-6 lg:grid-cols-3">
      <!-- Item index ≥4 (kartu ke-5 & 6): sembunyi di mobile, tampil ≥md. -->
      <div
        v-for="(it, i) in visible"
        :key="it.id"
        :class="i >= 4 ? 'hidden md:block' : ''"
      >
        <NewsCard :item="it" />
      </div>
    </div>
  </section>
</template>
