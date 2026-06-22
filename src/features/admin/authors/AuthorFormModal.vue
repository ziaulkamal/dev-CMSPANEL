<!--
  src/features/admin/authors/AuthorFormModal.vue
  Form penulis (byline): nama, bio, avatar, tautan sosial. Create/Update via
  authorService (manage_users). Avatar memakai FeaturedImagePicker (menyimpan URL).
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { Plus, Trash2 } from '@lucide/vue';
import { authorService } from '@/services/author.service';
import { useToast } from '@/composables/useToast';
import type { Author } from '@/types/domain';
import AppModal from '@/components/app/AppModal.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppTextarea from '@/components/app/AppTextarea.vue';
import AppButton from '@/components/app/AppButton.vue';
import FeaturedImagePicker from '@/features/admin/contents/FeaturedImagePicker.vue';

const props = defineProps<{ modelValue: boolean; author: Author | null }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; saved: [] }>();

const toast = useToast();

const open = computed<boolean>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});
const isEdit = computed(() => props.author !== null);

interface SocialRow {
  platform: string;
  url: string;
}
interface FormState {
  display_name: string;
  bio: string;
  avatar: string;
}
const form = reactive<FormState>({ display_name: '', bio: '', avatar: '' });
const socials = ref<SocialRow[]>([]);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return;
    form.display_name = '';
    form.bio = '';
    form.avatar = '';
    socials.value = [];
    const a = props.author;
    if (!a) return;
    form.display_name = a.display_name;
    form.bio = a.bio ?? '';
    form.avatar = a.avatar_media_id ?? '';
    socials.value = Object.entries(a.social_links ?? {}).map(([platform, url]) => ({ platform, url }));
  },
);

function addSocial(): void {
  socials.value.push({ platform: '', url: '' });
}
function removeSocial(i: number): void {
  socials.value.splice(i, 1);
}

function buildSocialLinks(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of socials.value) {
    const key = s.platform.trim().toLowerCase();
    if (key && s.url.trim()) out[key] = s.url.trim();
  }
  return out;
}

const mutation = useMutation({
  mutationFn: () => {
    const payload = {
      display_name: form.display_name.trim(),
      bio: form.bio.trim(),
      avatar_media_id: form.avatar || null,
      social_links: buildSocialLinks(),
    };
    return props.author
      ? authorService.update(props.author.id, payload)
      : authorService.create(payload);
  },
  onSuccess: () => {
    toast.success(isEdit.value ? 'Penulis diperbarui.' : 'Penulis dibuat.');
    emit('saved');
    open.value = false;
  },
  onError: () => toast.error('Gagal menyimpan penulis.'),
});

function submit(): void {
  if (!form.display_name.trim()) {
    toast.error('Nama tampilan wajib diisi.');
    return;
  }
  mutation.mutate();
}
</script>

<template>
  <AppModal v-model="open" :title="isEdit ? 'Ubah Penulis' : 'Tambah Penulis'" size="md">
    <div class="flex flex-col gap-4">
      <AppInput v-model="form.display_name" label="Nama tampilan" placeholder="mis. Lina Marwah" required />

      <div>
        <span class="mb-1.5 block text-xs font-semibold text-text-primary">Avatar</span>
        <FeaturedImagePicker v-model="form.avatar" />
      </div>

      <AppTextarea v-model="form.bio" label="Bio" :rows="3" placeholder="Deskripsi singkat penulis" />

      <!-- Tautan sosial -->
      <div class="flex flex-col gap-2">
        <span class="text-xs font-semibold text-text-primary">Tautan sosial</span>
        <div v-for="(s, i) in socials" :key="i" class="flex items-end gap-2">
          <AppInput v-model="s.platform" label="Platform" placeholder="twitter" class="w-1/3" />
          <AppInput v-model="s.url" label="URL" placeholder="https://…" class="flex-1" />
          <AppButton variant="ghost" size="md" icon-only aria-label="Hapus" @click="removeSocial(i)">
            <template #icon><Trash2 :size="14" /></template>
          </AppButton>
        </div>
        <div>
          <AppButton variant="secondary" size="sm" @click="addSocial">
            <template #icon><Plus :size="14" /></template>
            Tambah tautan
          </AppButton>
        </div>
      </div>
    </div>

    <template #footer>
      <AppButton variant="secondary" :disabled="mutation.isPending.value" @click="open = false">
        Batal
      </AppButton>
      <AppButton variant="primary" :loading="mutation.isPending.value" @click="submit">
        {{ isEdit ? 'Simpan' : 'Buat' }}
      </AppButton>
    </template>
  </AppModal>
</template>
