<!--
  VideoThumb.vue — thumbnail video dengan badge durasi (ikon play + mm:ss) di
  pojok kanan-bawah. Durasi opsional dari meta konten (longgar).
-->
<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { ContentSummary } from '@/types/domain';
import { resolveFeaturedImage } from '@/lib/media';

const props = defineProps<{ item: ContentSummary }>();

const imageUrl = computed(() =>
  resolveFeaturedImage((props.item as unknown as Record<string, unknown>).featured_image),
);

/** Durasi (mm:ss) bila backend menaruhnya di meta longgar. */
const duration = computed(() => {
  const metas = (props.item as unknown as Record<string, unknown>).metas as
    | Record<string, string>
    | undefined;
  return metas?.duration ?? metas?.video_duration ?? '';
});
</script>

<template>
  <RouterLink
    :to="{ name: 'article', params: { id: item.id, slug: item.slug } }"
    class="group block py-3"
  >
    <span
      class="relative block overflow-hidden"
      :style="{ aspectRatio: '16 / 9', backgroundColor: 'var(--color-pub-line)' }"
    >
      <img v-if="imageUrl" :src="imageUrl" :alt="item.title" class="h-full w-full object-cover" loading="lazy" />
      <span
        class="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-white"
        :style="{ backgroundColor: 'rgba(0,0,0,0.8)' }"
      >
        <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden="true" fill="currentColor">
          <path d="M2 1l6 4-6 4z" />
        </svg>
        <template v-if="duration">{{ duration }}</template>
      </span>
    </span>
    <span class="pub-link-title mt-2 block text-sm font-semibold leading-snug">{{ item.title }}</span>
  </RouterLink>
</template>
