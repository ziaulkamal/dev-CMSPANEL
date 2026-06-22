<!--
  src/features/admin/profile/AvatarPicker.vue
  Pemilih avatar self-service: pilih/upload media → tangkap media_id + URL.
  Reuse MediaPickerModal (emit { id, url, alt }). Preview bulat ala avatar.
-->
<script setup lang="ts">
import { ref } from 'vue';
import { ImagePlus, Trash2 } from '@lucide/vue';
import MediaPickerModal from '@/features/admin/contents/MediaPickerModal.vue';
import { resolveMediaUrl } from '@/lib/media';

const props = defineProps<{
  /** avatar_media_id terpilih (untuk dikirim ke backend). */
  modelValue: string | null;
  /** URL avatar saat ini (preview awal). */
  previewUrl?: string | null;
  displayName?: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [id: string | null];
  'update:previewUrl': [url: string | null];
}>();

const showPicker = ref(false);
const localPreview = ref<string | null>(props.previewUrl ?? null);

function initials(name?: string | null): string {
  const n = (name ?? '').trim();
  if (!n) return '?';
  const parts = n.split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : n.slice(0, 2).toUpperCase();
}

function onSelected(payload: { id: string; url: string }): void {
  localPreview.value = resolveMediaUrl(payload.url);
  emit('update:modelValue', payload.id);
  emit('update:previewUrl', payload.url);
}

function remove(): void {
  localPreview.value = null;
  emit('update:modelValue', null);
  emit('update:previewUrl', null);
}
</script>

<template>
  <div class="ap">
    <div class="ap__avatar">
      <img v-if="localPreview" :src="resolveMediaUrl(localPreview)" alt="Avatar" class="ap__img" />
      <span v-else class="ap__initials">{{ initials(displayName) }}</span>
    </div>
    <div class="ap__actions">
      <button type="button" class="ap__btn" @click="showPicker = true">
        <ImagePlus :size="14" /> {{ localPreview ? 'Ganti Foto' : 'Pilih Foto' }}
      </button>
      <button v-if="localPreview" type="button" class="ap__btn ap__btn--danger" @click="remove">
        <Trash2 :size="14" /> Hapus
      </button>
    </div>

    <MediaPickerModal v-model="showPicker" @select="onSelected" />
  </div>
</template>

<style scoped>
.ap { display: flex; align-items: center; gap: 16px; }
.ap__avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 22px;
  font-weight: 600;
  flex-shrink: 0;
  border: 2px solid var(--color-border);
}
.ap__img { width: 100%; height: 100%; object-fit: cover; }
.ap__initials { line-height: 1; }
.ap__actions { display: flex; flex-direction: column; gap: 8px; }
.ap__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 120ms ease;
}
.ap__btn:hover { border-color: #6366f1; color: #6366f1; }
.ap__btn--danger { color: var(--color-danger); }
.ap__btn--danger:hover { border-color: var(--color-danger); color: var(--color-danger); }
</style>
