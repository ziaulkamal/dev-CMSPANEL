<!--
  src/features/admin/contents/FeaturedImagePicker.vue
  Pemilih Gambar Unggulan: file langsung di-upload ke MinIO saat dipilih,
  modelValue diisi URL nyata sehingga preview tampil seketika.
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ImagePlus, Trash2, ImageOff, Loader2, LibraryBig } from '@lucide/vue';
import { useToast } from '@/composables/useToast';
import { mediaService } from '@/services/media.service';
import { resolveMediaUrl } from '@/lib/media';
import MediaPickerModal from './MediaPickerModal.vue';

const props = defineProps<{
  modelValue: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const toast = useToast();
const inputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const imgError = ref(false);
const uploading = ref(false);
const showPicker = ref(false);

/** URL siap tampil (relatif → absolut bila perlu). */
const previewUrl = computed<string>(() => resolveMediaUrl(props.modelValue));

function openPicker(): void {
  if (props.disabled || uploading.value) return;
  showPicker.value = true;
}

function onMediaSelected(payload: { url: string }): void {
  imgError.value = false;
  emit('update:modelValue', payload.url);
}

// Reset status error tiap URL berubah (mis. setelah "Ganti").
watch(
  () => props.modelValue,
  () => {
    imgError.value = false;
  },
);

function pick(): void {
  if (props.disabled || uploading.value) return;
  inputRef.value?.click();
}

async function accept(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) {
    toast.error('File harus berupa gambar.');
    return;
  }
  imgError.value = false;
  uploading.value = true;
  try {
    const media = await mediaService.upload(file, { alt_text: file.name });
    if (!media.file_url) {
      toast.error('Upload berhasil tetapi URL gambar tidak diterima dari server.');
      return;
    }
    emit('update:modelValue', media.file_url);
    toast.success('Gambar unggulan diunggah.');
  } catch {
    toast.error('Gagal mengunggah gambar.');
  } finally {
    uploading.value = false;
  }
}

function onChange(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) void accept(file);
  (e.target as HTMLInputElement).value = '';
}

function onDrop(e: DragEvent): void {
  isDragging.value = false;
  if (props.disabled || uploading.value) return;
  const file = e.dataTransfer?.files?.[0];
  if (file) void accept(file);
}

function remove(): void {
  emit('update:modelValue', '');
}
</script>

<template>
  <div class="fip">
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      class="fip__input"
      :disabled="disabled"
      @change="onChange"
    />

    <!-- Preview -->
    <div v-if="modelValue" class="fip__preview">
      <img
        v-if="!imgError"
        :src="previewUrl"
        alt="Gambar unggulan"
        class="fip__img"
        @error="imgError = true"
        @load="imgError = false"
      />
      <div v-else class="fip__broken">
        <ImageOff :size="22" />
        <span>Gambar gagal dimuat</span>
      </div>
      <div class="fip__overlay">
        <button type="button" class="fip__act" :disabled="disabled || uploading" @click="openPicker">
          <LibraryBig :size="14" /> Dari Media
        </button>
        <button type="button" class="fip__act" :disabled="disabled || uploading" @click="pick">
          <ImagePlus :size="14" /> Upload
        </button>
        <button type="button" class="fip__act fip__act--danger" :disabled="disabled || uploading" @click="remove">
          <Trash2 :size="14" /> Hapus
        </button>
      </div>
      <div v-if="uploading" class="fip__loading">
        <Loader2 :size="20" class="fip__spin" />
      </div>
    </div>

    <!-- Empty: dropzone + dua aksi -->
    <div
      v-else
      class="fip__drop"
      :class="{ 'fip__drop--over': isDragging, 'fip__drop--disabled': disabled || uploading }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <Loader2 v-if="uploading" :size="26" class="fip__drop-icon fip__spin" />
      <ImagePlus v-else :size="26" class="fip__drop-icon" />
      <span class="fip__drop-text">{{ uploading ? 'Mengunggah…' : 'Tetapkan gambar unggulan' }}</span>
      <div v-if="!uploading" class="fip__drop-actions">
        <button type="button" class="fip__drop-btn" :disabled="disabled" @click="openPicker">
          <LibraryBig :size="14" /> Dari Media
        </button>
        <button type="button" class="fip__drop-btn fip__drop-btn--primary" :disabled="disabled" @click="pick">
          <ImagePlus :size="14" /> Upload Baru
        </button>
      </div>
    </div>

    <MediaPickerModal v-model="showPicker" @select="onMediaSelected" />
  </div>
</template>

<style scoped>
.fip__input { display: none; }

.fip__drop {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 26px 16px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-subtle);
  transition: all 180ms ease;
  color: var(--color-text-muted);
}
.fip__drop--over { border-color: #6366f1; border-style: solid; background: color-mix(in srgb, #6366f1 6%, var(--color-bg-subtle)); }
.fip__drop--disabled { opacity: 0.6; pointer-events: none; }
.fip__drop-icon { color: #6366f1; }
.fip__drop-text { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.fip__drop-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.fip__drop-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 120ms ease;
}
.fip__drop-btn:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
.fip__drop-btn--primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border-color: transparent;
}
.fip__drop-btn--primary:hover:not(:disabled) { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; }
.fip__drop-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.fip__preview {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1.5px solid var(--color-border);
}
.fip__img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; }
.fip__broken {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 12px;
  background: var(--color-danger-light);
  color: var(--color-danger);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}
.fip__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-surface) 70%, transparent);
}
.fip__spin { color: #6366f1; animation: fip-spin 0.8s linear infinite; }
@keyframes fip-spin { to { transform: rotate(360deg); } }
.fip__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0);
  opacity: 0;
  transition: all 180ms ease;
}
.fip__preview:hover .fip__overlay {
  background: rgba(15, 23, 42, 0.45);
  opacity: 1;
}
.fip__act {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.95);
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease;
}
.fip__act:hover:not(:disabled) { background: #fff; }
.fip__act--danger { color: #dc2626; }
.fip__act:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
