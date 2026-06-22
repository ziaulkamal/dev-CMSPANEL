<!--
  StoryCard.vue — pola item paling sering: kategori + judul kiri, thumbnail kanan.
  Varian teks-saja saat tak ada gambar. Hover: judul → crimson, thumb zoom halus.
  Dipisah divider 1px oleh induk (border-t), bukan kartu berbayang.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { ContentSummary } from '@/types/domain';
import { MessageCircle, Eye, Share2, UserRound } from '@lucide/vue';
import { resolveFeaturedImage } from '@/lib/media';
import { relativeTime, formatDate } from '@/lib/datetime';
import CategoryTag from './CategoryTag.vue';

const props = defineProps<{
  item: ContentSummary;
  /** Tampilkan eyebrow label kecil di atas judul (mis. "ANALYSIS"). */
  eyebrow?: string;
  /** Tampilkan excerpt (dek) di bawah judul. Default: false (padat). */
  showExcerpt?: boolean;
  /** Jumlah baris excerpt sebelum dipotong: 2 (default) atau 3. */
  excerptLines?: 2 | 3;
  /** Paksa varian teks-saja (sembunyikan thumbnail) — dipakai varian centerFeed. */
  forceTextOnly?: boolean;
  /** Sembunyikan label kategori (mis. saat eyebrow dipakai). */
  hideCategory?: boolean;
  /** Kelas padding vertikal kustom untuk article (default py-4). */
  paddingClass?: string;
  /** Kelas ukuran judul kustom (default text-[19px]). */
  titleClass?: string;
  /** Batasi judul ke N baris (clamp). 0/undefined = tanpa batas. */
  clampTitle?: number;
  /**
   * Auto-perkecil judul bila panjangnya melebihi N karakter (mis. 43) — agar
   * judul panjang tetap muat 2 baris tanpa memecah simetri. 0/undefined = nonaktif.
   */
  shrinkThreshold?: number;
  /** Kelas ukuran judul saat melewati shrinkThreshold (default text-[16px]). */
  titleClassLong?: string;
  /**
   * Lepas dari aturan ukuran judul global (yang memaksa seragam text-[17px] di
   * mobile/tablet). Saat true, `titleClass`/shrint dipakai apa adanya di semua
   * breakpoint — dipakai section yang punya aturan sendiri (mis. Pilihan Editor).
   */
  rawTitleSize?: boolean;
  /**
   * Tampilkan tanggal absolut (mis. "22 Jun 2026") di samping badge kategori,
   * dan sembunyikan waktu relatif di bawah judul. Dipakai mis. Pilihan Editor.
   */
  dateBesideCategory?: boolean;
  /** Letakkan thumbnail di kiri (default: kanan). Dipakai daftar baris "Terbaru". */
  thumbLeft?: boolean;
  /** Ukuran thumbnail: 'sm' (104×70), 'md' (168×120), atau 'lg' (200×134). */
  thumbSize?: 'sm' | 'md' | 'lg';
  /** Tampilkan nama author di baris meta (mis. "Rina Wijaya · 2 jam lalu"). */
  showAuthor?: boolean;
  /** Tampilkan baris statistik (dilihat · komentar · dibagikan). */
  showStats?: boolean;
  /**
   * Thumbnail mengisi penuh tinggi baris (stretch) agar simetris — tinggi
   * mengikuti konten, hanya lebar yang tetap. Dipakai daftar "Terbaru".
   */
  thumbFill?: boolean;
}>();

const loose = computed(() => props.item as unknown as Record<string, unknown>);

/**
 * Pilih kelas ukuran judul. Di mobile & tablet (<lg) ukuran SELALU seragam
 * (text-[17px]) agar konsisten antar-section. Ukuran per-section / hasil-shrink
 * hanya berlaku di desktop (prefix lg:), sehingga tampilan desktop tak berubah.
 */
const titleSizeClass = computed(() => {
  const desktop =
    props.shrinkThreshold && props.item.title.length > props.shrinkThreshold
      ? props.titleClassLong ?? 'text-[16px]'
      : props.titleClass ?? 'text-[19px]';
  // Section dengan aturan sendiri (mis. Pilihan Editor): pakai ukuran apa adanya.
  if (props.rawTitleSize) return desktop;
  // Default: seragam text-[17px] di mobile/tablet, ukuran desktop dikunci di lg:.
  const desktopLg = desktop
    .split(/\s+/)
    .filter(Boolean)
    .map((c) => `lg:${c}`)
    .join(' ');
  return `text-[24px] ${desktopLg}`;
});

/** Backend feed belum tentu mengirim gambar; toleran terhadap field longgar. */
const thumbUrl = computed(() => {
  if (props.forceTextOnly) return '';
  return resolveFeaturedImage(loose.value.featured_image);
});

const category = computed(() => loose.value.category as string | undefined);
const categoryColor = computed(() => loose.value.category_color as string | undefined);
const meta = computed(() => relativeTime(props.item.published_at));
const dateLabel = computed(() => formatDate(props.item.published_at));

/** Author pertama (bila ada) untuk baris meta. */
const author = computed(() => {
  const authors = loose.value.authors as Array<{ display_name?: string; avatar?: string }> | undefined;
  return authors?.[0];
});
const authorName = computed(() => author.value?.display_name ?? '');
const authorAvatar = computed(() => author.value?.avatar ?? '');

