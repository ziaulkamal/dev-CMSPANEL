<!--
  InfographicCard.vue — kartu infografis potret 9:16. Judul putih overlay di dalam
  gambar dengan scrim gradient gelap dari bawah. Hover: foto zoom halus. Tanpa foto:
  bidang ink agar judul tetap terbaca (graceful-degradation), konsisten HeroBreaking.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { ContentSummary } from '@/types/domain';
import { resolveFeaturedImage } from '@/lib/media';

const props = defineProps<{ item: ContentSummary }>();

const loose = computed(() => props.item as unknown as Record<string, unknown>);
const imageUrl = computed(() => resolveFeaturedImage(loose.value.featured_image));
const category = computed(() => loose.value.category as string | undefined);
const categoryColor = computed(() => loose.value.category_color as string | undefined);
</script>

<template>
  <article class="ig-card group">
    <RouterLink
      :to="{ name: 'article', params: { id: item.id, slug: item.slug } }"
      class="relative block overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      :style="{ outlineColor: 'var(--color-pub-crimson)' }"
      :aria-label="item.title"
    >
      <figure class="relative block aspect-[9/16] w-full" :style="{ backgroundColor: 'var(--color-pub-line)' }">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="item.title"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <span v-else class="block h-full w-full" :style="{ backgroundColor: 'var(--color-pub-ink)' }"></span>

        <!-- Scrim gradient gelap dari bawah -->
        <span class="pointer-events-none absolute inset-0" :style="{ background: 'var(--ig-scrim)' }"></span>

        <!-- Judul overlay di dalam gambar -->
        <figcaption class="absolute inset-x-0 bottom-0 p-2 sm:p-3 lg:p-4">
          <span
            v-if="category"
            class="mb-1 inline-block text-[9px] font-extrabold uppercase tracking-[0.1em] sm:text-[10px]"
            :style="{ color: categoryColor || 'var(--color-pub-amber)' }"
          >{{ category }}</span>
          <h3
            class="line-clamp-3 text-[13px] font-extrabold leading-tight text-white sm:text-[15px] lg:text-[17px]"
            :style="{ fontFamily: 'var(--font-pub-sans)' }"
          >
            {{ item.title }}
          </h3>
        </figcaption>
      </figure>
    </RouterLink>
  </article>
</template>

<style scoped>
.ig-card {
  --ig-scrim: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(0, 0, 0, 0.35) 45%,
    transparent 75%
  );
}
</style>
