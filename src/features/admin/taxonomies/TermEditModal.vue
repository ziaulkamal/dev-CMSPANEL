<!--
  src/features/admin/taxonomies/TermEditModal.vue
  Modal edit term: nama, slug, induk (bila taxonomy hierarkis). Emit 'saved'.
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

const props = defineProps<{
  modelValue: boolean;
  taxonomy: Taxonomy;
  term: Term | null;
  terms: Term[];
}>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; saved: [] }>();

const toast = useToast();
const open = computed<boolean>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const form = reactive({ name: '', slug: '', parent_id: '' });
const fieldErrors = ref<Record<string, string>>({});

// Isi ulang form saat term yang diedit berubah.
watch(
  () => props.term,
  (t) => {
    form.name = t?.name ?? '';
    form.slug = t?.slug ?? '';
    form.parent_id = t?.parent_id ?? '';
    fieldErrors.value = {};
  },
  { immediate: true },
);

/** Opsi induk: semua term lain (tak boleh diri sendiri). */
const parentOptions = computed<{ value: string; label: string }[]>(() => [
  { value: '', label: 'Tanpa induk' },
  ...props.terms
    .filter((t) => t.id !== props.term?.id)
    .map((t) => ({ value: t.id, label: t.name })),
]);

function applyValidationError(err: unknown): boolean {
  const ax = err as AxiosError<ApiError>;
  const code = ax.response?.data?.error?.code;
  if (code === 'VALIDATION_ERROR') {
    const details = ax.response?.data?.error?.details ?? {};
    const mapped: Record<string, string> = {};
    for (const [key, val] of Object.entries(details)) {
      mapped[key] = Array.isArray(val) ? String(val[0]) : String(val);
    }
    fieldErrors.value = mapped;
    toast.error('Periksa kembali isian.');
    return true;
  }
  if (code === 'INVALID_PARENT') {
    toast.error(ax.response?.data?.error?.message ?? 'Induk tidak valid.');
    return true;
  }
  return false;
}

const mutation = useMutation({
  mutationFn: () =>
    taxonomyService.updateTerm(props.taxonomy.slug, props.term!.id, {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      parent_id: props.taxonomy.hierarchical ? form.parent_id || null : undefined,
    }),
  onSuccess: () => {
    toast.success('Term diperbarui.');
    open.value = false;
    emit('saved');
  },
  onError: (err) => {
    if (applyValidationError(err)) return;
    const ax = err as AxiosError<ApiError>;
    const msg = ax.response?.data?.error?.message;
    toast.error(msg ? `Gagal memperbarui term: ${msg}` : 'Gagal memperbarui term.');
  },
});
</script>

<template>
  <AppModal v-model="open" title="Edit Term" size="md">
    <form id="term-edit-form" class="flex flex-col gap-4" @submit.prevent="mutation.mutate()">
      <AppInput v-model="form.name" label="Nama term" required :error="fieldErrors.name" />
      <AppInput v-model="form.slug" label="Slug" :error="fieldErrors.slug" />
      <AppSelect
        v-if="taxonomy.hierarchical"
        v-model="form.parent_id"
        label="Induk"
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
        form="term-edit-form"
        variant="primary"
        :loading="mutation.isPending.value"
      >
        Simpan
      </AppButton>
    </template>
  </AppModal>
</template>
