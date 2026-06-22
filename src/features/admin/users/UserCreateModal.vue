<!--
  src/features/admin/users/UserCreateModal.vue
  Modal form buat user baru: email, password, multi-select role (checkbox). Emit 'created'.
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuery, useMutation } from '@tanstack/vue-query';
import { AxiosError } from 'axios';
import { userService } from '@/services/user.service';
import { useToast } from '@/composables/useToast';
import AppModal from '@/components/app/AppModal.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppCheckbox from '@/components/app/AppCheckbox.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import type { ApiError } from '@/types/api';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [open: boolean];
  created: [];
}>();

const toast = useToast();

const open = computed<boolean>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

interface FormState {
  email: string;
  password: string;
  roles: string[];
}
const form = reactive<FormState>({ email: '', password: '', roles: [] });
const fieldErrors = ref<Record<string, string>>({});

const rolesQuery = useQuery({
  queryKey: ['admin-roles'],
  queryFn: () => userService.roles(),
});

// Reset form setiap kali modal dibuka.
watch(open, (isOpen) => {
  if (isOpen) {
    form.email = '';
    form.password = '';
    form.roles = [];
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
    toast.error('Periksa kembali isian form.');
    return true;
  }
  return false;
}

const mutation = useMutation({
  mutationFn: () =>
    userService.create({
      email: form.email.trim(),
      password: form.password,
      roles: form.roles,
    }),
  onSuccess: () => {
    toast.success('User dibuat.');
    open.value = false;
    emit('created');
  },
  onError: (err) => {
    if (!applyValidationError(err)) toast.error('Gagal membuat user.');
  },
});

/** Toggle role pada array (AppCheckbox model-nya boolean per item). */
function toggleRole(name: string, checked: boolean): void {
  if (checked) {
    if (!form.roles.includes(name)) form.roles.push(name);
  } else {
    form.roles = form.roles.filter((r) => r !== name);
  }
}

function submit(): void {
  fieldErrors.value = {};
  mutation.mutate();
}
</script>

<template>
  <AppModal v-model="open" title="Tambah User" size="md">
    <form id="user-create-form" class="flex flex-col gap-4" @submit.prevent="submit">
      <AppInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="nama@contoh.com"
        required
        :error="fieldErrors.email"
      />
      <AppInput
        v-model="form.password"
        label="Password"
        type="password"
        required
        :error="fieldErrors.password"
      />

      <div class="flex flex-col gap-2">
        <span class="text-xs font-semibold text-text-primary">Roles</span>
        <div v-if="rolesQuery.isLoading.value" class="flex py-2">
          <AppSpinner size="sm" />
        </div>
        <p v-else-if="rolesQuery.isError.value" class="text-xs text-danger">
          Gagal memuat daftar role.
        </p>
        <p v-else-if="!rolesQuery.data.value?.length" class="text-xs text-text-muted">
          Tidak ada role tersedia.
        </p>
        <div v-else class="flex flex-col gap-2">
          <AppCheckbox
            v-for="role in rolesQuery.data.value"
            :key="role.id"
            :model-value="form.roles.includes(role.name)"
            :label="role.name"
            @update:model-value="(val: boolean) => toggleRole(role.name, val)"
          />
        </div>
        <p v-if="fieldErrors.roles" class="text-xs text-danger">{{ fieldErrors.roles }}</p>
      </div>
    </form>

    <template #footer>
      <AppButton variant="secondary" :disabled="mutation.isPending.value" @click="open = false">
        Batal
      </AppButton>
      <AppButton
        type="submit"
        form="user-create-form"
        variant="primary"
        :loading="mutation.isPending.value"
      >
        Simpan
      </AppButton>
    </template>
  </AppModal>
</template>
