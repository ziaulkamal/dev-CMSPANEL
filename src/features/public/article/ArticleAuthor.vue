<!--
  ArticleAuthor.vue — identitas penulis di bawah judul: foto (fallback inisial),
  nama (tautan ke AuthorView), tanggal tayang + waktu relatif, bio singkat.
  Fokus identitas saja; metrik dipisah ke ArticleMeta agar rapi & simetris.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { formatDate, relativeTime } from '@/lib/datetime';

const props = defineProps<{
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  authorBio?: string;
  publishedAt?: string | null;
}>();

const authorSlug = computed(
  () => props.authorId || (props.authorName ?? '').toLowerCase().trim().replace(/\s+/g, '-'),
);
const initial = computed(() => (props.authorName?.charAt(0) || '?').toUpperCase());
</script>

<template>
  <div class="flex items-center gap-3">
    <RouterLink
      v-if="authorName"
      :to="{ name: 'author', params: { id: authorSlug } }"
      class="flex flex-none items-center justify-center overflow-hidden rounded-full"
      :style="{
        width: '46px',
        height: '46px',
        backgroundColor: 'var(--color-pub-canvas)',
        color: 'var(--color-pub-crimson)',
        border: '2px solid var(--color-pub-line)',
      }"
      :aria-label="authorName"
    >
      <img
        v-if="authorAvatar"
        :src="authorAvatar"
        :alt="authorName"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <span v-else class="text-base font-extrabold">{{ initial }}</span>
    </RouterLink>

    <div class="min-w-0">
      <RouterLink
        v-if="authorName"
        :to="{ name: 'author', params: { id: authorSlug } }"
        class="block truncate text-sm font-bold transition-colors hover:opacity-80"
        :style="{ color: 'var(--color-pub-ink)' }"
      >{{ authorName }}</RouterLink>
      <p class="text-xs" :style="{ color: 'var(--color-pub-muted)' }">
        <span v-if="publishedAt">{{ formatDate(publishedAt) }}</span>
        <span v-if="publishedAt"> · </span>
        <span>{{ relativeTime(publishedAt) }}</span>
      </p>
      <p
        v-if="authorBio"
        class="mt-0.5 hidden truncate text-xs sm:block"
        :style="{ color: 'var(--color-pub-muted)' }"
      >{{ authorBio }}</p>
    </div>
  </div>
</template>
