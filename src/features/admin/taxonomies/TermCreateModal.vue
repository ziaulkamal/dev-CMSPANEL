<!--
  src/features/admin/taxonomies/TermCreateModal.vue
  Modal buat term pada taxonomy terpilih (name, slug opsional, parent opsional bila hierarkis).
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { AxiosError } from 'axios';
import { taxonomyService } from '@/services/taxonomy.service';
import { useToast } from '@/composables/useToast';
import AppModal from '@/components/app/AppModal.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppSelect from '@/components/app/AppSelect.vue';
import AppButton from '@/components/app/AppButton.vue';
import type { ApiError } from '@/types/api';
import type { Taxonomy, Term } from '@/types/domain';

const props = defineProps<{ modelValue: boolean; taxonomy: Taxonomy; terms: Term[] }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; created: [term: Term] }>();

const toast = useToast();
const open = computed<boolean>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

interface FormState {
  name: string;
  slug: string;
  parent_id: string;
}
const form = reactive<FormState>({ name: '', slug: '', parent_id: '' });
const fieldErrors = ref<Record<string, string>>({});

// Reset form tiap kali modal dibuka.
watch(open, (v) => {
  if (v) {
    form.name = '';
    form.slug = '';
    form.parent_id = '';
    fieldErrors.value = {};
  }
});

const parentOptions = computed<{ value: string; label: string }[]>(() => [
  { value: '', label: 'Tanpa induk' },
  ...props.terms.map((t) => ({ value: t.id, label: t.name })),
]);

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
  mutationFn: () => {
    const slug = form.slug.trim();
    const parentId = form.parent_id.trim();
    return taxonomyService.createTerm(props.taxonomy.slug, {
      name: form.name.trim(),
      slug: slug ? slug : undefined,
      parent_id: parentId ? parentId : undefined,
    });
  },
  onSuccess: (term) => {
    toast.success('Term ditambahkan.');
    open.value = false;
    emit('created', term);
  },
  onError: (err) => {
    if (!applyValidationError(err)) toast.error('Gagal menambahkan term.');
  },
});
</script>

<template>
  <AppModal v-model="open" :title="`Tambah term — ${taxonomy.label}`" size="md">
    <form id="term-create-form" class="flex flex-col gap-4" @submit.prevent="mutation.mutate()">
      <AppInput
        v-model="form.name"
        label="Nama term"
        placeholder="mis. Teknologi"
        required
        :error="fieldErrors.name"
      />
      <AppInput
        v-model="form.slug"
        label="Slug (opsional)"
        placeholder="otomatis bila kosong"
        :error="fieldErrors.slug"
      />
      <AppSelect
        v-if="taxonomy.hierarchical"
        v-model="form.parent_id"
        label="Induk (opsional)"
        :options="parentOptions"
        native
        :error="fieldErrors.parent_id"
      />
    </form>
    <template #footer>
      <AppButton variant="secondary" :disabled="mutation.isPending.value" @click="open = false">
        Batal
      </AppButton>
      <AppButton
        type="submit"
        form="term-create-form"
        variant="primary"
        :loading="mutation.isPending.value"
      >
        Tambah term
      </AppButton>
    </template>
  </AppModal>
</template>
