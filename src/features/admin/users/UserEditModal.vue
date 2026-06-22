<!--
  src/features/admin/users/UserEditModal.vue
  Modal admin untuk mengubah data user lain: email, role, dan reset password (opsional).
  Emit 'updated' setelah berhasil.
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
import type { User } from '@/types/domain';

const props = defineProps<{ modelValue: boolean; user: User | null }>();
const emit = defineEmits<{
  'update:modelValue': [open: boolean];
  updated: [];
}>();

const toast = useToast();

const open = computed<boolean>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

interface FormState {
  email: string;
  roles: string[];
  newPassword: string;
}
const form = reactive<FormState>({ email: '', roles: [], newPassword: '' });
const fieldErrors = ref<Record<string, string>>({});

const rolesQuery = useQuery({
  queryKey: ['admin-roles'],
  queryFn: () => userService.roles(),
});

// Isi form dari user terpilih setiap kali modal dibuka.
watch(
  () => [open.value, props.user] as const,
  ([isOpen]) => {
    if (isOpen && props.user) {
      form.email = props.user.email;
      form.roles = [...props.user.roles];
      form.newPassword = '';
      fieldErrors.value = {};
    }
  },
  { immediate: true },
);

function mapValidation(err: unknown): boolean {
  const ax = err as AxiosError<ApiError>;
  if (ax.response?.data?.error?.code !== 'VALIDATION_ERROR') return false;
  const details = ax.response.data.error.details ?? {};
  const mapped: Record<string, string> = {};
  for (const [key, val] of Object.entries(details)) {
    mapped[key] = Array.isArray(val) ? String(val[0]) : String(val);
  }
  fieldErrors.value = mapped;
  toast.error('Periksa kembali isian form.');
  return true;
}

const mutation = useMutation({
  mutationFn: async (): Promise<void> => {
    const id = props.user!.id;
    await userService.update(id, { email: form.email.trim(), roles: form.roles });
    if (form.newPassword) await userService.resetPassword(id, form.newPassword);
  },
  onSuccess: () => {
    toast.success('User diperbarui.');
    open.value = false;
    emit('updated');
  },
  onError: (err) => {
    fieldErrors.value = {};
    if (!mapValidation(err)) toast.error('Gagal memperbarui user.');
  },
});

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
  <AppModal v-model="open" title="Edit User" size="md">
    <form id="user-edit-form" class="flex flex-col gap-4" @submit.prevent="submit">
      <AppInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="nama@contoh.com"
        required
        :error="fieldErrors.email"
      />

      <div class="flex flex-col gap-2">
        <span class="text-xs font-semibold text-text-primary">Roles</span>
        <div v-if="rolesQuery.isLoading.value" class="flex py-2">
          <AppSpinner size="sm" />
        </div>
        <p v-else-if="rolesQuery.isError.value" class="text-xs text-danger">
          Gagal memuat daftar role.
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

      <AppInput
        v-model="form.newPassword"
        label="Reset password (opsional)"
        type="password"
        placeholder="Kosongkan jika tidak diubah"
        hint="Isi untuk menetapkan password baru bagi user ini."
        :error="fieldErrors.password"
      />
    </form>

    <template #footer>
      <AppButton variant="secondary" :disabled="mutation.isPending.value" @click="open = false">
        Batal
      </AppButton>
      <AppButton
        type="submit"
        form="user-edit-form"
        variant="primary"
        :loading="mutation.isPending.value"
      >
        Simpan
      </AppButton>
    </template>
  </AppModal>
</template>
