<!-- src/features/public/article/ArticleView.vue — detail artikel + meta byline/metrik + share rail + komentar modern. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { contentService } from '@/services/content.service';
import { commentService } from '@/services/comment.service';
import { useSeoMeta } from '@/composables/useSeoMeta';
import {
  USE_MOCK,
  getMockStory,
  getMockComments,
  getHomeMock,
  getMockByCategory,
  getMockStoryPool,
} from '@/features/public/data/homeSource';
import type { UiComment } from './commentTypes';
import type { MockStory } from '@/features/public/data/homeSource';
import { useBreadcrumbs, type Crumb } from '@/features/public/shared/useBreadcrumbs';
import ArticleAuthor from './ArticleAuthor.vue';
import ArticleMeta from './ArticleMeta.vue';
import ArticleTags from './ArticleTags.vue';
import ShareRail from './ShareRail.vue';
import RelatedArticles from './RelatedArticles.vue';
import CommentList from './CommentList.vue';
import CommentForm from './CommentForm.vue';
import RailModule from '@/features/public/home/components/RailModule.vue';
import PopularList from '@/features/public/home/components/PopularList.vue';
import AdSlotRenderer from '@/features/public/shared/AdSlotRenderer.vue';

const route = useRoute();
const id = computed(() => route.params.id as string);

// ── Konten ──────────────────────────────────────────────────────────
const mockStory = computed(() => (USE_MOCK ? getMockStory(id.value) : undefined));

const { data: liveContent, isLoading, isError } = useQuery({
  queryKey: ['content', id],
  queryFn: () => contentService.detail(id.value),
  enabled: computed(() => !USE_MOCK),
});

const { data: liveMeta } = useQuery({
  queryKey: ['content-meta', id],
  queryFn: () => contentService.meta(id.value),
  enabled: computed(() => !USE_MOCK),
});

const content = computed(() => (USE_MOCK ? mockStory.value : liveContent.value));
const loading = computed(() => (USE_MOCK ? false : isLoading.value));
const errored = computed(() => (USE_MOCK ? !mockStory.value : isError.value || !liveContent.value));

// Cast longgar agar field MockStory (kategori/tag/author kaya) bisa dibaca di
// kedua mode tanpa menyentuh tipe domain Content.
const story = computed(() => content.value as MockStory | undefined);
const author = computed(() => story.value?.authors?.[0]);
const authorName = computed(() => author.value?.display_name ?? '');
const category = computed(() => story.value?.category ?? '');
const categorySlug = computed(() => story.value?.category_slug ?? '');
const categoryColor = computed(() => story.value?.category_color || 'var(--color-pub-crimson)');
const tags = computed(() => story.value?.tags ?? []);

// ── Artikel Terkait & Rail (mode mock) ──────────────────────────────
// Terkait: kategori sama, buang artikel ini; lengkapi dari pool terbaru bila <6.
const relatedItems = computed<MockStory[]>(() => {
  if (!USE_MOCK) return [];
  const slug = categorySlug.value || category.value;
  const sameCat = getMockByCategory(slug).filter((s) => s.id !== id.value);
  if (sameCat.length >= 6) return sameCat.slice(0, 6);
  const seen = new Set([id.value, ...sameCat.map((s) => s.id)]);
  const filler = getMockStoryPool().filter((s) => !seen.has(s.id));
  return [...sameCat, ...filler].slice(0, 6);
});

// Most popular + Terbaru ringkas untuk rail (reuse data beranda).
const popular = computed(() => (USE_MOCK ? getHomeMock().popular : []));
const railLatest = computed<MockStory[]>(() =>
  USE_MOCK ? getMockStoryPool().filter((s) => s.id !== id.value).slice(0, 5) : [],
);

const bodyHtml = computed(
  () =>
    (content.value as { body?: string } | undefined)?.body ||
    `<p>${content.value?.excerpt ?? ''}</p>`,
);

// ── Metrik (UI-only di mode mock; backend belum sediakan) ────────────
const stats = computed(() => (content.value as { stats?: Record<string, number> } | undefined)?.stats ?? {});
const baseViews = computed(() => stats.value.views ?? 0);
const baseShares = computed(() => stats.value.shares ?? 0);
const baseLikes = computed(() => stats.value.likes ?? Math.round(baseViews.value * 0.04));

