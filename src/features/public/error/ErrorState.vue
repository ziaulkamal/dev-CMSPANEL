<!--
  ErrorState.vue — tampilan error publik bergaya newsroom (dipakai 404/500/dll).
  Presentational murni: kode besar + judul + pesan + aksi. Warna mengikuti token
  --color-pub-* sehingga ikut tema & dark mode segment publik.
-->
<script setup lang="ts">
import { RouterLink } from 'vue-router';

withDefaults(
  defineProps<{
    /** Kode status besar di tengah (mis. '404', '500', '403'). */
    code: string;
    /** Judul ringkas di bawah kode. */
    title: string;
    /** Penjelasan singkat untuk pembaca. */
    message: string;
    /** Tampilkan tombol "Muat ulang" (berguna untuk error transient). */
    showReload?: boolean;
  }>(),
  { showReload: false },
);

function reload(): void {
  window.location.reload();
}
</script>

<template>
  <section class="flex flex-col items-center px-4 py-16 text-center sm:py-24">
    <!-- Eyebrow kecil ala newsroom -->
    <p class="pub-eyebrow mb-3">Galat</p>

    <!-- Kode status besar, crimson, mono untuk kesan headline -->
    <p
      class="font-bold leading-none tracking-tight"
      :style="{
        fontFamily: 'var(--font-pub-mono)',
        fontSize: 'clamp(4.5rem, 18vw, 9rem)',
        color: 'var(--color-pub-crimson)',
      }"
    >
      {{ code }}
    </p>

    <!-- Garis aksen tipis -->
    <span
      class="mt-4 mb-6 block h-[3px] w-16 rounded-full"
      :style="{ backgroundColor: 'var(--color-pub-crimson)' }"
    />

    <h1 class="text-2xl font-bold sm:text-3xl" :style="{ color: 'var(--color-pub-ink)' }">
      {{ title }}
    </h1>
    <p
      class="mx-auto mt-3 max-w-md text-[15px] leading-relaxed"
      :style="{ color: 'var(--color-pub-muted)' }"
    >
      {{ message }}
    </p>

    <!-- Aksi: kembali ke beranda + opsi muat ulang / lihat berita terbaru -->
    <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
      <RouterLink :to="{ name: 'home' }" class="pub-archive-link">
        <span aria-hidden="true">←</span>
        Kembali ke Beranda
      </RouterLink>

      <button v-if="showReload" type="button" class="pub-loadmore" @click="reload">
        <span class="pub-loadmore__icon" aria-hidden="true">↻</span>
        Muat Ulang
      </button>

      <RouterLink v-else :to="{ name: 'latest' }" class="pub-loadmore">
        Berita Terbaru
        <span class="pub-loadmore__icon" aria-hidden="true">→</span>
      </RouterLink>
    </div>
  </section>
</template>
