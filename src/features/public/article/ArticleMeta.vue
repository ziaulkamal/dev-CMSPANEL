<!--
  ArticleMeta.vue — baris metrik artikel yang HALUS & elegan: dilihat · suka ·
  dibagikan · komentar sebagai teks-ikon ringan (tanpa kotak/border mencolok).
  Tombol Suka UI-only (state lokal di induk). "Suka" disembunyikan di mobile.
-->
<script setup lang="ts">
import { Eye, Heart, Share2, MessageCircle } from '@lucide/vue';

withDefaults(
  defineProps<{
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    liked?: boolean;
  }>(),
  { views: 0, likes: 0, shares: 0, comments: 0, liked: false },
);

const emit = defineEmits<{ (e: 'toggle-like'): void }>();

function fmt(n: number): string {
  // Angka penuh dengan pemisah ribuan (id-ID): 42100 → "42.100".
  return new Intl.NumberFormat('id-ID').format(n);
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]" :style="{ color: 'var(--color-pub-muted)' }">
    <span class="pub-metric" :title="`${views} dilihat`">
      <Eye :size="15" :stroke-width="1.75" />
      <span class="pub-metric__num">{{ fmt(views) }}</span>
      <span class="pub-metric__lbl">dilihat</span>
    </span>

    <!-- Suka: disembunyikan total di mobile (lihat CSS .pub-metric--like) -->
    <button
      type="button"
      class="pub-metric pub-metric--btn pub-metric--like"
      :class="{ 'is-on': liked }"
      :aria-pressed="liked"
      @click="emit('toggle-like')"
    >
      <Heart :size="15" :stroke-width="1.75" :fill="liked ? 'currentColor' : 'none'" />
      <span class="pub-metric__num">{{ fmt(likes) }}</span>
      <span class="pub-metric__lbl">suka</span>
    </button>

    <span class="pub-metric" :title="`${shares} dibagikan`">
      <Share2 :size="15" :stroke-width="1.75" />
      <span class="pub-metric__num">{{ fmt(shares) }}</span>
      <span class="pub-metric__lbl">dibagikan</span>
    </span>

    <span class="pub-metric" :title="`${comments} komentar`">
      <MessageCircle :size="15" :stroke-width="1.75" />
      <span class="pub-metric__num">{{ fmt(comments) }}</span>
      <span class="pub-metric__lbl">komentar</span>
    </span>
  </div>
</template>

<style scoped>
.pub-metric {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.pub-metric__num {
  font-weight: 600;
  color: var(--color-pub-ink);
}
.pub-metric__lbl {
  color: var(--color-pub-muted);
}
.pub-metric--btn {
  transition: color 150ms var(--ease-default);
}
.pub-metric--btn:hover,
.pub-metric--btn.is-on {
  color: var(--color-pub-crimson);
}
.pub-metric--btn.is-on .pub-metric__num {
  color: var(--color-pub-crimson);
}
/* Suka disembunyikan total di mobile/tablet; tampil hanya desktop (≥1024px).
   Pakai selektor ganda agar mengalahkan .pub-metric { display: inline-flex }. */
.pub-metric.pub-metric--like {
  display: none;
}
@media (min-width: 1024px) {
  .pub-metric.pub-metric--like {
    display: inline-flex;
  }
}
</style>
