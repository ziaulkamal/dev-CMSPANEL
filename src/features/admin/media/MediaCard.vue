<!--
  src/features/admin/media/MediaCard.vue
  Kartu satu item media: thumbnail/ikon, nama file (inline-edit), aksi.
  Klik nama → rename in-place; tombol detail → edit alt text & caption inline.
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Copy,
  Trash2,
  FileText,
  FileSpreadsheet,
  Film,
  File as FileIcon,
  ChevronDown,
} from '@lucide/vue';
import AppButton from '@/components/app/AppButton.vue';
import InlineEditText from '@/components/ui/InlineEditText.vue';
import { pickMediaUrl, resolveMediaUrl } from '@/lib/media';
import type { MediaUpdate } from '@/services/media.service';
import type { Media } from '@/types/domain';

const props = defineProps<{ item: Media }>();
const emit = defineEmits<{
  copy: [item: Media];
  remove: [item: Media];
  update: [id: string, payload: MediaUpdate];
}>();

const mime = computed<string>(() => props.item.mime_type ?? '');
const fileUrl = computed<string>(() => resolveMediaUrl(pickMediaUrl(props.item)));

const isImage = computed<boolean>(() => mime.value.startsWith('image/'));

/** Ikon non-gambar berdasarkan mime_type. */
const fallbackIcon = computed(() => {
  const m = mime.value;
  if (m.startsWith('video/')) return Film;
  if (m === 'application/pdf') return FileText;
  if (m.includes('wordprocessingml')) return FileText;
  if (m.includes('spreadsheetml')) return FileSpreadsheet;
  return FileIcon;
});

/** Nama file ringkas dari URL. */
const fileName = computed<string>(() => {
  if (!fileUrl.value) return '(tanpa nama)';
  try {
    const path = new URL(fileUrl.value).pathname;
    return decodeURIComponent(path.split('/').pop() || fileUrl.value);
  } catch {
    return fileUrl.value;
  }
});

/** Format ukuran file: B / KB / MB. */
const readableSize = computed<string>(() => {
  const bytes = props.item.file_size ?? 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
});

const detailOpen = ref(false);

function rename(value: string): void {
  if (value && value !== fileName.value) emit('update', props.item.id, { filename: value });
}
function setAlt(value: string): void {
  emit('update', props.item.id, { alt_text: value });
}
function setCaption(value: string): void {
  emit('update', props.item.id, { caption: value });
}
</script>

<template>
  <div class="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
    <!-- Preview -->
    <div class="flex aspect-video items-center justify-center bg-bg-subtle">
      <img
        v-if="isImage && fileUrl"
        :src="fileUrl"
        :alt="item.alt_text || fileName"
        loading="lazy"
        class="h-full w-full object-cover"
      />
      <div v-else class="flex flex-col items-center gap-2 px-3 text-text-subtle">
        <component :is="fallbackIcon" :size="32" />
        <span class="max-w-full truncate text-xs text-text-muted">{{ mime || 'tidak diketahui' }}</span>
      </div>
    </div>

    <!-- Meta -->
    <div class="flex flex-1 flex-col gap-1 p-3">
      <!-- Nama file inline-editable -->
      <InlineEditText
        :model-value="fileName"
        placeholder="Nama berkas"
        class="text-sm font-semibold text-text-primary"
        @update:model-value="rename"
      />
      <p class="text-xs text-text-subtle">{{ readableSize }}</p>

      <!-- Toggle detail (alt text & caption) -->
      <button
        type="button"
        class="mt-1 flex items-center gap-1 self-start text-xs text-text-muted hover:text-text-primary"
        @click="detailOpen = !detailOpen"
      >
        <ChevronDown :size="13" :class="{ 'rotate-180': detailOpen }" class="transition-transform" />
        Detail
      </button>

      <div v-if="detailOpen" class="mt-1 flex flex-col gap-2">
        <label class="flex flex-col gap-0.5">
          <span class="text-[11px] font-medium text-text-muted">Alt text</span>
          <InlineEditText
            :model-value="item.alt_text ?? ''"
            placeholder="Deskripsi singkat"
            empty-label="Tambah alt text…"
            class="text-xs text-text-primary"
            @update:model-value="setAlt"
          />
        </label>
        <label class="flex flex-col gap-0.5">
          <span class="text-[11px] font-medium text-text-muted">Caption</span>
          <InlineEditText
            :model-value="item.caption ?? ''"
            placeholder="Keterangan media"
            empty-label="Tambah caption…"
            multiline
            class="text-xs text-text-primary"
            @update:model-value="setCaption"
          />
        </label>
      </div>
    </div>

    <!-- Aksi -->
    <div class="flex gap-2 border-t border-border p-2">
      <AppButton variant="secondary" size="sm" class="flex-1" @click="emit('copy', item)">
        <template #icon><Copy :size="14" /></template>
        Salin URL
      </AppButton>
      <AppButton variant="danger" size="sm" icon-only aria-label="Hapus" @click="emit('remove', item)">
        <template #icon><Trash2 :size="14" /></template>
      </AppButton>
    </div>
  </div>
</template>
