<!--
  TrendingBar.vue — strip topik panas di bawah masthead: label "Trending" crimson
  + beberapa judul terbaru, dipisah garis rambut. Gagal diam bila feed kosong.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink } from 'vue-router';
import { contentService } from '@/services/content.service';
import { USE_MOCK, getHomeMock } from '@/features/public/data/homeSource';

const { data } = useQuery({
  queryKey: ['public-trending'],
  queryFn: () =>
    contentService
      .list({ type: 'post', status: 'published', sort: '-published_at', limit: 6 })
      .then((r) => r.data),
  retry: false,
  staleTime: 5 * 60_000,
  enabled: !USE_MOCK,
});

/** Mode mock: judul trending dari JSON (string). Mode live: judul dari feed. */
const items = computed<Array<{ id: string; slug: string; title: string }>>(() => {
  if (USE_MOCK) {
    return getHomeMock().trending.map((title, i) => ({ id: `t${i}`, slug: '', title }));
  }
  return (data.value ?? []).map((c) => ({ id: c.id, slug: c.slug, title: c.title }));
});
</script>

<template>
  <div
    v-if="items.length"
    :style="{ backgroundColor: 'var(--color-pub-paper)', borderBottom: '1px solid var(--color-pub-line)' }"
  >
    <div class="mx-auto flex max-w-[1300px] items-center gap-4 overflow-x-auto px-4 py-2.5 lg:px-6">
      <span class="flex-none text-xs font-extrabold uppercase tracking-[0.1em]" :style="{ color: 'var(--color-pub-crimson)' }">
        Trending
      </span>
      <template v-for="it in items" :key="it.id">
        <RouterLink
          v-if="it.slug"
          :to="{ name: 'article', params: { id: it.id, slug: it.slug } }"
          class="pub-link-title flex-none whitespace-nowrap text-xs font-medium"
          :style="{ color: 'var(--color-pub-muted)' }"
        >{{ it.title }}</RouterLink>
        <span
          v-else
          class="flex-none whitespace-nowrap text-xs font-medium"
          :style="{ color: 'var(--color-pub-muted)' }"
        >{{ it.title }}</span>
      </template>
    </div>
  </div>
</template>
