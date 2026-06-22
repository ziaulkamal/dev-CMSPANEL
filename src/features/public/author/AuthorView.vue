<!--
  AuthorView.vue — halaman penulis (/penulis/:id). Header profil (avatar, nama, bio,
  tautan sosial) + grid artikelnya.
  Mode mock: data dari pool story. Mode live: profil dari authorService; daftar
  artikel masih disaring di klien karena backend belum punya filter ?author=
  (lihat TODOS arah CORE).
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { getMockByAuthor, type MockStory } from '@/features/public/data/homeSource';
import { USE_MOCK } from '@/features/public/data/homeSource';
import { authorService } from '@/services/author.service';
import { resolveMediaUrl } from '@/lib/media';
import { useSeoMeta } from '@/composables/useSeoMeta';
import NewsCard from '@/features/public/home/components/NewsCard.vue';
import LoadMore from '@/components/ui/LoadMore.vue';

const route = useRoute();
const id = computed(() => (route.params.id as string) ?? '');

const all = computed<MockStory[]>(() => getMockByAuthor(id.value));

// Mode live: profil penulis dari service (cocokkan id, atau slug nama).
const { data: authorsData } = useQuery({
  queryKey: ['public-authors'],
  queryFn: () => authorService.list(),
  retry: false,
  staleTime: 5 * 60_000,
  enabled: !USE_MOCK,
});
function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, '-');
}
const liveAuthor = computed(() => {
  const list = authorsData.value ?? [];
  return list.find((a) => a.id === id.value || slugify(a.display_name) === id.value);
});

/** Nama tampilan: live author → mock author story → de-slug dari :id. */
const mockAuthor = computed(() => all.value[0]?.authors?.[0]);
const name = computed(
  () =>
    liveAuthor.value?.display_name ||
    mockAuthor.value?.display_name ||
    id.value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
);
const avatar = computed(() => {
  if (liveAuthor.value?.avatar_media_id) return resolveMediaUrl(liveAuthor.value.avatar_media_id);
  return mockAuthor.value?.avatar ?? '';
});
const bio = computed(() => liveAuthor.value?.bio || mockAuthor.value?.bio || '');
const socialLinks = computed<Array<{ platform: string; url: string }>>(() =>
  Object.entries(liveAuthor.value?.social_links ?? {}).map(([platform, url]) => ({ platform, url })),
);
const initial = computed(() => (name.value.charAt(0) || '?').toUpperCase());

const PAGE = 12;
const visible = ref(PAGE);
watch(id, () => (visible.value = PAGE));

const shown = computed(() => all.value.slice(0, visible.value));
const hasMore = computed(() => visible.value < all.value.length);

useSeoMeta(() => ({
  title: `Penulis: ${name.value}`,
  description: `Artikel oleh ${name.value}.`,
}));
</script>

<template>
  <div>
    <header class="mb-6 flex items-center gap-4 border-b pb-5" :style="{ borderColor: 'var(--color-pub-line)' }">
      <span
        class="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-full text-2xl font-extrabold"
        :style="{ backgroundColor: 'var(--color-pub-canvas)', color: 'var(--color-pub-crimson)' }"
      >
        <img v-if="avatar" :src="avatar" :alt="name" class="h-full w-full object-cover" />
        <template v-else>{{ initial }}</template>
      </span>
      <div class="min-w-0">
        <h1 class="text-2xl font-extrabold" :style="{ color: 'var(--color-pub-ink)' }">{{ name }}</h1>
        <p v-if="bio" class="mt-1 text-sm leading-relaxed" :style="{ color: 'var(--color-pub-ink)' }">{{ bio }}</p>
        <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p class="text-sm" :style="{ color: 'var(--color-pub-muted)' }">{{ all.length }} artikel</p>
          <a
            v-for="s in socialLinks"
            :key="s.platform"
            :href="s.url"
            target="_blank"
            rel="noopener"
            class="text-sm font-medium capitalize hover:underline"
            :style="{ color: 'var(--color-pub-crimson)' }"
          >{{ s.platform }}</a>
        </div>
      </div>
    </header>

    <p
      v-if="all.length === 0"
      class="py-8 text-center text-sm"
      :style="{ color: 'var(--color-pub-muted)' }"
    >
      Belum ada artikel dari penulis ini.
    </p>

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <NewsCard v-for="item in shown" :key="item.id" :item="item" />
    </div>

    <LoadMore :has-more="hasMore" @more="visible += PAGE" />
  </div>
</template>
