<!-- src/features/admin/auth/LoginView.vue — login admin (desain AuthLayout starter E-GOV). -->
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import AuthLayout from '@/layouts/AuthLayout.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppCheckbox from '@/components/app/AppCheckbox.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();

const form = reactive({ email: '', password: '', remember: true });
const errors = reactive({ email: '', password: '' });
const loading = ref(false);
/** Teks progres di bawah tombol: kabari user sedang ke mana alurnya. */
const progress = ref('');

async function submit(): Promise<void> {
  errors.email = '';
  errors.password = '';
  if (!form.email) errors.email = 'Email wajib diisi.';
  if (!form.password) errors.password = 'Kata sandi wajib diisi.';
  if (errors.email || errors.password) return;

  loading.value = true;
  progress.value = 'Memverifikasi kredensial…';
  try {
    await auth.login(form.email, form.password);
    // login() sudah memuat identitas; bila gagal, sesi tidak terautentikasi.
    if (!auth.isAuthenticated) {
      throw new Error('SESSION_NOT_READY');
    }
    progress.value = 'Berhasil masuk, mengalihkan…';
    const redirect = (route.query.redirect as string) || '/admin';
    await router.push(redirect);
  } catch (err) {
    progress.value = '';
    toast.error(loginErrorMessage(err));
  } finally {
    loading.value = false;
  }
}

/** Pesan error login yang sesuai status (429 = rate limit, bukan salah sandi). */
function loginErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message === 'SESSION_NOT_READY') {
    return 'Masuk berhasil, tetapi sesi gagal dimuat. Coba lagi.';
  }
  const ax = err as AxiosError;
  const status = ax.response?.status;
  if (status === 429) {
    const retry = Number(ax.response?.headers?.['retry-after']);
    return Number.isFinite(retry) && retry > 0
      ? `Terlalu banyak percobaan. Coba lagi dalam ${retry} detik.`
      : 'Terlalu banyak percobaan masuk. Tunggu sebentar lalu coba lagi.';
  }
  if (status === 401 || status === 422 || status === 400) {
    return 'Email atau kata sandi salah.';
  }
  if (status === undefined) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
  }
  return 'Gagal masuk. Coba lagi nanti.';
}
</script>

<template>
  <AuthLayout title="Selamat datang" subtitle="Masuk ke panel CMS">
    <form class="auth-form" @submit.prevent="submit">
      <div class="auth-form__field">
        <label class="auth-form__label">Email</label>
        <AppInput
          v-model="form.email"
          type="email"
          placeholder="anda@contoh.com"
          :error="errors.email"
          size="md"
        />
      </div>

      <div class="auth-form__field">
        <div class="auth-form__label-row">
          <label class="auth-form__label">Kata sandi</label>
          <span class="auth-form__forgot">Lupa kata sandi?</span>
        </div>
        <AppInput
          v-model="form.password"
          type="password"
          placeholder="••••••••"
          :error="errors.password"
          size="md"
        />
      </div>

      <div class="auth-form__row">
        <AppCheckbox v-model="form.remember" label="Ingat saya" />
      </div>

      <AppButton type="submit" variant="primary" size="lg" :loading="loading" style="width:100%">
        Masuk
      </AppButton>

      <p v-if="loading && progress" class="auth-form__progress" role="status" aria-live="polite">
        {{ progress }}
      </p>
    </form>
  </AuthLayout>
</template>

<style scoped>
.auth-form { display: flex; flex-direction: column; gap: 18px; }
.auth-form__field { display: flex; flex-direction: column; gap: 6px; }
.auth-form__label { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.auth-form__label-row { display: flex; align-items: center; justify-content: space-between; }
.auth-form__forgot { font-size: 12.5px; color: var(--color-primary); font-weight: 500; cursor: pointer; }
.auth-form__forgot:hover { text-decoration: underline; }
.auth-form__row { display: flex; align-items: center; }
.auth-form__progress {
  margin: 0;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
