<!--
  HeroBreaking.vue — hero kolom kiri. Dua varian:
  - overlay: foto besar + blok crimson menumpuk di pojok bawah-kiri (default).
  - split: foto di atas, label + judul di bawah (lebih tenang).
  Varian tanpa foto: bidang ink agar tetap terbaca (graceful-degradation).
-->
<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { ContentSummary } from '@/types/domain';
import { resolveFeaturedImage } from '@/lib/media';

const props = withDefaults(
  defineProps<{
    item: ContentSummary;
    label?: string;
    variant?: string;
  }>(),
  { variant: 'overlay' },
);

const imageUrl = computed(() =>
  resolveFeaturedImage((props.item as unknown as Record<string, unknown>).featured_image),
);
const isSplit = computed(() => props.variant === 'split');
</script>

<template>
  <RouterLink
    :to="{ name: 'article', params: { id: item.id, slug: item.slug } }"
    class="group block"
  >
    <!-- Foto -->
    <span
      class="relative block overflow-hidden"
      :style="{ backgroundColor: 'var(--color-pub-line)', aspectRatio: '16 / 10' }"
    >
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="item.title"
        class="h-full w-full object-cover"
        loading="eager"
      />
      <span v-else class="block h-full w-full" :style="{ backgroundColor: 'var(--color-pub-ink)' }"></span>

      <!-- Overlay crimson (varian overlay) -->
      <span
        v-if="!isSplit"
        class="absolute bottom-0 left-0 max-w-[80%] p-4 sm:p-5"
        :style="{ backgroundColor: 'var(--color-pub-crimson)' }"
      >
        <span class="block text-[11px] font-extrabold tracking-[0.12em] text-white">
          {{ label ?? 'BREAKING' }}
        </span>
        <span class="mt-1.5 block text-2xl font-extrabold leading-tight text-white sm:text-[28px]">
          {{ item.title }}
        </span>
      </span>
    </span>

    <!-- Teks di bawah (varian split) -->
    <span v-if="isSplit" class="mt-3 block">
      <span class="pub-eyebrow block">{{ label ?? 'BREAKING' }}</span>
      <span class="mt-1.5 block text-2xl font-extrabold leading-tight sm:text-[28px]" :style="{ color: 'var(--color-pub-ink)' }">
        {{ item.title }}
      </span>
    </span>
  </RouterLink>
</template>
