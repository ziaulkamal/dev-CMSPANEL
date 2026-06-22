<!--
  src/features/admin/widgets/WidgetListView.vue
  Manajer widget rail beranda (Populer / Pilihan Editor / Video / Opini).
  Disimpan sebagai satu array di settings 'home.widgets' (lihat widget.service),
  jadi setiap tambah/edit/hapus menyimpan ulang seluruh daftar (saveAll).
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { GalleryThumbnails } from '@lucide/vue';
import {
  widgetService,
  WIDGET_PLACEMENTS,
  type Widget,
} from '@/services/widget.service';
import { useToast } from '@/composables/useToast';
import { useIsMobile } from '@/composables/useIsMobile';
import AppCard from '@/components/app/AppCard.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppBadge from '@/components/app/AppBadge.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import WidgetFormModal from './WidgetFormModal.vue';

const isMobile = useIsMobile();
const toast = useToast();
const queryClient = useQueryClient();
const KEY = ['admin-widgets'] as const;

const widgetsQuery = useQuery({ queryKey: KEY, queryFn: () => widgetService.list() });
const widgets = computed<Widget[]>(() =>
  [...(widgetsQuery.data.value ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
);

const PLACEMENT_LABEL: Record<string, string> = Object.fromEntries(
  WIDGET_PLACEMENTS.map((p) => [p.value, p.label]),
);

const modalOpen = ref(false);
const editTarget = ref<Widget | null>(null);

function openCreate(): void {
  editTarget.value = null;
  modalOpen.value = true;
}
function openEdit(w: Widget): void {
  editTarget.value = w;
  modalOpen.value = true;
}

/** Simpan satu widget (baru/ubah) ke dalam array, lalu persist semua. */
const saveMutation = useMutation({
  mutationFn: (w: Widget) => {
    const list = [...(widgetsQuery.data.value ?? [])];
    const i = list.findIndex((x) => x.id === w.id);
    if (i >= 0) list[i] = w;
    else list.push(w);
    return widgetService.saveAll(list);
  },
  onSuccess: () => {
    toast.success('Widget disimpan.');
    modalOpen.value = false;
    void queryClient.invalidateQueries({ queryKey: KEY });
  },
  onError: () => toast.error('Gagal menyimpan widget.'),
});

const deleteTarget = ref<Widget | null>(null);
const deleteMutation = useMutation({
  mutationFn: () => {
    const list = (widgetsQuery.data.value ?? []).filter((x) => x.id !== deleteTarget.value!.id);
    return widgetService.saveAll(list);
  },
  onSuccess: () => {
    toast.success('Widget dihapus.');
    deleteTarget.value = null;
    void queryClient.invalidateQueries({ queryKey: KEY });
  },
  onError: () => toast.error('Gagal menghapus widget.'),
});
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Widget Beranda</h1>
        <p class="mt-1 text-sm text-text-muted">
          Kurasi rail beranda: Populer, Pilihan Editor, Video, Opini.
        </p>
      </div>
      <Teleport to="#admin-action-bar" :disabled="!isMobile">
        <AppButton variant="primary" @click="openCreate">Tambah Widget</AppButton>
      </Teleport>
    </header>

    <div v-if="widgetsQuery.isLoading.value" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <AppEmptyState
      v-else-if="!widgets.length"
      title="Belum ada widget"
      description="Tambahkan widget pertama melalui tombol di atas. Tanpa widget, rail memakai data default."
      :icon="GalleryThumbnails"
    >
      <AppButton variant="primary" @click="openCreate">Tambah Widget</AppButton>
    </AppEmptyState>

    <AppCard v-else padding="none">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-border bg-bg-subtle">
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Judul</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Penempatan</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Sumber</th>
              <th class="px-4 py-3 text-xs font-semibold text-text-muted">Status</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-text-muted">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in widgets" :key="w.id" class="border-b border-border last:border-b-0">
              <td class="px-4 py-3 text-sm font-medium text-text-primary">
                {{ w.title || PLACEMENT_LABEL[w.placement] }}
              </td>
              <td class="px-4 py-3 text-sm text-text-muted">
                {{ PLACEMENT_LABEL[w.placement] ?? w.placement }}
              </td>
              <td class="px-4 py-3">
                <AppBadge
                  :color="w.source_mode === 'auto' ? 'info' : w.source_mode === 'taxonomy' ? 'primary' : 'warning'"
                  size="sm"
                >
                  {{
                    w.source_mode === 'auto'
                      ? 'Otomatis'
                      : w.source_mode === 'taxonomy'
                        ? 'Taxonomy'
                        : `Manual (${w.manual.length})`
                  }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <AppBadge :color="w.active ? 'success' : 'default'" size="sm">
                  {{ w.active ? 'Aktif' : 'Nonaktif' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <AppButton variant="secondary" size="xs" @click="openEdit(w)">Edit</AppButton>
                  <AppButton variant="danger" size="xs" @click="deleteTarget = w">Hapus</AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <WidgetFormModal
      v-model="modalOpen"
      :widget="editTarget"
      :saving="saveMutation.isPending.value"
      @save="saveMutation.mutate($event)"
    />

    <ConfirmDialog
      :model-value="deleteTarget !== null"
      title="Hapus Widget"
      :message="`Hapus widget &quot;${deleteTarget?.title || PLACEMENT_LABEL[deleteTarget?.placement ?? '']}&quot;?`"
      confirm-label="Hapus"
      :loading="deleteMutation.isPending.value"
      @update:model-value="(v) => { if (!v) deleteTarget = null; }"
      @confirm="deleteMutation.mutate()"
    />
  </section>
</template>