const liked = ref(false);
const extraShares = ref(0);
const likeCount = computed(() => baseLikes.value + (liked.value ? 1 : 0));
const shareCount = computed(() => baseShares.value + extraShares.value);

// ── Komentar (mock: state lokal berthread; live: query) ──────────────
const localComments = ref<UiComment[]>([]);

const { data: liveComments } = useQuery({
  queryKey: ['comments', id],
  queryFn: () => commentService.listForContent(id.value),
  enabled: computed(() => !USE_MOCK),
});

watch(
  [id, () => USE_MOCK],
  () => {
    if (USE_MOCK) {
      localComments.value = getMockComments().map((c) => ({ ...c, replies: [] }));
    }
  },
  { immediate: true },
);

const comments = computed<UiComment[]>(() => {
  if (USE_MOCK) return localComments.value;
  return (liveComments.value ?? []).map((c) => ({ ...c, replies: [] }));
});
const commentCount = computed(() => comments.value.length);

let seq = 0;
function addLocalComment(payload: {
  parentId?: string | null;
  name: string;
  whatsapp?: string;
  body: string;
}): void {
  localComments.value = [
    ...localComments.value,
    {
      id: `local-${Date.now()}-${seq++}`,
      body: payload.body,
      guest_name: payload.name,
      whatsapp: payload.whatsapp,
      parent_id: payload.parentId ?? null,
      created_at: new Date().toISOString(),
      replies: [],
    },
  ];
}

function onPosted(p: { name: string; email: string; whatsapp: string; body: string }): void {
  // Optimistik di mode mock; di mode live CommentForm sudah memicu mutation + refetch.
  if (USE_MOCK) addLocalComment({ name: p.name, whatsapp: p.whatsapp, body: p.body });
}
function onReply(p: { parentId: string; name: string; whatsapp: string; body: string }): void {
  if (USE_MOCK) addLocalComment(p);
}

// Breadcrumb band (terpisah dari kartu konten) — Beranda › Kategori › Judul.
const { set: setBreadcrumbs } = useBreadcrumbs();
watch(
  [content, category, categorySlug],
  () => {
    if (!content.value) return;
    const crumbs: Crumb[] = [{ label: 'Beranda', to: { name: 'home' } }];
    if (category.value) {
      crumbs.push({
        label: category.value,
        to: { name: 'taxonomy', params: { slug: categorySlug.value || category.value.toLowerCase() } },
      });
    }
    crumbs.push({ label: content.value.title });
    setBreadcrumbs(crumbs);
  },
  { immediate: true },
);

useSeoMeta(() => ({
  title: liveMeta.value?.seo_title || content.value?.title,
  description: liveMeta.value?.seo_description || content.value?.excerpt,
  image: liveMeta.value?.og_image || story.value?.featured_image,
}));
</script>

