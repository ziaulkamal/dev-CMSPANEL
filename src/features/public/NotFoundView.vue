<!-- src/features/public/NotFoundView.vue — halaman 404 bergaya newsroom. -->
<script setup lang="ts">
import ErrorState from '@/features/public/error/ErrorState.vue';
import { useSeoMeta } from '@/composables/useSeoMeta';

useSeoMeta(() => ({
  title: '404 — Halaman Tidak Ditemukan',
  description: 'Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.',
}));
</script>

<template>
  <ErrorState
    code="404"
    title="Halaman Tidak Ditemukan"
    message="Maaf, halaman yang Anda cari tidak ada, telah dipindahkan, atau tautannya sudah tidak berlaku."
  />
</template>
