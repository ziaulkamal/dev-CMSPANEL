<!--
  src/features/admin/taxonomies/TaxonomyCreateModal.vue
  Modal buat taxonomy baru (slug, label, hierarchical) — emit 'created' setelah sukses.
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { AxiosError } from 'axios';
import { taxonomyService } from '@/services/taxonomy.service';
import { useToast } from '@/composables/useToast';
import AppModal from '@/components/app/AppModal.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppCheckbox from '@/components/app/AppCheckbox.vue';
import AppButton from '@/components/app/AppButton.vue';
import type { ApiError } from '@/types/api';
import type { Taxonomy } from '@/types/domain';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; created: [taxonomy: Taxonomy] }>();

const toast = useToast();
const open = computed<boolean>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

interface FormState {
  slug: string;
  label: string;
  hierarchical: boolean;
}
const form = reactive<FormState>({ slug: '', label: '', hierarchical: false });
const fieldErrors = ref<Record<string, string>>({});

// Reset form tiap kali modal dibuka.
watch(open, (v) => {
  if (v) {
    form.slug = '';
    form.label = '';
    form.hierarchical = false;
    fieldErrors.value = {};
  }
});

function applyValidationError(err: unknown): boolean {
  const ax = err as AxiosError<ApiError>;
  if (ax.response?.data?.error?.code === 'VALIDATION_ERROR') {
    const details = ax.response.data.error.details ?? {};
    const mapped: Record<string, string> = {};
    for (const [key, val] of Object.entries(details)) {
      mapped[key] = Array.isArray(val) ? String(val[0]) : String(val);
    }
    fieldErrors.value = mapped;
    return true;
  }
  return false;
}

const mutation = useMutation({
  mutationFn: () =>
    taxonomyService.create({
      slug: form.slug.trim(),
      label: form.label.trim(),
      hierarchical: form.hierarchical,
    }),
  onSuccess: (taxonomy) => {
    toast.success('Taxonomy dibuat.');
    open.value = false;
    emit('created', taxonomy);
  },
  onError: (err) => {
    if (!applyValidationError(err)) toast.error('Gagal membuat taxonomy.');
  },
});
</script>

<template>
  <AppModal v-model="open" title="Taxonomy baru" size="md">
    <form id="taxonomy-create-form" class="flex flex-col gap-4" @submit.prevent="mutation.mutate()">
      <AppInput
        v-model="form.slug"
        label="Slug"
        placeholder="mis. category"
        required
        :error="fieldErrors.slug"
      />
      <AppInput
        v-model="form.label"
        label="Label"
        placeholder="mis. Kategori"
        required
        :error="fieldErrors.label"
      />
      <AppCheckbox v-model="form.hierarchical" label="Hierarkis (mendukung term induk)" />
    </form>
    <template #footer>
      <AppButton variant="secondary" :disabled="mutation.isPending.value" @click="open = false">
        Batal
      </AppButton>
      <AppButton
        type="submit"
        form="taxonomy-create-form"
        variant="primary"
        :loading="mutation.isPending.value"
      >
        Buat taxonomy
      </AppButton>
    </template>
  </AppModal>
</template>
