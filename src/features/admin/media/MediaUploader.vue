<!--
  src/features/admin/media/MediaUploader.vue
  Area unggah: drop/pilih file dengan validasi allow-list keamanan, unggah berurutan.
  Alt text & caption tidak lagi diisi saat upload — diedit inline pada kartu media.
-->
<script setup lang="ts">
import { ref } from 'vue';
import { Upload } from '@lucide/vue';
import FileDropzone from '@/components/app/FileDropzone.vue';
import AppCard from '@/components/app/AppCard.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import { mediaService } from '@/services/media.service';
import { useToast } from '@/composables/useToast';
import { ACCEPT_ATTR, MAX_UPLOAD_SIZE, validateUpload } from './upload.config';

const emit = defineEmits<{ uploaded: [] }>();

const toast = useToast();

const uploading = ref(false);
const currentFileName = ref('');

async function onFilesAdded(files: File[]): Promise<void> {
  if (uploading.value || !files.length) return;

  const valid: File[] = [];
  for (const file of files) {
    const message = validateUpload(file);
    if (message) toast.error(message);
    else valid.push(file);
  }
  if (!valid.length) return;

  uploading.value = true;
  let success = 0;
  try {
    for (const file of valid) {
      currentFileName.value = file.name;
      try {
        await mediaService.upload(file);
        success += 1;
      } catch {
        toast.error(`Gagal mengunggah ${file.name}.`);
      }
    }
  } finally {
    uploading.value = false;
    currentFileName.value = '';
  }

  if (success > 0) {
    toast.success(`${success} berkas berhasil diunggah.`);
    emit('uploaded');
  }
}
</script>

<template>
  <AppCard padding="md">
    <template #header>
      <div class="flex items-center gap-2">
        <Upload :size="18" class="text-primary" />
        <span class="text-sm font-semibold text-text-primary">Unggah Media</span>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <FileDropzone
        :accept="ACCEPT_ATTR"
        :multiple="true"
        :max-size="MAX_UPLOAD_SIZE"
        :simulate="false"
        :disabled="uploading"
        hint="Gambar, PDF, DOCX, XLSX, atau video — maks 50 MB"
        @files-added="onFilesAdded"
      />

      <div
        v-if="uploading"
        class="flex items-center gap-2 rounded-lg bg-bg-subtle px-3 py-2 text-sm text-text-muted"
      >
        <AppSpinner size="sm" />
        <span>Mengunggah {{ currentFileName }}…</span>
      </div>
    </div>
  </AppCard>
</template>