<template>
  <p v-if="loading" :style="{ color: 'var(--color-pub-muted)' }">Memuat…</p>
  <p v-else-if="errored" class="text-red-600">Artikel tidak ditemukan.</p>

  <!-- 2 kolom: artikel (72%) | rail kanan (25%) — selaras gaya beranda. -->
  <div v-else class="grid grid-cols-1 gap-6 lg:gap-10 lg:[grid-template-columns:72%_25%]">
  <article>
    <!-- 2. Badge kategori -->
    <RouterLink
      v-if="category"
      :to="{ name: 'taxonomy', params: { slug: categorySlug || category.toLowerCase() } }"
      class="inline-block rounded px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white"
      :style="{ backgroundColor: categoryColor }"
    >{{ category }}</RouterLink>

    <!-- 3. Judul -->
    <h1 class="mt-3 text-3xl font-extrabold leading-tight" :style="{ color: 'var(--color-pub-ink)' }">
      {{ content!.title }}
    </h1>

    <!-- 4. Author (di bawah judul) -->
    <div class="mt-5">
      <ArticleAuthor
        :author-id="author?.id"
        :author-name="authorName"
        :author-avatar="author?.avatar"
        :author-bio="author?.bio"
        :published-at="content!.published_at"
      />
    </div>

    <!-- 5. Metrik halus (di bawah author, dipisah garis tipis) -->
    <div class="mt-4 border-t pt-3.5" :style="{ borderColor: 'var(--color-pub-line)' }">
      <ArticleMeta
        :views="baseViews"
        :likes="likeCount"
        :shares="shareCount"
        :comments="commentCount"
        :liked="liked"
        @toggle-like="liked = !liked"
      />
    </div>

    <!-- Iklan di bawah judul/meta (leaderboard 728×90 / mobile 320×100) -->
    <div class="mt-5 flex justify-center">
      <AdSlotRenderer position="in_post_below_title" />
    </div>

    <img
      v-if="story?.featured_image"
      :src="story.featured_image"
      :alt="content!.title"
      class="mt-6 w-full rounded-lg"
      :style="{ aspectRatio: '16 / 9', objectFit: 'cover' }"
    />

    <!-- body disanitasi di server (lihat FRONTEND-API.md). -->
    <div class="prose mt-6 max-w-none" v-html="bodyHtml" />

    <!-- Iklan dalam artikel (box 336×280) setelah body -->
    <div class="mt-8 flex justify-center">
      <AdSlotRenderer position="in_post_after_paragraph" />
    </div>

    <!-- Tag artikel (akhir tulisan, sebelum komentar) -->
    <ArticleTags :tags="tags" />

    <!-- Artikel terkait (6 desktop / 4 mobile, kategori sama) -->
    <RelatedArticles :items="relatedItems" />

    <!-- Iklan sebelum komentar (leaderboard 728×90) -->
    <div class="mt-12 flex justify-center">
      <AdSlotRenderer position="pre_comments" />
    </div>

    <!-- Komentar modern -->
    <section class="mt-12">
      <h2 class="mb-5 text-xl font-bold" :style="{ color: 'var(--color-pub-ink)' }">
        Komentar ({{ commentCount }})
      </h2>

      <div
        class="mb-8 rounded-xl border p-5"
        :style="{ borderColor: 'var(--color-pub-line)', backgroundColor: 'var(--color-pub-canvas)' }"
      >
        <h3 class="mb-3 text-base font-semibold" :style="{ color: 'var(--color-pub-ink)' }">
          Tinggalkan komentar
        </h3>
        <CommentForm :content-id="id" @posted="onPosted" />
      </div>

      <CommentList :comments="comments" @reply="onReply" />
    </section>

    <!-- Bar berbagi sticky (mobile only) -->
    <ShareRail
      :title="content!.title"
      @shared="extraShares++"
    />
  </article>

  <!-- ── Rail kanan (25%) — iklan, Most popular sticky, Terbaru, half-page ── -->
  <aside class="flex flex-col gap-8">
    <!-- Iklan atas rail (300×250) -->
    <AdSlotRenderer position="post_sidebar_left" />

    <!-- Most popular: menempel saat scroll di desktop -->
    <div v-if="popular.length" class="lg:sticky lg:top-6">
      <RailModule label="Most popular">
        <PopularList :items="popular" />
      </RailModule>
    </div>

    <!-- Berita terbaru ringkas -->
    <RailModule v-if="railLatest.length" label="Terbaru">
      <RouterLink
        v-for="(it, i) in railLatest"
        :key="it.id"
        :to="{ name: 'article', params: { id: it.id, slug: it.slug } }"
        class="group block py-3"
        :style="i ? { borderTop: '1px solid var(--color-pub-line)' } : undefined"
      >
        <span class="pub-link-title block text-sm font-semibold leading-snug">{{ it.title }}</span>
      </RouterLink>
    </RailModule>

    <!-- Iklan bawah rail (half-page 300×600) -->
    <AdSlotRenderer position="post_sidebar_bottom" />
  </aside>
  </div>
</template>

<style>
/* Isi artikel: rata kiri-kanan + jarak antar paragraf yang lega & nyaman dibaca. */
.prose p {
  margin: 0 0 1.35em;
  text-align: justify;
  text-justify: inter-word;
  line-height: 1.85;
  /* Hindari celah putih lebar dengan memenggal kata panjang bila perlu. */
  hyphens: auto;
}
.prose p:last-child { margin-bottom: 0; }

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
  /* Caption dibuat kecil & tidak ikut membesar bersama font isi. */
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-style: italic;
  line-height: 1.4;
  text-align: left;
}
</style>
