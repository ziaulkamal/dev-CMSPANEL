<!--
  src/features/admin/profile/ProfileView.vue
  Profil akun sendiri (self-service): foto + nama tampilan + email, ubah password,
  nonaktifkan akun (danger zone), info aktif terakhir.
-->
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { AxiosError } from 'axios';
import { KeyRound, Clock, UserCircle, AlertTriangle } from '@lucide/vue';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { daysAgo } from '@/lib/datetime';
import AppCard from '@/components/app/AppCard.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppButton from '@/components/app/AppButton.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import AvatarPicker from './AvatarPicker.vue';
import type { ApiError } from '@/types/api';

const auth = useAuthStore();
const toast = useToast();

// ── Profil (nama tampilan, email, avatar) ─────────────────────────
const profileForm = reactive({
  display_name: auth.me?.display_name ?? '',
  email: auth.me?.email ?? '',
  avatar_media_id: auth.me?.avatar_media_id ?? null,
  avatar_url: auth.me?.avatar_url ?? null,
});
const profileErrors = ref<Record<string, string>>({});

/** Petakan VALIDATION_ERROR → map field. Mengembalikan null bila bukan error validasi. */
function mapValidation(err: unknown): Record<string, string> | null {
  const ax = err as AxiosError<ApiError>;
  if (ax.response?.data?.error?.code !== 'VALIDATION_ERROR') return null;
  const details = ax.response.data.error.details ?? {};
  const mapped: Record<string, string> = {};
  for (const [key, val] of Object.entries(details)) {
    mapped[key] = Array.isArray(val) ? String(val[0]) : String(val);
  }
  return mapped;
}

const profileMutation = useMutation({
  mutationFn: () =>
    authService.updateProfile({
      display_name: profileForm.display_name.trim() || null,
      email: profileForm.email.trim(),
      avatar_media_id: profileForm.avatar_media_id,
    }),
  onSuccess: (me) => {
    auth.setMe(me);
    profileErrors.value = {};
    toast.success('Profil diperbarui.');
  },
  onError: (err) => {
    const mapped = mapValidation(err);
    if (mapped) profileErrors.value = mapped;
    else toast.error('Gagal memperbarui profil.');
  },
});

// ── Password ──────────────────────────────────────────────────────
const pwForm = reactive({ current_password: '', new_password: '', confirm: '' });
const pwErrors = ref<Record<string, string>>({});

const pwMutation = useMutation({
  mutationFn: () =>
    authService.changePassword({
      current_password: pwForm.current_password,
      new_password: pwForm.new_password,
    }),
  onSuccess: () => {
    pwErrors.value = {};
    pwForm.current_password = '';
    pwForm.new_password = '';
    pwForm.confirm = '';
    toast.success('Password diperbarui.');
  },
  onError: (err) => {
    const mapped = mapValidation(err);
    if (mapped) pwErrors.value = mapped;
    else toast.error('Gagal memperbarui password.');
  },
});

function submitPassword(): void {
  pwErrors.value = {};
  if (pwForm.new_password !== pwForm.confirm) {
    pwErrors.value = { confirm: 'Konfirmasi password tidak cocok.' };
    return;
  }
  pwMutation.mutate();
}

// ── Nonaktifkan akun (danger zone, req #5) ────────────────────────
const showDeactivate = ref(false);

const deactivateMutation = useMutation({
  mutationFn: () => authService.deactivate(),
  onSuccess: async () => {
    showDeactivate.value = false;
    toast.success('Akun dinonaktifkan.');
    await auth.logout();
    window.location.assign('/login');
  },
  onError: () => toast.error('Gagal menonaktifkan akun.'),
});
</script>

<template>
  <section class="flex max-w-2xl flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-text-primary">Profil Saya</h1>
      <p class="mt-1 flex items-center gap-2 text-sm text-text-muted">
        <Clock :size="14" />
        Aktif terakhir:
        <strong class="text-text-primary">{{ daysAgo(auth.me?.last_login_at) }}</strong>
      </p>
    </header>

    <!-- Profil: foto + nama + email -->
    <AppCard padding="lg">
      <template #header>
        <div class="flex items-center gap-2 text-text-muted">
          <UserCircle :size="15" />
          <span class="text-sm font-semibold text-text-primary">Profil</span>
        </div>
      </template>
      <form class="flex flex-col gap-4" @submit.prevent="profileMutation.mutate()">
        <AvatarPicker
          v-model="profileForm.avatar_media_id"
          v-model:preview-url="profileForm.avatar_url"
          :display-name="profileForm.display_name || profileForm.email"
        />
        <AppInput
          v-model="profileForm.display_name"
          label="Nama tampilan"
          placeholder="mis. Budi Santoso"
          :error="profileErrors.display_name"
        />
        <AppInput
          v-model="profileForm.email"
          label="Alamat email"
          type="email"
          required
          :error="profileErrors.email"
        />
        <div class="flex justify-end">
          <AppButton type="submit" variant="primary" :loading="profileMutation.isPending.value">
            Simpan Profil
          </AppButton>
        </div>
      </form>
    </AppCard>

    <!-- Password -->
    <AppCard padding="lg">
      <template #header>
        <div class="flex items-center gap-2 text-text-muted">
          <KeyRound :size="15" />
          <span class="text-sm font-semibold text-text-primary">Ubah Password</span>
        </div>
      </template>
      <form class="flex flex-col gap-4" @submit.prevent="submitPassword">
        <AppInput
          v-model="pwForm.current_password"
          label="Password saat ini"
          type="password"
          required
          :error="pwErrors.current_password"
        />
        <AppInput
          v-model="pwForm.new_password"
          label="Password baru"
          type="password"
          required
          :error="pwErrors.new_password"
        />
        <AppInput
          v-model="pwForm.confirm"
          label="Konfirmasi password baru"
          type="password"
          required
          :error="pwErrors.confirm"
        />
        <div class="flex justify-end">
          <AppButton type="submit" variant="primary" :loading="pwMutation.isPending.value">
            Ubah Password
          </AppButton>
        </div>
      </form>
    </AppCard>

    <!-- Danger zone: nonaktifkan akun -->
    <AppCard padding="lg" class="border-danger/40">
      <template #header>
        <div class="flex items-center gap-2 text-danger">
          <AlertTriangle :size="15" />
          <span class="text-sm font-semibold">Nonaktifkan Akun</span>
        </div>
      </template>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-text-muted">
          Menonaktifkan akun akan mengakhiri seluruh sesi Anda dan mencegah login hingga
          diaktifkan kembali oleh administrator.
        </p>
        <div class="flex justify-end">
          <AppButton variant="danger" @click="showDeactivate = true">Nonaktifkan Akun</AppButton>
        </div>
      </div>
    </AppCard>

    <ConfirmDialog
      v-model="showDeactivate"
      title="Nonaktifkan Akun"
      message="Anda yakin ingin menonaktifkan akun ini? Anda akan langsung keluar."
      confirm-label="Nonaktifkan"
      :loading="deactivateMutation.isPending.value"
      @confirm="deactivateMutation.mutate()"
    />
  </section>
</template>
