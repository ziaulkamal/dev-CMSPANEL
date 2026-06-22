<!--
  AuthorView.vue — halaman penulis (/penulis/:id). :id = slug nama (kebab) di mode
  mock. Header profil (avatar inisial, nama, jumlah artikel) + grid artikelnya.
  Live: TODO wiring authorService.list + filter konten per author.
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getMockByAuthor, type MockStory } from '@/features/public/data/homeSource';
import { useSeoMeta } from '@/composables/useSeoMeta';
import NewsCard from '@/features/public/home/components/NewsCard.vue';
import LoadMore from '@/components/ui/LoadMore.vue';

const route = useRoute();
const id = computed(() => (route.params.id as string) ?? '');

const all = computed<MockStory[]>(() => getMockByAuthor(id.value));

/** Nama tampilan: dari author story pertama, atau de-slug dari :id. */
const author = computed(() => all.value[0]?.authors?.[0]);
const name = computed(
  () => author.value?.display_name || id.value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
);
const avatar = computed(() => author.value?.avatar ?? '');
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
        <p class="mt-1 text-sm" :style="{ color: 'var(--color-pub-muted)' }">{{ all.length }} artikel</p>
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
