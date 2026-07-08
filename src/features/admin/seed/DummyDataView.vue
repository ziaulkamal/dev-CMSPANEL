<!--
  src/features/admin/seed/DummyDataView.vue
  Generator Data Dummy (manage_settings): seed data contoh untuk demo/pengembangan,
  lalu hapus semua data dummy untuk masuk mode production. Tiap record dummy bertanda
  di backend → "Hapus Semua" hanya menyentuh data dummy, data asli aman.
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { Database, Trash2, Sparkles } from '@lucide/vue';
import type { AxiosError } from 'axios';
import { seedService, type GenerateOptions, type SeedCounts } from '@/services/seed.service';
import type { ApiError } from '@/types/api';
import { useToast } from '@/composables/useToast';
import { useIsMobile } from '@/composables/useIsMobile';
import { useCacheControl } from '@/composables/useCacheControl';
import AppCard from '@/components/app/AppCard.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppToggle from '@/components/app/AppToggle.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppBadge from '@/components/app/AppBadge.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';

const toast = useToast();
const isMobile = useIsMobile();
const queryClient = useQueryClient();
const { refreshAll } = useCacheControl();
const STATUS_KEY = ['admin-dummy-status'] as const;

const statusQuery = useQuery({ queryKey: STATUS_KEY, queryFn: () => seedService.getStatus() });

const exists = computed(() => statusQuery.data.value?.exists ?? false);
const counts = computed<SeedCounts | null>(() => statusQuery.data.value?.counts ?? null);
const generatedAt = computed(() => statusQuery.data.value?.generatedAt ?? null);

/** Form jumlah (string krn AppInput type=number) + toggle cakupan. */
const form = reactive({
  contents: '40',
  authors: '12',
  categories: '6',
  tags: '8',
  includeComments: true,
  includeMenuWidget: true,
  includeAdsPopup: true,
});

