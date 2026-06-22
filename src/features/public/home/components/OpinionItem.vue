<!--
  OpinionItem.vue — item opini: headshot bulat penulis + judul + byline.
  Avatar penulis belum tentu ada di feed → fallback inisial pada lingkaran abu.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { ContentSummary } from '@/types/domain';
import { resolveMediaUrl, pickMediaUrl } from '@/lib/media';

const props = defineProps<{ item: ContentSummary }>();

/** Penulis pertama (bila feed menyertakannya secara longgar). */
const author = computed(
  () =>
    (props.item as unknown as Record<string, unknown>).authors as
      | Array<Record<string, unknown>>
      | undefined,
);
const byline = computed(() => {
  const a = author.value?.[0];
  return (a?.display_name as string) ?? '';
});
const avatarUrl = computed(() => {
  const a = author.value?.[0];
  const raw = a ? pickMediaUrl(a.avatar) : '';
  return raw ? resolveMediaUrl(raw) : '';
});
const initial = computed(() => byline.value.trim().charAt(0).toUpperCase() || '·');
</script>

<template>
  <RouterLink
    :to="{ name: 'article', params: { id: item.id, slug: item.slug } }"
    class="group flex items-center gap-3 py-3"
  >
    <span
      class="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-full text-sm font-bold"
      :style="{ backgroundColor: 'var(--color-pub-line)', color: 'var(--color-pub-muted)' }"
    >
      <img v-if="avatarUrl" :src="avatarUrl" :alt="byline" class="h-full w-full object-cover" loading="lazy" />
      <template v-else>{{ initial }}</template>
    </span>
    <span class="min-w-0">
      <span class="pub-link-title block text-sm font-semibold leading-snug">{{ item.title }}</span>
      <span v-if="byline" class="mt-0.5 block text-xs" :style="{ color: 'var(--color-pub-muted)' }">
        {{ byline }}
      </span>
    </span>
  </RouterLink>
</template>
