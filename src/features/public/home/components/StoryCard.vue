<!--
  StoryCard.vue — pola item paling sering: kategori + judul kiri, thumbnail kanan.
  Varian teks-saja saat tak ada gambar. Hover: judul → crimson, thumb zoom halus.
  Dipisah divider 1px oleh induk (border-t), bukan kartu berbayang.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { ContentSummary } from '@/types/domain';
import { resolveFeaturedImage } from '@/lib/media';
import { relativeTime } from '@/lib/datetime';
import CategoryTag from './CategoryTag.vue';

const props = defineProps<{
  item: ContentSummary;
  /** Tampilkan eyebrow label kecil di atas judul (mis. "ANALYSIS"). */
  eyebrow?: string;
  /** Tampilkan excerpt (dek) di bawah judul. Default: false (padat). */
  showExcerpt?: boolean;
  /** Paksa varian teks-saja (sembunyikan thumbnail) — dipakai varian centerFeed. */
  forceTextOnly?: boolean;
  /** Sembunyikan label kategori (mis. saat eyebrow dipakai). */
  hideCategory?: boolean;
}>();

const loose = computed(() => props.item as unknown as Record<string, unknown>);

/** Backend feed belum tentu mengirim gambar; toleran terhadap field longgar. */
const thumbUrl = computed(() => {
  if (props.forceTextOnly) return '';
  return resolveFeaturedImage(loose.value.featured_image);
});

const category = computed(() => loose.value.category as string | undefined);
const categoryColor = computed(() => loose.value.category_color as string | undefined);
const meta = computed(() => relativeTime(props.item.published_at));
</script>

<template>
  <article class="group flex items-start gap-4 py-4">
    <div class="min-w-0 flex-1">
      <span v-if="eyebrow" class="pub-eyebrow mb-1.5 block">{{ eyebrow }}</span>
      <CategoryTag
        v-else-if="!hideCategory && category"
        :label="category"
        :color="categoryColor"
        class="mb-1.5"
      />
      <RouterLink
        :to="{ name: 'article', params: { id: item.id, slug: item.slug } }"
        class="pub-link-title block text-[19px] font-semibold leading-snug"
      >
        {{ item.title }}
      </RouterLink>
      <p
        v-if="showExcerpt && item.excerpt"
        class="mt-1.5 line-clamp-2 text-sm leading-relaxed"
        :style="{ fontFamily: 'var(--font-pub-serif)', color: 'var(--color-pub-muted)' }"
      >
        {{ item.excerpt }}
      </p>
      <span
        v-if="meta"
        class="mt-2 block text-xs"
        :style="{ color: 'var(--color-pub-muted)' }"
      >{{ meta }}</span>
    </div>

    <RouterLink
      v-if="thumbUrl"
      :to="{ name: 'article', params: { id: item.id, slug: item.slug } }"
      class="block flex-none overflow-hidden rounded"
      :style="{ width: '104px', height: '70px', backgroundColor: 'var(--color-pub-line)' }"
    >
      <img
        :src="thumbUrl"
        :alt="item.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </RouterLink>
  </article>
</template>
