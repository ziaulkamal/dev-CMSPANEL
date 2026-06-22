<!--
  NewsCard.vue — kartu berita modern "gambar-atas": thumbnail 16:9 di atas, lalu
  kategori + judul + meta penulis·waktu di bawah. Dipakai grid "Berita per
  Kategori" (CategoryNews). Hover: judul → crimson, gambar zoom halus.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { UserRound } from '@lucide/vue';
import type { MockStory } from '@/features/public/data/homeSource';
import { resolveFeaturedImage } from '@/lib/media';
import { relativeTime } from '@/lib/datetime';
import CategoryTag from './CategoryTag.vue';

const props = defineProps<{ item: MockStory }>();

const thumbUrl = computed(() => resolveFeaturedImage(props.item.featured_image));
const meta = computed(() => relativeTime(props.item.published_at));

/** Author pertama (bila ada) untuk baris meta. */
const author = computed(() => props.item.authors?.[0]);
const authorName = computed(() => author.value?.display_name ?? '');
const authorAvatar = computed(() => author.value?.avatar ?? '');

const to = computed(() => ({
  name: 'article',
  params: { id: props.item.id, slug: props.item.slug },
}));
</script>

<template>
  <article
    class="group flex h-full flex-col overflow-hidden rounded-lg"
    :style="{ border: '1px solid var(--color-pub-line)', backgroundColor: 'var(--color-pub-paper)' }"
  >
    <!-- Thumbnail penuh 16:9 (zoom halus saat hover) -->
    <RouterLink
      v-if="thumbUrl"
      :to="to"
      class="block overflow-hidden"
      :style="{ aspectRatio: '16 / 9', backgroundColor: 'var(--color-pub-line)' }"
    >
      <img
        :src="thumbUrl"
        :alt="item.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </RouterLink>

    <div class="flex min-w-0 flex-1 flex-col p-4">
      <CategoryTag
        v-if="item.category"
        :label="item.category"
        :color="item.category_color"
        class="mb-1.5"
      />
      <RouterLink
        :to="to"
        class="pub-link-title block text-[17px] font-semibold leading-snug"
        :style="{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: '2',
          overflow: 'hidden',
        }"
      >
        {{ item.title }}
      </RouterLink>

      <!-- Baris meta: avatar penulis + nama · waktu (didorong ke bawah kartu) -->
      <div class="mt-auto pt-3">
        <div v-if="authorName" class="flex items-center gap-2">
          <span
            class="flex flex-none items-center justify-center overflow-hidden rounded-full"
            :style="{
              width: '24px',
              height: '24px',
              backgroundColor: 'var(--color-pub-canvas)',
              color: 'var(--color-pub-muted)',
            }"
          >
            <img
              v-if="authorAvatar"
              :src="authorAvatar"
              :alt="authorName"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <UserRound v-else :size="14" :stroke-width="1.75" aria-hidden="true" />
          </span>
          <span class="text-xs" :style="{ color: 'var(--color-pub-muted)' }">
            <span class="font-semibold" :style="{ color: 'var(--color-pub-ink)' }">{{ authorName }}</span>
            <span v-if="meta"> · {{ meta }}</span>
          </span>
        </div>
        <span
          v-else-if="meta"
          class="block text-xs"
          :style="{ color: 'var(--color-pub-muted)' }"
        >{{ meta }}</span>
      </div>
    </div>
  </article>
</template>