/** Dimensi thumbnail per ukuran. */
const thumbDims = computed(() => {
  if (props.thumbSize === 'lg') return { width: '260px', height: '174px' };
  if (props.thumbSize === 'md') return { width: '168px', height: '120px' };
  return { width: '104px', height: '70px' };
});

/**
 * Gaya thumbnail. Mode `thumbFill` (dipakai daftar "Terbaru"): persegi sama sisi
 * (aspect 1:1) dengan lebar tetap responsif (class Tailwind) — tinggi = lebar.
 */
const thumbStyle = computed(() => {
  const base = { backgroundColor: 'var(--color-pub-line)' } as Record<string, string>;
  if (props.thumbFill) {
    return { ...base, aspectRatio: '1 / 1' };
  }
  return { ...base, ...thumbDims.value };
});

/** Statistik (longgar): dilihat, komentar, dibagikan. */
const stats = computed(
  () => loose.value.stats as { views?: number; comments?: number; shares?: number } | undefined,
);
const hasStats = computed(
  () => !!stats.value && (!!stats.value.views || !!stats.value.comments || !!stats.value.shares),
);

/** Ringkas angka besar: 42100 → "42,1rb", 1280 → "1,3rb". */
function compact(n?: number): string {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')}rb`;
  return String(n);
}
</script>

<template>
  <article class="group flex items-start" :class="[paddingClass ?? 'py-4', thumbFill ? 'gap-4 sm:gap-5' : 'gap-4']">
    <div class="min-w-0 flex-1" :class="{ 'order-2': thumbLeft }">
      <span v-if="eyebrow" class="pub-eyebrow mb-1.5 block">{{ eyebrow }}</span>
      <!-- Kategori + tanggal di samping (satu baris) -->
      <div
        v-else-if="dateBesideCategory && !hideCategory && category"
        class="mb-1.5 flex items-center gap-2"
      >
        <CategoryTag :label="category" :color="categoryColor" />
        <span
          v-if="dateLabel"
          class="text-[11px]"
          :style="{ color: 'var(--color-pub-muted)' }"
        >{{ dateLabel }}</span>
      </div>
      <CategoryTag
        v-else-if="!hideCategory && category"
        :label="category"
        :color="categoryColor"
        class="mb-1.5"
      />
      <RouterLink
        :to="{ name: 'article', params: { id: item.id, slug: item.slug } }"
        class="pub-link-title block font-semibold leading-snug"
        :class="titleSizeClass"
        :style="clampTitle
          ? {
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: String(clampTitle),
              overflow: 'hidden',
            }
          : undefined"
      >
        {{ item.title }}
      </RouterLink>
      <p
        v-if="showExcerpt && item.excerpt"
        class="mt-1.5 text-sm leading-relaxed"
        :class="excerptLines === 3 ? 'line-clamp-3' : 'line-clamp-2'"
        :style="{ fontFamily: 'var(--font-pub-serif)', color: 'var(--color-pub-muted)' }"
      >
        {{ item.excerpt }}
      </p>
      <!-- Baris author: avatar foto (atau ikon fallback) + nama · waktu -->
      <div
        v-if="showAuthor && authorName && !dateBesideCategory"
        class="mt-2.5 flex items-center gap-2"
      >
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
      <!-- Fallback waktu (tanpa author) -->
      <span
        v-else-if="meta && !dateBesideCategory"
        class="mt-2 block text-xs"
        :style="{ color: 'var(--color-pub-muted)' }"
      >{{ meta }}</span>
      <!-- Statistik keterlibatan: dilihat · komentar · dibagikan -->
      <div
        v-if="showStats && hasStats"
        class="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs"
        :style="{ color: 'var(--color-pub-muted)' }"
      >
        <span
          class="hidden items-center gap-1.5 rounded-full px-2 py-1 lg:inline-flex"
          :style="{ backgroundColor: 'var(--color-pub-canvas)' }"
          title="Dilihat"
        >
          <Eye :size="14" :stroke-width="1.75" aria-hidden="true" />
          <span class="tabular-nums font-medium">{{ compact(stats?.views) }}</span>
        </span>
        <span
          class="hidden items-center gap-1.5 rounded-full px-2 py-1 lg:inline-flex"
          :style="{ backgroundColor: 'var(--color-pub-canvas)' }"
          title="Komentar"
        >
          <MessageCircle :size="14" :stroke-width="1.75" aria-hidden="true" />
          <span class="tabular-nums font-medium">{{ compact(stats?.comments) }}</span>
        </span>
        <span
          class="hidden items-center gap-1.5 rounded-full px-2 py-1 lg:inline-flex"
          :style="{ backgroundColor: 'var(--color-pub-canvas)' }"
          title="Dibagikan"
        >
          <Share2 :size="14" :stroke-width="1.75" aria-hidden="true" />
          <span class="tabular-nums font-medium">{{ compact(stats?.shares) }}</span>
        </span>
      </div>
    </div>

    <RouterLink
      v-if="thumbUrl"
      :to="{ name: 'article', params: { id: item.id, slug: item.slug } }"
      class="block flex-none overflow-hidden rounded"
      :class="[
        { 'order-1': thumbLeft },
        thumbFill ? 'w-[180px] sm:w-[180px] lg:w-[220px]' : '',
      ]"
      :style="thumbStyle"
    >
      <img
        :src="thumbUrl"
        :alt="item.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </RouterLink>
  </article>
</template>
