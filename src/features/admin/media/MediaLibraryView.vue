<!--
  src/features/admin/media/MediaLibraryView.vue
  Media Library: grid daftar (cursor pagination), uploader, salin URL & hapus berkonfirmasi.
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useInfiniteQuery, useQueryClient } from '@tanstack/vue-query';
import { Image as ImageIcon } from '@lucide/vue';
import { mediaService } from '@/services/media.service';
import { useToast } from '@/composables/useToast';
import AppButton from '@/components/app/AppButton.vue';
import AppModal from '@/components/app/AppModal.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import LoadMore from '@/components/ui/LoadMore.vue';
import MediaCard from './MediaCard.vue';
import MediaUploader from './MediaUploader.vue';
import { MEDIA_CATEGORY_FILTERS, categoryOf, type MediaCategory } from './upload.config';
import type { MediaUpdate } from '@/services/media.service';
import type { Media } from '@/types/domain';

const toast = useToast();
const queryClient = useQueryClient();

const MEDIA_QUERY_KEY = ['admin-media'] as const;

const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery({
    queryKey: MEDIA_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      mediaService.list({ limit: 24, cursor: pageParam, sort: '-created_at' }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.meta?.next_cursor ?? undefined,
  });

/** Gabung semua halaman cursor menjadi satu daftar media. */
const allItems = computed<Media[]>(() => data.value?.pages.flatMap((p) => p.data) ?? []);

// Filter kategori jenis berkas (client-side terhadap mime_type).
const activeCategory = ref<MediaCategory | 'all'>('all');
const items = computed<Media[]>(() =>
  activeCategory.value === 'all'
    ? allItems.value
    : allItems.value.filter((m) => categoryOf(m.mime_type ?? '') === activeCategory.value),
);

function invalidateList(): void {
  void queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
}

// Rename / ubah alt text / caption dari kartu.
async function onUpdate(id: string, payload: MediaUpdate): Promise<void> {
  try {
    await mediaService.update(id, payload);
    toast.success('Media diperbarui.');
    invalidateList();
  } catch {
    toast.error('Gagal memperbarui media.');
  }
}

async function copyUrl(item: Media): Promise<void> {
  try {
    await navigator.clipboard.writeText(item.file_url);
    toast.success('URL disalin');
  } catch {
    toast.error('Gagal menyalin URL.');
  }
}

// Konfirmasi & proses hapus.
const pendingDelete = ref<Media | null>(null);
const deleting = ref(false);
const confirmOpen = computed<boolean>({
  get: () => pendingDelete.value !== null,
  set: (open) => {
    if (!open) pendingDelete.value = null;
  },
});

function askRemove(item: Media): void {
  pendingDelete.value = item;
}

async function confirmRemove(): Promise<void> {
  const target = pendingDelete.value;
  if (!target) return;
  deleting.value = true;
  try {
    await mediaService.remove(target.id);
    toast.success('Media dihapus.');
    pendingDelete.value = null;
    invalidateList();
  } catch {
    toast.error('Gagal menghapus media.');
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-text-primary">Media Library</h1>
      <p class="mt-1 text-sm text-text-muted">Kelola dan unggah berkas media.</p>
    </header>

    <MediaUploader @uploaded="invalidateList" />

    <!-- Filter jenis berkas -->
    <div v-if="!isLoading && !isError && allItems.length" class="media-filters">
      <button
        v-for="opt in MEDIA_CATEGORY_FILTERS"
        :key="opt.value"
        type="button"
        class="media-filters__chip"
        :class="{ 'media-filters__chip--active': activeCategory === opt.value }"
        @click="activeCategory = opt.value"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Loading awal -->
    <div v-if="isLoading" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <!-- Error -->
    <AppEmptyState
      v-else-if="isError"
      title="Gagal memuat media"
      description="Terjadi kesalahan saat mengambil daftar media. Coba muat ulang."
      :icon="ImageIcon"
    />

    <!-- Kosong (belum ada media sama sekali) -->
    <AppEmptyState
      v-else-if="!allItems.length"
      title="Belum ada media"
      description="Unggah berkas pertama Anda melalui area unggah di atas."
      :icon="ImageIcon"
    />

    <!-- Tidak ada hasil untuk filter aktif -->
    <AppEmptyState
      v-else-if="!items.length"
      title="Tidak ada berkas"
      description="Tidak ada media untuk kategori ini."
      :icon="ImageIcon"
    />

    <!-- Grid -->
    <template v-else>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <MediaCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          @copy="copyUrl"
          @remove="askRemove"
          @update="onUpdate"
        />
      </div>

      <LoadMore :has-more="!!hasNextPage" :loading="isFetchingNextPage" @more="fetchNextPage()" />
    </template>

    <!-- Konfirmasi hapus -->
    <AppModal v-model="confirmOpen" title="Hapus media" size="sm">
      <p class="text-sm text-text-muted">
        Yakin ingin menghapus berkas ini? Tindakan ini tidak dapat dibatalkan.
      </p>
      <template #footer>
        <AppButton variant="secondary" :disabled="deleting" @click="confirmOpen = false">
          Batal
        </AppButton>
        <AppButton variant="danger" :loading="deleting" @click="confirmRemove">
          Hapus
        </AppButton>
      </template>
    </AppModal>
  </section>
</template>

<style scoped>
.media-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.media-filters__chip {
  padding: 6px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: 99px;
  background: var(--color-surface);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    color 150ms ease,
    background 150ms ease,
    border-color 150ms ease;
}
.media-filters__chip:hover:not(.media-filters__chip--active) {
  color: var(--color-text-primary);
  border-color: var(--color-text-subtle);
}
.media-filters__chip--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
</style>
