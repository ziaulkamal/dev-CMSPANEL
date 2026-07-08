<!-- src/features/public/error/ServerErrorView.vue — halaman 500 bergaya newsroom. -->
<script setup lang="ts">
import ErrorState from '@/features/public/error/ErrorState.vue';
import { useSeoMeta } from '@/composables/useSeoMeta';

useSeoMeta(() => ({
  title: '500 — Kesalahan Server',
  description: 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.',
}));
</script>

<template>
  <ErrorState
    code="500"
    title="Terjadi Kesalahan"
    message="Server sedang mengalami gangguan saat memproses permintaan Anda. Silakan coba beberapa saat lagi."
    show-reload
  />
</template>
