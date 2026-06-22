<!--
  src/features/admin/users/UserListView.vue
  Daftar user & RBAC: tabel email/roles/tanggal + tombol tambah user (modal).
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import { Users, Ban, ShieldCheck } from '@lucide/vue';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import AppCard from '@/components/app/AppCard.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppBadge from '@/components/app/AppBadge.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppModal from '@/components/app/AppModal.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import UserCreateModal from './UserCreateModal.vue';
import UserEditModal from './UserEditModal.vue';
import UserStatusBadge from './UserStatusBadge.vue';
import { useIsMobile } from '@/composables/useIsMobile';
import { daysAgo } from '@/lib/datetime';
import type { User } from '@/types/domain';

const isMobile = useIsMobile();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const queryClient = useQueryClient();
const USERS_KEY = ['admin-users'] as const;

const canBan = computed(() => auth.can('ban_users'));

const usersQuery = useQuery({
  queryKey: USERS_KEY,
  queryFn: () => userService.list(),
});

const users = computed<User[]>(() => usersQuery.data.value ?? []);

const modalOpen = ref(false);
const editTarget = ref<User | null>(null);
const editOpen = computed<boolean>({
  get: () => editTarget.value !== null,
  set: (open) => {
    if (!open) editTarget.value = null;
  },
});

function openCreate(): void {
  modalOpen.value = true;
}
function openEdit(user: User): void {
  editTarget.value = user;
}
function openDetail(user: User): void {
  void router.push({ name: 'admin-user-detail', params: { id: user.id } });
}

function onMutated(): void {
  void queryClient.invalidateQueries({ queryKey: USERS_KEY });
}

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString('id-ID') : '-';
}

// ── Ban / Unban ───────────────────────────────────────────────────
const banTarget = ref<User | null>(null);
const banReason = ref('');
const unbanTarget = ref<User | null>(null);

const banMutation = useMutation({
  mutationFn: () => userService.ban(banTarget.value!.id, banReason.value.trim() || undefined),
  onSuccess: () => {
    toast.success('User diban.');
    banTarget.value = null;
    banReason.value = '';
    onMutated();
  },
  onError: () => toast.error('Gagal memban user.'),
});

const unbanMutation = useMutation({
  mutationFn: () => userService.unban(unbanTarget.value!.id),
  onSuccess: () => {
    toast.success('Ban dicabut.');
    unbanTarget.value = null;
    onMutated();
  },
  onError: () => toast.error('Gagal mencabut ban.'),
});
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Users</h1>
        <p class="mt-1 text-sm text-text-muted">Kelola akun dan penetapan role.</p>
      </div>
      <Teleport to="#admin-action-bar" :disabled="!isMobile">
        <AppButton variant="primary" @click="openCreate">Tambah User</AppButton>
      </Teleport>
    </header>

    <div v-if="usersQuery.isLoading.value" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <AppEmptyState
      v-else-if="usersQuery.isError.value"
      title="Gagal memuat user"
      description="Terjadi kesalahan saat mengambil daftar user. Coba muat ulang."
      :icon="Users"
    />

    <AppEmptyState
      v-else-if="!users.length"
      title="Belum ada user"
      description="Tambahkan user pertama melalui tombol di atas."
      :icon="Users"
    >
      <AppButton variant="primary" @click="openCreate">Tambah User</AppButton>
    </AppEmptyState>

    <AppCard v-else padding="none">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-border bg-bg-subtle">
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">User</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Roles</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Status</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Aktif terakhir</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Dibuat</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-text-muted">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-b border-border last:border-b-0">
              <td class="px-4 py-3">
                <button
                  class="text-sm font-medium text-text-primary hover:text-primary"
                  @click="openDetail(user)"
                >
                  {{ user.display_name || user.email }}
                </button>
                <p v-if="user.display_name" class="text-xs text-text-subtle">{{ user.email }}</p>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <AppBadge
                    v-for="role in user.roles"
                    :key="role"
                    color="primary"
                    size="sm"
                  >
                    {{ role }}
                  </AppBadge>
                  <span v-if="!user.roles.length" class="text-sm text-text-subtle">-</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <UserStatusBadge :status="user.status" />
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-text-muted">
                {{ daysAgo(user.last_login_at) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-text-subtle">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <AppButton variant="ghost" size="xs" @click="openDetail(user)">Detail</AppButton>
                  <AppButton variant="secondary" size="xs" @click="openEdit(user)">Edit</AppButton>
                  <AppButton
                    v-if="canBan && user.status !== 'banned'"
                    variant="danger"
                    size="xs"
                    @click="banTarget = user"
                  >
                    <Ban :size="13" /> Ban
                  </AppButton>
                  <AppButton
                    v-if="canBan && user.status === 'banned'"
                    variant="secondary"
                    size="xs"
                    @click="unbanTarget = user"
                  >
                    <ShieldCheck :size="13" /> Unban
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <UserCreateModal v-model="modalOpen" @created="onMutated" />
    <UserEditModal v-model="editOpen" :user="editTarget" @updated="onMutated" />

    <!-- Ban: modal dengan alasan -->
    <AppModal
      :model-value="banTarget !== null"
      title="Ban User"
      size="sm"
      @update:model-value="(v) => { if (!v) { banTarget = null; banReason = ''; } }"
    >
      <div class="flex flex-col gap-3">
        <p class="text-sm text-text-muted">
          Ban <strong class="text-text-primary">{{ banTarget?.display_name || banTarget?.email }}</strong>?
          Seluruh sesi akan dicabut dan user tak bisa login.
        </p>
        <AppInput v-model="banReason" label="Alasan (opsional)" placeholder="mis. spam" />
      </div>
      <template #footer>
        <AppButton variant="secondary" :disabled="banMutation.isPending.value" @click="banTarget = null">
          Batal
        </AppButton>
        <AppButton variant="danger" :loading="banMutation.isPending.value" @click="banMutation.mutate()">
          Ban
        </AppButton>
      </template>
    </AppModal>

    <!-- Unban: konfirmasi sederhana -->
    <ConfirmDialog
      :model-value="unbanTarget !== null"
      title="Cabut Ban"
      :message="`Aktifkan kembali ${unbanTarget?.display_name || unbanTarget?.email}?`"
      confirm-label="Unban"
      :danger="false"
      :loading="unbanMutation.isPending.value"
      @update:model-value="(v) => { if (!v) unbanTarget = null; }"
      @confirm="unbanMutation.mutate()"
    />
  </section>
</template>
