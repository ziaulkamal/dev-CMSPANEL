<!--
  src/features/admin/popups/PopupListView.vue
  Manajer popup konten: tabel nama/tipe/segmen/status + CRUD via modal.
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { MessageSquare } from '@lucide/vue';
import { popupService, type Popup } from '@/services/popup.service';
import { useToast } from '@/composables/useToast';
import { useIsMobile } from '@/composables/useIsMobile';
import AppCard from '@/components/app/AppCard.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppBadge from '@/components/app/AppBadge.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import PopupFormModal from './PopupFormModal.vue';

const isMobile = useIsMobile();
const toast = useToast();
const queryClient = useQueryClient();
const POPUP_KEY = ['admin-popups'] as const;

const popupsQuery = useQuery({ queryKey: POPUP_KEY, queryFn: () => popupService.list() });
const popups = computed<Popup[]>(() => popupsQuery.data.value ?? []);

const KIND_LABEL: Record<string, string> = {
  html: 'HTML / Rich text',
  image: 'Gambar + link',
};
const SCOPE_LABEL: Record<string, string> = {
  root: 'Beranda saja',
  all_public: 'Semua halaman',
};

const modalOpen = ref(false);
const editTarget = ref<Popup | null>(null);

function openCreate(): void {
  editTarget.value = null;
  modalOpen.value = true;
}
function openEdit(popup: Popup): void {
  editTarget.value = popup;
  modalOpen.value = true;
}
function onSaved(): void {
  void queryClient.invalidateQueries({ queryKey: POPUP_KEY });
}

const deleteTarget = ref<Popup | null>(null);
const deleteMutation = useMutation({
  mutationFn: () => popupService.remove(deleteTarget.value!.id),
  onSuccess: () => {
    toast.success('Popup dihapus.');
    deleteTarget.value = null;
    onSaved();
  },
  onError: () => toast.error('Gagal menghapus popup.'),
});
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Popup Konten</h1>
        <p class="mt-1 text-sm text-text-muted">Kelola popup promosi/pengumuman di situs publik.</p>
      </div>
      <Teleport to="#admin-action-bar" :disabled="!isMobile">
        <AppButton variant="primary" @click="openCreate">Tambah Popup</AppButton>
      </Teleport>
    </header>

    <div v-if="popupsQuery.isLoading.value" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <AppEmptyState
      v-else-if="popupsQuery.isError.value"
      title="Gagal memuat popup"
      description="Terjadi kesalahan. Coba muat ulang."
      :icon="MessageSquare"
    />

    <AppEmptyState
      v-else-if="!popups.length"
      title="Belum ada popup"
      description="Tambahkan popup pertama melalui tombol di atas."
      :icon="MessageSquare"
    >
      <AppButton variant="primary" @click="openCreate">Tambah Popup</AppButton>
    </AppEmptyState>

    <AppCard v-else padding="none">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-border bg-bg-subtle">
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Nama</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Tipe</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Tampil di</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Status</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-text-muted">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="popup in popups" :key="popup.id" class="border-b border-border last:border-b-0">
              <td class="px-4 py-3 text-sm font-medium text-text-primary">{{ popup.name }}</td>
              <td class="px-4 py-3">
                <AppBadge color="info" size="sm">{{ KIND_LABEL[popup.kind] ?? popup.kind }}</AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-text-muted">
                {{ SCOPE_LABEL[popup.display?.scope ?? 'all_public'] }}
              </td>
              <td class="px-4 py-3">
                <AppBadge :color="popup.active ? 'success' : 'default'" size="sm">
                  {{ popup.active ? 'Aktif' : 'Nonaktif' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <AppButton variant="secondary" size="xs" @click="openEdit(popup)">Edit</AppButton>
                  <AppButton variant="danger" size="xs" @click="deleteTarget = popup">Hapus</AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <PopupFormModal v-model="modalOpen" :popup="editTarget" @saved="onSaved" />

    <ConfirmDialog
      :model-value="deleteTarget !== null"
      title="Hapus Popup"
      :message="`Hapus popup &quot;${deleteTarget?.name}&quot;? Tindakan ini permanen.`"
      confirm-label="Hapus"
      :loading="deleteMutation.isPending.value"
      @update:model-value="(v) => { if (!v) deleteTarget = null; }"
      @confirm="deleteMutation.mutate()"
    />
  </section>
</template>
