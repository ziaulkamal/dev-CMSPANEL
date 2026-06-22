<!-- src/components/ui/ConfirmDialog.vue — dialog konfirmasi reusable (mis. hapus). -->
<script setup lang="ts">
import { computed } from 'vue';
import AppModal from '@/components/app/AppModal.vue';
import AppButton from '@/components/app/AppButton.vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    danger?: boolean;
    loading?: boolean;
  }>(),
  { title: 'Konfirmasi', confirmLabel: 'Hapus', danger: true, loading: false },
);

const emit = defineEmits<{ 'update:modelValue': [v: boolean]; confirm: [] }>();

const open = computed<boolean>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});
</script>

<template>
  <AppModal v-model="open" :title="title" size="sm">
    <p class="text-sm text-text-muted">{{ message }}</p>
    <template #footer>
      <AppButton variant="secondary" :disabled="loading" @click="open = false">Batal</AppButton>
      <AppButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">
        {{ confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>
