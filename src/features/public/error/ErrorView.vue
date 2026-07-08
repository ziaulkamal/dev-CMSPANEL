<!--
  ErrorView.vue — halaman error generik (/error). Kode & pesan dibaca dari query
  string agar dipakai ulang untuk status apa pun (403, 503, dll):
    /error?code=403&title=Akses%20Ditolak&message=...
  Default → tampilan galat umum bila query kosong.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ErrorState from '@/features/public/error/ErrorState.vue';
import { useSeoMeta } from '@/composables/useSeoMeta';

const route = useRoute();

const code = computed(() => String(route.query.code ?? 'Galat'));
const title = computed(() => String(route.query.title ?? 'Terjadi Kesalahan'));
const message = computed(() =>
  String(
    route.query.message ??
      'Ada yang tidak beres saat memuat halaman ini. Silakan coba lagi atau kembali ke beranda.',
  ),
);

useSeoMeta(() => ({
  title: `${code.value} — ${title.value}`,
  description: message.value,
}));
</script>

<template>
  <ErrorState :code="code" :title="title" :message="message" show-reload />
</template>
