<!--
  StoryCard.vue — pola item paling sering: judul di kiri, thumbnail kecil di kanan.
  Varian teks-saja saat tak ada gambar (sesuai analisis: "sebagian item teks-saja").
  Dipisah divider 1px oleh induk (border-t), bukan kartu berbayang.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { ContentSummary } from '@/types/domain';
import { resolveMediaUrl, pickMediaUrl } from '@/lib/media';
import { relativeTime } from '@/lib/datetime';

const props = defineProps<{
  item: ContentSummary;
  /** Tampilkan eyebrow label kecil di atas judul (mis. "ANALYSIS"). */
  eyebrow?: string;
  /** Tampilkan excerpt (dek) di bawah judul. Default: false (padat). */
  showExcerpt?: boolean;
}>();

/** Backend feed belum tentu mengirim gambar; toleran terhadap field longgar. */
const thumbUrl = computed(() => {
  const raw = pickMediaUrl((props.item as unknown as Record<string, unknown>).featured_image);
  return raw ? resolveMediaUrl(raw) : '';
});

const meta = computed(() => relativeTime(props.item.published_at));
</script>

<template>
  <article class="flex items-start gap-4 py-4">
    <div class="min-w-0 flex-1">
      <span v-if="eyebrow" class="pub-eyebrow mb-1.5 block">{{ eyebrow }}</span>
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
        class="mt-1.5 block text-xs"
        :style="{ color: 'var(--color-pub-muted)' }"
      >{{ meta }}</span>
    </div>

    <RouterLink
      v-if="thumbUrl"
      :to="{ name: 'article', params: { id: item.id, slug: item.slug } }"
      class="block flex-none overflow-hidden"
      :style="{ width: '92px', height: '62px', backgroundColor: 'var(--color-pub-line)' }"
    >
      <img :src="thumbUrl" :alt="item.title" class="h-full w-full object-cover" loading="lazy" />
    </RouterLink>
  </article>
</template>
