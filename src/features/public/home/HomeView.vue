<!-- src/features/public/home/HomeView.vue — feed konten published, pagination cursor. -->
<script setup lang="ts">
import { computed } from 'vue';
import { useInfiniteQuery } from '@tanstack/vue-query';
import { RouterLink } from 'vue-router';
import { contentService } from '@/services/content.service';
import { useSeoMeta } from '@/composables/useSeoMeta';
import LoadMore from '@/components/ui/LoadMore.vue';

useSeoMeta({ title: 'Artikel Terbaru', description: 'Kumpulan artikel terbaru.' });

const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery({
    queryKey: ['public-feed', 'post'],
    queryFn: ({ pageParam }) =>
      contentService.list({
        type: 'post',
        status: 'published',
        limit: 20,
        sort: '-published_at',
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.meta?.next_cursor ?? undefined,
  });

/** Gabung semua halaman cursor menjadi satu daftar. */
const items = computed(() => data.value?.pages.flatMap((p) => p.data) ?? []);
</script>

<template>
  <section>
    <h1 class="mb-6 text-2xl font-bold">Artikel Terbaru</h1>

    <p v-if="isLoading" class="text-text-muted">Memuat…</p>
    <p v-else-if="isError" class="text-red-600">Gagal memuat konten.</p>
    <p v-else-if="!items.length" class="text-text-muted">Belum ada artikel.</p>

    <ul v-else class="flex flex-col gap-4">
      <li v-for="item in items" :key="item.id" class="rounded-lg border border-border bg-surface p-4">
        <RouterLink
          :to="{ name: 'article', params: { id: item.id, slug: item.slug } }"
          class="text-lg font-semibold hover:text-primary"
        >
          {{ item.title }}
        </RouterLink>
        <p class="mt-1 text-sm text-text-muted">{{ item.excerpt }}</p>
      </li>
    </ul>

    <LoadMore :has-more="!!hasNextPage" :loading="isFetchingNextPage" @more="fetchNextPage()" />
  </section>
</template>
