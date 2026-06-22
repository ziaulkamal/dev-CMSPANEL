<!--
  src/features/admin/ads/AdSlotListView.vue
  Manajer posisi iklan/widget (req #8): tabel nama/tipe/posisi/status + CRUD via modal.
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { Megaphone } from '@lucide/vue';
import { adsService, type AdSlot } from '@/services/ads.service';
import { useToast } from '@/composables/useToast';
import { useIsMobile } from '@/composables/useIsMobile';
import AppCard from '@/components/app/AppCard.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppBadge from '@/components/app/AppBadge.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import AdSlotFormModal from './AdSlotFormModal.vue';

const isMobile = useIsMobile();
const toast = useToast();
const queryClient = useQueryClient();
const ADS_KEY = ['admin-ads'] as const;

const adsQuery = useQuery({ queryKey: ADS_KEY, queryFn: () => adsService.list() });
const slots = computed<AdSlot[]>(() => adsQuery.data.value ?? []);

const KIND_LABEL: Record<string, string> = {
  image: 'Gambar',
  javascript: 'JavaScript',
  adsense: 'AdSense',
};
const POSITION_LABEL: Record<string, string> = {
  in_post_below_title: 'Bawah judul',
  in_post_after_paragraph: 'Setelah paragraf',
  post_sidebar_left: 'Sidebar kiri',
  post_sidebar_bottom: 'Sidebar bawah',
  pre_comments: 'Sebelum komentar',
  floating_top_nav: 'Mengambang atas',
  floating_top_nav_mobile: 'Mengambang atas (mobile)',
  floating_bottom_timer: 'Mengambang bawah',
  flying_carpet: 'Flying carpet',
};

const modalOpen = ref(false);
const editTarget = ref<AdSlot | null>(null);

function openCreate(): void {
  editTarget.value = null;
  modalOpen.value = true;
}
function openEdit(slot: AdSlot): void {
  editTarget.value = slot;
  modalOpen.value = true;
}
function onSaved(): void {
  void queryClient.invalidateQueries({ queryKey: ADS_KEY });
}

const deleteTarget = ref<AdSlot | null>(null);
const deleteMutation = useMutation({
  mutationFn: () => adsService.remove(deleteTarget.value!.id),
  onSuccess: () => {
    toast.success('Ad slot dihapus.');
    deleteTarget.value = null;
    onSaved();
  },
  onError: () => toast.error('Gagal menghapus ad slot.'),
});
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Iklan / Widget</h1>
        <p class="mt-1 text-sm text-text-muted">Kelola slot iklan dan posisinya di situs.</p>
      </div>
      <Teleport to="#admin-action-bar" :disabled="!isMobile">
        <AppButton variant="primary" @click="openCreate">Tambah Slot</AppButton>
      </Teleport>
    </header>

    <div v-if="adsQuery.isLoading.value" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <AppEmptyState
      v-else-if="adsQuery.isError.value"
      title="Gagal memuat ad slot"
      description="Terjadi kesalahan. Coba muat ulang."
      :icon="Megaphone"
    />

    <AppEmptyState
      v-else-if="!slots.length"
      title="Belum ada ad slot"
      description="Tambahkan slot iklan pertama melalui tombol di atas."
      :icon="Megaphone"
    >
      <AppButton variant="primary" @click="openCreate">Tambah Slot</AppButton>
    </AppEmptyState>

    <AppCard v-else padding="none">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-border bg-bg-subtle">
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Nama</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Tipe</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Posisi</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Status</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-text-muted">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slot in slots" :key="slot.id" class="border-b border-border last:border-b-0">
              <td class="px-4 py-3 text-sm font-medium text-text-primary">{{ slot.name }}</td>
              <td class="px-4 py-3">
                <AppBadge color="info" size="sm">{{ KIND_LABEL[slot.kind] ?? slot.kind }}</AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-text-muted">
                {{ POSITION_LABEL[slot.position] ?? slot.position }}
              </td>
              <td class="px-4 py-3">
                <AppBadge :color="slot.active ? 'success' : 'default'" size="sm">
                  {{ slot.active ? 'Aktif' : 'Nonaktif' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <AppButton variant="secondary" size="xs" @click="openEdit(slot)">Edit</AppButton>
                  <AppButton variant="danger" size="xs" @click="deleteTarget = slot">Hapus</AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AdSlotFormModal v-model="modalOpen" :slot="editTarget" @saved="onSaved" />

    <ConfirmDialog
      :model-value="deleteTarget !== null"
      title="Hapus Ad Slot"
      :message="`Hapus slot &quot;${deleteTarget?.name}&quot;? Tindakan ini permanen.`"
      confirm-label="Hapus"
      :loading="deleteMutation.isPending.value"
      @update:model-value="(v) => { if (!v) deleteTarget = null; }"
      @confirm="deleteMutation.mutate()"
    />
  </section>
</template>