function num(v: string, fallback: number): number {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const options = computed<GenerateOptions>(() => ({
  contents: num(form.contents, 40),
  authors: num(form.authors, 12),
  categories: num(form.categories, 6),
  tags: num(form.tags, 8),
  includeComments: form.includeComments,
  includeMenuWidget: form.includeMenuWidget,
  includeAdsPopup: form.includeAdsPopup,
}));

const generateMutation = useMutation({
  mutationFn: () => seedService.generate(options.value),
  onSuccess: async (res) => {
    const c = res.counts;
    toast.success(`Data dummy dibuat: ${c.contents} konten, ${c.authors} penulis, ${c.terms} taksonomi.`);
    await queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    await refreshAll();
  },
  onError: (e: unknown) => {
    const msg =
      (e as AxiosError<ApiError>)?.response?.data?.error?.message ?? 'Gagal membuat data dummy.';
    toast.error(msg);
  },
});

const confirmOpen = ref(false);
const cleanupMutation = useMutation({
  mutationFn: () => seedService.cleanup(),
  onSuccess: async (res) => {
    const c = res.counts;
    toast.success(`Data dummy dihapus: ${c.contents} konten, ${c.authors} penulis, ${c.terms} taksonomi.`);
    confirmOpen.value = false;
    await queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    await refreshAll();
  },
  onError: () => toast.error('Gagal menghapus data dummy.'),
});

/** Ringkasan jumlah untuk kartu status (label → nilai). */
const countRows = computed<Array<{ label: string; value: number }>>(() => {
  const c = counts.value;
  if (!c) return [];
  return [
    { label: 'Konten', value: c.contents },
    { label: 'Penulis', value: c.authors },
    { label: 'Taksonomi', value: c.terms },
    { label: 'Media', value: c.media },
    { label: 'Komentar', value: c.comments },
    { label: 'Iklan', value: c.ads },
    { label: 'Popup', value: c.popups },
  ];
});

const generatedAtLabel = computed(() => {
  if (!generatedAt.value) return null;
  return new Date(generatedAt.value).toLocaleString('id-ID');
});
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Generator Data Dummy</h1>
        <p class="mt-1 text-sm text-text-muted">
          Isi situs dengan data contoh untuk demo, lalu hapus semua data dummy saat masuk produksi.
        </p>
      </div>
      <Teleport to="#admin-action-bar" :disabled="!isMobile">
        <div class="flex items-center gap-2">
          <AppButton
            variant="primary"
            :loading="generateMutation.isPending.value"
            :disabled="exists || statusQuery.isLoading.value"
            @click="generateMutation.mutate()"
          >
            <template #icon><Sparkles :size="14" /></template>
            Buat Data Dummy
          </AppButton>
          <AppButton
            variant="danger"
            :disabled="!exists || cleanupMutation.isPending.value"
            @click="confirmOpen = true"
          >
            <template #icon><Trash2 :size="14" /></template>
            Hapus Semua
          </AppButton>
        </div>
      </Teleport>
    </header>

    <div v-if="statusQuery.isLoading.value" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <template v-else>
      <!-- Kartu status -->
      <AppCard padding="lg">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="flex size-10 items-center justify-center rounded-lg bg-bg-subtle text-text-muted">
              <Database :size="20" />
            </span>
            <div>
              <p class="text-sm font-semibold text-text-primary">
                Status:
                <AppBadge :color="exists ? 'success' : 'default'">
                  {{ exists ? 'Data dummy aktif' : 'Bersih (mode produksi)' }}
                </AppBadge>
              </p>
              <p v-if="generatedAtLabel" class="mt-1 text-xs text-text-muted">
                Dibuat: {{ generatedAtLabel }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="exists && countRows.length" class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <div
            v-for="row in countRows"
            :key="row.label"
            class="rounded-lg border border-border bg-bg-subtle/40 p-3 text-center"
          >
            <p class="text-lg font-bold text-text-primary">{{ row.value }}</p>
            <p class="text-xs text-text-muted">{{ row.label }}</p>
          </div>
        </div>
      </AppCard>

      <!-- Kartu form generate -->
      <AppCard padding="lg">
        <h2 class="text-sm font-semibold text-text-primary">Opsi Generate</h2>
        <p class="mt-1 text-xs text-text-muted">
          Tentukan jumlah dan cakupan data dummy. Tombol nonaktif bila data dummy sudah ada — bersihkan dulu.
        </p>

        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AppInput v-model="form.contents" type="number" label="Jumlah konten" :disabled="exists" />
          <AppInput v-model="form.authors" type="number" label="Jumlah penulis" :disabled="exists" />
          <AppInput v-model="form.categories" type="number" label="Jumlah kategori" :disabled="exists" />
          <AppInput v-model="form.tags" type="number" label="Jumlah tag" :disabled="exists" />
        </div>

        <div class="mt-4 flex flex-col gap-3">
          <AppToggle v-model="form.includeComments" label="Sertakan komentar" :disabled="exists" />
          <AppToggle v-model="form.includeMenuWidget" label="Sertakan menu, widget & footer" :disabled="exists" />
          <AppToggle v-model="form.includeAdsPopup" label="Sertakan iklan & popup" :disabled="exists" />
        </div>

        <div class="mt-5">
          <AppButton
            variant="primary"
            :loading="generateMutation.isPending.value"
            :disabled="exists"
            @click="generateMutation.mutate()"
          >
            <template #icon><Sparkles :size="14" /></template>
            Buat Data Dummy
          </AppButton>
        </div>
      </AppCard>

      <!-- Danger zone -->
      <AppCard padding="lg">
        <h2 class="text-sm font-semibold text-danger">Zona Berbahaya</h2>
        <p class="mt-1 text-xs text-text-muted">
          Menghapus seluruh data dummy (konten, penulis, taksonomi, media, komentar, iklan, popup, serta
          menu/widget/footer dummy). Data asli yang Anda buat sendiri tidak ikut terhapus.
        </p>
        <div class="mt-4">
          <AppButton
            variant="danger"
            :disabled="!exists || cleanupMutation.isPending.value"
            @click="confirmOpen = true"
          >
            <template #icon><Trash2 :size="14" /></template>
            Hapus Semua Data Dummy
          </AppButton>
        </div>
      </AppCard>
    </template>

    <ConfirmDialog
      v-model="confirmOpen"
      title="Hapus semua data dummy?"
      message="Seluruh data dummy akan dihapus permanen. Data asli (yang Anda buat sendiri) & taksonomi dasar tetap aman. Lanjutkan?"
      confirm-label="Ya, Hapus Semua"
      :loading="cleanupMutation.isPending.value"
      @confirm="cleanupMutation.mutate()"
    />
  </section>
</template>
