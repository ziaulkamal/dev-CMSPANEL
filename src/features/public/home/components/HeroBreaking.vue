<!--
  HeroBreaking.vue — hero kolom kiri: foto besar + overlay blok CRIMSON di pojok
  bawah-kiri berisi label "BREAKING" + judul tebal. Varian tanpa foto: blok ink
  penuh dengan judul (graceful-degradation saat backend belum kirim gambar).
-->
<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { ContentSummary } from '@/types/domain';
import { resolveMediaUrl, pickMediaUrl } from '@/lib/media';

const props = defineProps<{
  item: ContentSummary;
  /** Label overlay (default "BREAKING"). */
  label?: string;
}>();

const imageUrl = computed(() => {
  const raw = pickMediaUrl((props.item as unknown as Record<string, unknown>).featured_image);
  return raw ? resolveMediaUrl(raw) : '';
});
</script>

<template>
  <RouterLink
    :to="{ name: 'article', params: { id: item.id, slug: item.slug } }"
    class="group relative block overflow-hidden"
    :style="{ backgroundColor: 'var(--color-pub-line)', aspectRatio: '16 / 10' }"
  >
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="item.title"
      class="h-full w-full object-cover"
      loading="eager"
    />
    <!-- Fallback tanpa foto: bidang ink agar overlay tetap terbaca. -->
    <div v-else class="h-full w-full" :style="{ backgroundColor: 'var(--color-pub-ink)' }"></div>

    <div
      class="absolute bottom-0 left-0 max-w-[80%] p-4 sm:p-5"
      :style="{ backgroundColor: 'var(--color-pub-crimson)' }"
    >
      <span class="block text-[11px] font-extrabold tracking-[0.12em] text-white">
        {{ label ?? 'BREAKING' }}
      </span>
      <h2 class="mt-1.5 text-2xl font-extrabold leading-tight text-white sm:text-[28px]">
        {{ item.title }}
      </h2>
    </div>
  </RouterLink>
</template>
