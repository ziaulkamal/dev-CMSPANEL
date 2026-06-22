<!--
  src/features/admin/contents/MediaPickerModal.vue
  Pemilih media reusable: tab "Media Library" (grid gambar lama, cursor pagination)
  & tab "Upload Baru" (dropzone). Emit `select` { url, alt }. Dipakai editor body & gambar unggulan.
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useInfiniteQuery } from '@tanstack/vue-query';
import { ImageIcon, Check, UploadCloud } from '@lucide/vue';
import AppModal from '@/components/app/AppModal.vue';
import AppTabs from '@/components/app/AppTabs.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import LoadMore from '@/components/ui/LoadMore.vue';
import { mediaService } from '@/services/media.service';
import { resolveMediaUrl, pickMediaUrl } from '@/lib/media';
import { useToast } from '@/composables/useToast';
import type { Media } from '@/types/domain';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [open: boolean];
  select: [payload: { id: string; url: string; alt: string }];
}>();

const toast = useToast();

const open = computed<boolean>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const tab = ref<'library' | 'upload'>('library');
const tabs = [
  { value: 'library', label: 'Media Library' },
  { value: 'upload', label: 'Upload Baru' },
];

// ── Library: cursor pagination, hanya gambar ──────────────────────
const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
  useInfiniteQuery({
    queryKey: ['media-picker'],
    queryFn: ({ pageParam }) =>
      mediaService.list({ limit: 24, cursor: pageParam, sort: '-created_at' }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.meta?.next_cursor ?? undefined,
    enabled: open,
  });

const items = computed<Media[]>(() =>
  (data.value?.pages.flatMap((p) => p.data) ?? []).filter((m) =>
    (m.mime_type ?? '').startsWith('image/'),
  ),
);

const selectedId = ref<string | null>(null);
const selectedMedia = computed<Media | null>(
  () => items.value.find((m) => m.id === selectedId.value) ?? null,
);

function thumb(m: Media): string {
  return resolveMediaUrl(pickMediaUrl(m));
}

function confirmSelect(): void {
  const m = selectedMedia.value;
  if (!m) return;
  emit('select', { id: m.id, url: resolveMediaUrl(pickMediaUrl(m)), alt: m.alt_text ?? '' });
  open.value = false;
}

// ── Upload: dropzone langsung ─────────────────────────────────────
const uploadInputRef = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const isDragging = ref(false);

function pickUpload(): void {
  if (uploading.value) return;
  uploadInputRef.value?.click();
}

async function doUpload(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) {
    toast.error('File harus berupa gambar.');
    return;
  }
  uploading.value = true;
  try {
    const media = await mediaService.upload(file, { alt_text: file.name });
    const url = resolveMediaUrl(pickMediaUrl(media));
    if (!url) {
      toast.error('Upload berhasil tetapi URL gambar tidak diterima dari server.');
      return;
    }
    emit('select', { id: media.id, url, alt: media.alt_text ?? file.name });
    void refetch();
    open.value = false;
  } catch {
    toast.error('Gagal mengunggah gambar.');
  } finally {
    uploading.value = false;
  }
}

function onUploadChange(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) void doUpload(file);
  (e.target as HTMLInputElement).value = '';
}

function onDrop(e: DragEvent): void {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) void doUpload(file);
}

// Reset pilihan tiap kali modal dibuka.
watch(open, (v) => {
  if (v) {
    selectedId.value = null;
    tab.value = 'library';
  }
});
</script>

<template>
  <AppModal v-model="open" title="Pilih Gambar" size="xl">
    <div class="mp">
      <AppTabs v-model="tab" :tabs="tabs" variant="pill" />

      <!-- Tab: Library -->
      <div v-show="tab === 'library'" class="mp__panel">
        <div v-if="isLoading" class="mp__center"><AppSpinner size="lg" /></div>
        <AppEmptyState
          v-else-if="isError"
          :icon="ImageIcon"
          title="Gagal memuat media"
          description="Coba muat ulang."
        />
        <AppEmptyState
          v-else-if="!items.length"
          :icon="ImageIcon"
          title="Belum ada gambar"
          description="Unggah lewat tab Upload Baru."
        />
        <template v-else>
          <div class="mp__grid">
            <button
              v-for="m in items"
              :key="m.id"
              type="button"
              class="mp__cell"
              :class="{ 'mp__cell--active': selectedId === m.id }"
              @click="selectedId = m.id"
            >
              <img :src="thumb(m)" :alt="m.alt_text || ''" loading="lazy" class="mp__img" />
              <span v-if="selectedId === m.id" class="mp__check"><Check :size="14" /></span>
            </button>
          </div>
          <LoadMore
            :has-more="!!hasNextPage"
            :loading="isFetchingNextPage"
            @more="fetchNextPage()"
          />
        </template>
      </div>

      <!-- Tab: Upload -->
      <div v-show="tab === 'upload'" class="mp__panel">
        <input
          ref="uploadInputRef"
          type="file"
          accept="image/*"
          class="mp__file"
          @change="onUploadChange"
        />
        <button
          type="button"
          class="mp__drop"
          :class="{ 'mp__drop--over': isDragging }"
          :disabled="uploading"
          @click="pickUpload"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="onDrop"
        >
          <AppSpinner v-if="uploading" size="md" />
          <UploadCloud v-else :size="34" class="mp__drop-icon" />
          <span class="mp__drop-text">
            {{ uploading ? 'Mengunggah…' : 'Klik atau seret gambar ke sini' }}
          </span>
          <span v-if="!uploading" class="mp__drop-hint">Gambar — maks 50 MB</span>
        </button>
      </div>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="open = false">Batal</AppButton>
      <AppButton
        v-if="tab === 'library'"
        variant="primary"
        :disabled="!selectedMedia"
        @click="confirmSelect"
      >
        Pilih
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.mp { display: flex; flex-direction: column; gap: 16px; }
.mp__panel { min-height: 320px; }
.mp__center { display: flex; justify-content: center; padding: 60px 0; }

.mp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}
.mp__cell {
  position: relative;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  background: var(--color-bg-subtle);
  aspect-ratio: 1;
  transition: border-color 120ms ease;
}
.mp__cell:hover { border-color: var(--color-border-strong); }
.mp__cell--active { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18); }
.mp__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.mp__check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #6366f1;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

.mp__file { display: none; }
.mp__drop {
  width: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-subtle);
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all 180ms ease;
}
.mp__drop:hover:not(:disabled) {
  border-color: #6366f1;
  background: color-mix(in srgb, #6366f1 4%, var(--color-bg-subtle));
}
.mp__drop--over { border-color: #6366f1; border-style: solid; }
.mp__drop:disabled { cursor: not-allowed; opacity: 0.7; }
.mp__drop-icon { color: #6366f1; }
.mp__drop-text { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.mp__drop-hint { font-size: 12px; color: var(--color-text-subtle); }
</style>
