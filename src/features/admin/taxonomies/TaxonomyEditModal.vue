<!--
  src/features/admin/taxonomies/TaxonomyEditModal.vue
  Modal edit taxonomy: label & mode hierarkis. Emit 'saved'.
-->
<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { taxonomyService } from '@/services/taxonomy.service';
import { useToast } from '@/composables/useToast';
import AppModal from '@/components/app/AppModal.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppCheckbox from '@/components/app/AppCheckbox.vue';
import AppButton from '@/components/app/AppButton.vue';
import type { Taxonomy } from '@/types/domain';

const props = defineProps<{ modelValue: boolean; taxonomy: Taxonomy | null }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; saved: [] }>();

const toast = useToast();
const open = computed<boolean>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const form = reactive({ label: '', hierarchical: false });

watch(
  () => props.taxonomy,
  (t) => {
    form.label = t?.label ?? '';
    form.hierarchical = t?.hierarchical ?? false;
  },
  { immediate: true },
);

const mutation = useMutation({
  mutationFn: () =>
    taxonomyService.update(props.taxonomy!.slug, {
      label: form.label.trim(),
      hierarchical: form.hierarchical,
    }),
  onSuccess: () => {
    toast.success('Taxonomy diperbarui.');
    open.value = false;
    emit('saved');
  },
  onError: () => toast.error('Gagal memperbarui taxonomy.'),
});
</script>

<template>
  <AppModal v-model="open" title="Edit Taxonomy" size="md">
    <form id="tax-edit-form" class="flex flex-col gap-4" @submit.prevent="mutation.mutate()">
      <AppInput :model-value="taxonomy?.slug ?? ''" label="Slug" disabled />
      <AppInput v-model="form.label" label="Label" required />
      <AppCheckbox v-model="form.hierarchical" label="Mendukung hierarki (parent-child)" />
    </form>
    <template #footer>
      <AppButton variant="secondary" :disabled="mutation.isPending.value" @click="open = false">
        Batal
      </AppButton>
      <AppButton
        type="submit"
        form="tax-edit-form"
        variant="primary"
        :loading="mutation.isPending.value"
      >
        Simpan
      </AppButton>
    </template>
  </AppModal>
</template>
