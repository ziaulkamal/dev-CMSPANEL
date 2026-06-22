<!-- src/features/public/article/ArticleView.vue — detail artikel + meta SEO + komentar. -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { contentService } from '@/services/content.service';
import { commentService } from '@/services/comment.service';
import { useSeoMeta } from '@/composables/useSeoMeta';
import CommentList from './CommentList.vue';
import CommentForm from './CommentForm.vue';

const route = useRoute();
const id = computed(() => route.params.id as string);

const { data: content, isLoading, isError } = useQuery({
  queryKey: ['content', id],
  queryFn: () => contentService.detail(id.value),
});

const { data: meta } = useQuery({
  queryKey: ['content-meta', id],
  queryFn: () => contentService.meta(id.value),
});

const { data: comments } = useQuery({
  queryKey: ['comments', id],
  queryFn: () => commentService.listForContent(id.value),
});

/** SEO: utamakan meta khusus, fallback ke field konten. */
useSeoMeta(() => ({
  title: meta.value?.seo_title || content.value?.title,
  description: meta.value?.seo_description || content.value?.excerpt,
  image: meta.value?.og_image,
}));
</script>

<template>
  <p v-if="isLoading" class="text-text-muted">Memuat…</p>
  <p v-else-if="isError || !content" class="text-red-600">Artikel tidak ditemukan.</p>

  <article v-else>
    <h1 class="text-3xl font-bold">{{ content.title }}</h1>
    <p v-if="content.published_at" class="mt-2 text-sm text-text-muted">
      {{ new Date(content.published_at).toLocaleDateString('id-ID') }}
    </p>

    <!-- body disanitasi di server (lihat FRONTEND-API.md). -->
    <div class="prose mt-6 max-w-none" v-html="content.body" />

    <section class="mt-12">
      <h2 class="mb-4 text-xl font-semibold">Komentar</h2>
      <CommentList :comments="comments ?? []" />
      <div class="mt-6 rounded-lg border border-border bg-surface p-5">
        <h3 class="mb-3 text-base font-medium">Tinggalkan komentar</h3>
        <CommentForm :content-id="id" />
      </div>
    </section>
  </article>
</template>

<style>
/* Render gambar konten (figure.rte-img) sesuai preset ukuran + caption. */
.prose figure.rte-img { margin: 1.4em 0; }
.prose figure.rte-img img { display: block; width: 100%; height: auto; border-radius: 8px; }
.prose figure.rte-img--small { width: 35%; }
.prose figure.rte-img--large { width: 70%; }
.prose figure.rte-img--full { width: 100%; }
/* Posisi (align blok) */
.prose figure.rte-img--align-left { margin-left: 0; margin-right: auto; }
.prose figure.rte-img--align-center { margin-left: auto; margin-right: auto; }
.prose figure.rte-img--align-right { margin-left: auto; margin-right: 0; }
.prose figure.rte-img--align-center figcaption { text-align: center; }
.prose figure.rte-img--align-right figcaption { text-align: right; }
.prose figure.rte-img figcaption {
  margin-top: 6px;
  font-size: 0.85em;
  color: var(--color-text-muted);
  font-style: italic;
  line-height: 1.4;
}
</style>
