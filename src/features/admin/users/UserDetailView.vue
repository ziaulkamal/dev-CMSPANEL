<!--
  src/features/admin/users/UserDetailView.vue
  Detail user (re-style, req #5): header profil (avatar+nama+role+status),
  panel info (email, terdaftar, aktif terakhir), aksi admin (ban/unban).
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Ban, ShieldCheck, Mail, CalendarDays, Clock, AlertTriangle } from '@lucide/vue';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { resolveMediaUrl } from '@/lib/media';
import { daysAgo } from '@/lib/datetime';
import AppCard from '@/components/app/AppCard.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppBadge from '@/components/app/AppBadge.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppModal from '@/components/app/AppModal.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import UserStatusBadge from './UserStatusBadge.vue';
import type { User } from '@/types/domain';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const queryClient = useQueryClient();

const userId = computed(() => route.params.id as string);
const canBan = computed(() => auth.can('ban_users'));

const userQuery = useQuery({
  queryKey: computed(() => ['admin-user', userId.value]),
  queryFn: () => userService.get(userId.value),
});

const user = computed<User | null>(() => userQuery.data.value ?? null);
const avatarUrl = computed(() => (user.value?.avatar_url ? resolveMediaUrl(user.value.avatar_url) : ''));

function initials(name?: string | null): string {
  const n = (name ?? '').trim();
  if (!n) return '?';
  const parts = n.split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : n.slice(0, 2).toUpperCase();
}

function formatDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-';
}

function invalidate(): void {
  void queryClient.invalidateQueries({ queryKey: ['admin-user', userId.value] });
  void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
}

// ── Ban / Unban ───────────────────────────────────────────────────
const showBan = ref(false);
const banReason = ref('');
const showUnban = ref(false);

const banMutation = useMutation({
  mutationFn: () => userService.ban(userId.value, banReason.value.trim() || undefined),
  onSuccess: () => {
    toast.success('User diban.');
    showBan.value = false;
    banReason.value = '';
    invalidate();
  },
  onError: () => toast.error('Gagal memban user.'),
});

const unbanMutation = useMutation({
  mutationFn: () => userService.unban(userId.value),
  onSuccess: () => {
    toast.success('Ban dicabut.');
    showUnban.value = false;
    invalidate();
  },
  onError: () => toast.error('Gagal mencabut ban.'),
});
</script>

<template>
  <section class="flex max-w-3xl flex-col gap-6">
    <button
      class="flex w-fit items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      @click="router.push({ name: 'admin-users' })"
    >
      <ArrowLeft :size="15" /> Kembali ke daftar user
    </button>

    <div v-if="userQuery.isLoading.value" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <AppEmptyState
      v-else-if="userQuery.isError.value || !user"
      title="User tidak ditemukan"
      description="User mungkin telah dihapus atau ID tidak valid."
      :icon="AlertTriangle"
    />

    <template v-else>
      <!-- Header profil -->
      <AppCard padding="lg">
        <div class="flex flex-wrap items-center gap-5">
          <div class="ud-avatar">
            <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" class="ud-avatar__img" />
            <span v-else>{{ initials(user.display_name || user.email) }}</span>
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl font-bold text-text-primary">
                {{ user.display_name || user.email }}
              </h1>
              <UserStatusBadge :status="user.status" />
            </div>
            <p class="mt-0.5 text-sm text-text-muted">{{ user.email }}</p>
            <div class="mt-2 flex flex-wrap gap-1">
              <AppBadge v-for="role in user.roles" :key="role" color="primary" size="sm">
                {{ role }}
              </AppBadge>
            </div>
          </div>
          <div v-if="canBan" class="flex gap-2">
            <AppButton
              v-if="user.status !== 'banned'"
              variant="danger"
              size="sm"
              @click="showBan = true"
            >
              <Ban :size="14" /> Ban
            </AppButton>
            <AppButton v-else variant="secondary" size="sm" @click="showUnban = true">
              <ShieldCheck :size="14" /> Unban
            </AppButton>
          </div>
        </div>
      </AppCard>

      <!-- Panel info -->
      <AppCard padding="lg">
        <template #header>
          <span class="text-sm font-semibold text-text-primary">Informasi Akun</span>
        </template>
        <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex items-start gap-2">
            <Mail :size="15" class="mt-0.5 text-text-muted" />
            <div>
              <dt class="text-xs text-text-subtle">Email</dt>
              <dd class="text-sm text-text-primary">{{ user.email }}</dd>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <CalendarDays :size="15" class="mt-0.5 text-text-muted" />
            <div>
              <dt class="text-xs text-text-subtle">Terdaftar</dt>
              <dd class="text-sm text-text-primary">{{ formatDate(user.created_at) }}</dd>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <Clock :size="15" class="mt-0.5 text-text-muted" />
            <div>
              <dt class="text-xs text-text-subtle">Aktif terakhir</dt>
              <dd class="text-sm text-text-primary">{{ daysAgo(user.last_login_at) }}</dd>
            </div>
          </div>
          <div v-if="user.status === 'banned'" class="flex items-start gap-2">
            <AlertTriangle :size="15" class="mt-0.5 text-danger" />
            <div>
              <dt class="text-xs text-text-subtle">Alasan ban</dt>
              <dd class="text-sm text-text-primary">{{ user.banned_reason || '—' }}</dd>
            </div>
          </div>
        </dl>
      </AppCard>
    </template>

    <!-- Ban modal -->
    <AppModal v-model="showBan" title="Ban User" size="sm">
      <div class="flex flex-col gap-3">
        <p class="text-sm text-text-muted">
          Ban akun ini? Seluruh sesi akan dicabut dan user tak bisa login.
        </p>
        <AppInput v-model="banReason" label="Alasan (opsional)" placeholder="mis. spam" />
      </div>
      <template #footer>
        <AppButton variant="secondary" :disabled="banMutation.isPending.value" @click="showBan = false">
          Batal
        </AppButton>
        <AppButton variant="danger" :loading="banMutation.isPending.value" @click="banMutation.mutate()">
          Ban
        </AppButton>
      </template>
    </AppModal>

    <ConfirmDialog
      v-model="showUnban"
      title="Cabut Ban"
      message="Aktifkan kembali akun ini?"
      confirm-label="Unban"
      :danger="false"
      :loading="unbanMutation.isPending.value"
      @confirm="unbanMutation.mutate()"
    />
  </section>
</template>

<style scoped>
.ud-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 26px;
  font-weight: 700;
  flex-shrink: 0;
}
.ud-avatar__img { width: 100%; height: 100%; object-fit: cover; }
</style>
