<!-- src/features/admin/contents/ContentListView.vue — listing konten admin (tab tipe, filter status & pencarian, CRUD aksi). -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { Search, FileText, File as FileIcon, Film, Images, Radio } from '@lucide/vue';
import { contentService } from '@/services/content.service';
import { useToast } from '@/composables/useToast';
import { useIsMobile } from '@/composables/useIsMobile';
import AppCard from '@/components/app/AppCard.vue';
import AppSelect from '@/components/app/AppSelect.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppBadge from '@/components/app/AppBadge.vue';
import AppModal from '@/components/app/AppModal.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import ContentTypeTabs from './ContentTypeTabs.vue';
import { typeLabel } from './editor.config';
import type { ContentStatus, ContentSummary, ContentType } from '@/types/domain';

const toast = useToast();
const queryClient = useQueryClient();
const isMobile = useIsMobile();

// ── Filter state ──────────────────────────────────────────────────
const activeType = ref<ContentType>('post');
const status = ref<ContentStatus | ''>('');
const search = ref('');

const statusOptions = [
  { value: '', label: 'Semua status' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Menunggu Review' },
  { value: 'scheduled', label: 'Terjadwal' },
  { value: 'published', label: 'Terbit' },
  { value: 'archived', label: 'Arsip' },
  { value: 'trashed', label: 'Sampah' },
];

/** Post = artikel terbaru (urut tanggal terbit). Page & lainnya statis (urut dibuat). */
const isPost = computed(() => activeType.value === 'post');
const sortKey = computed(() => (isPost.value ? '-published_at' : '-created_at'));

const { data, isLoading } = useQuery({
  queryKey: ['admin-contents', activeType, status],
  queryFn: () =>
    contentService.list({
      type: activeType.value,
      limit: 50,
      sort: sortKey.value,
      ...(status.value ? { status: status.value } : {}),
    }),
});

const TYPE_ICON: Record<ContentType, unknown> = {
  post: FileText,
  page: FileIcon,
  video: Film,
  gallery: Images,
  live_report: Radio,
};

// Pencarian judul difilter di sisi klien (backend listing belum mendukung keyword).
const rows = computed<ContentSummary[]>(() => {
  const list = data.value?.data ?? [];
  const q = search.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter((c) => c.title.toLowerCase().includes(q));
});

const hasActiveFilter = computed(() => !!status.value || !!search.value.trim());
function resetFilters(): void {
  status.value = '';
  search.value = '';
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ── Hapus (soft delete) dengan konfirmasi ─────────────────────────
const deleteTarget = ref<ContentSummary | null>(null);
const showDelete = computed<boolean>({
  get: () => deleteTarget.value !== null,
  set: (open) => {
    if (!open) deleteTarget.value = null;
  },
});

const deleteMutation = useMutation({
  mutationFn: (id: string) => contentService.remove(id),
  onSuccess: () => {
    toast.success('Konten dipindahkan ke sampah.');
    void queryClient.invalidateQueries({ queryKey: ['admin-contents'] });
    deleteTarget.value = null;
  },
  onError: () => toast.error('Gagal menghapus konten.'),
});

function askDelete(item: ContentSummary): void {
  deleteTarget.value = item;
}
function confirmDelete(): void {
  if (deleteTarget.value) deleteMutation.mutate(deleteTarget.value.id);
}
</script>

<template>
  <section>
    <div class="mb-4 flex items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">Konten</h1>
      <!-- Desktop: tombol di header. Mobile: di-teleport ke action bar bawah. -->
      <Teleport to="#admin-action-bar" :disabled="!isMobile">
        <AppButton variant="primary" tag="router-link" :to="{ name: 'admin-content-new' }">
          Tambah {{ typeLabel(activeType) }}
        </AppButton>
      </Teleport>
    </div>

    <!-- Tab tipe konten -->
    <ContentTypeTabs v-model="activeType" class="mb-4" />

    <!-- Toolbar: pencarian + filter status -->
    <div class="filter-bar mb-4">
      <div class="filter-bar__search">
        <AppInput v-model="search" placeholder="Cari judul…" clearable>
          <template #prefix><Search :size="16" /></template>
        </AppInput>
      </div>
      <div class="filter-bar__status">
        <AppSelect v-model="status" :options="statusOptions" native />
      </div>
    </div>

    <!-- Ringkasan hasil + reset filter -->
    <div class="mb-3 flex items-center gap-3 text-sm text-text-muted">
      <span>{{ rows.length }} {{ typeLabel(activeType).toLowerCase() }}</span>
      <button
        v-if="hasActiveFilter"
        type="button"
        class="text-primary hover:underline"
        @click="resetFilters"
      >
        Reset filter
      </button>
    </div>

    <AppCard padding="none">
      <p v-if="isLoading" class="p-6 text-sm text-text-muted">Memuat…</p>
      <AppEmptyState
        v-else-if="!rows.length"
        :title="hasActiveFilter ? 'Tidak ada hasil' : `Belum ada ${typeLabel(activeType).toLowerCase()}`"
      />

      <!-- ── Desktop: tabel ── -->
      <table v-else class="content-table w-full text-left text-sm">
        <thead class="border-b border-border text-text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">Judul</th>
            <th class="px-4 py-3 font-medium">Tipe</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th v-if="isPost" class="px-4 py-3 font-medium">Terbit</th>
            <th class="px-4 py-3 text-right font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in rows"
            :key="item.id"
            class="border-b border-border last:border-0 hover:bg-bg-subtle"
          >
            <td class="px-4 py-3 font-medium text-text-primary">{{ item.title }}</td>
            <td class="px-4 py-3">
              <AppBadge color="default" size="sm">
                <template #icon><component :is="TYPE_ICON[item.type]" :size="12" /></template>
                {{ typeLabel(item.type) }}
              </AppBadge>
            </td>
            <td class="px-4 py-3">
              <StatusBadge v-if="item.status" :status="item.status" />
            </td>
            <td v-if="isPost" class="px-4 py-3 whitespace-nowrap text-text-muted">
              {{ formatDate(item.published_at) }}
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-2">
                <AppButton
                  variant="secondary"
                  size="xs"
                  tag="router-link"
                  :to="{ name: 'admin-content-edit', params: { id: item.id } }"
                >
                  Edit
                </AppButton>
                <AppButton variant="danger" size="xs" @click="askDelete(item)">Hapus</AppButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ── Mobile: daftar kartu ── -->
      <ul v-if="rows.length" class="content-cards">
        <li v-for="item in rows" :key="item.id" class="content-card">
          <div class="content-card__main">
            <p class="content-card__title">{{ item.title }}</p>
            <div class="content-card__meta">
              <AppBadge color="default" size="sm">
                <template #icon><component :is="TYPE_ICON[item.type]" :size="12" /></template>
                {{ typeLabel(item.type) }}
              </AppBadge>
              <StatusBadge v-if="item.status" :status="item.status" />
            </div>
            <p v-if="isPost" class="content-card__date">{{ formatDate(item.published_at) }}</p>
          </div>
          <div class="content-card__actions">
            <AppButton
              variant="secondary"
              size="sm"
              tag="router-link"
              :to="{ name: 'admin-content-edit', params: { id: item.id } }"
            >
              Edit
            </AppButton>
            <AppButton variant="danger" size="sm" @click="askDelete(item)">Hapus</AppButton>
          </div>
        </li>
      </ul>
    </AppCard>

    <AppModal v-model="showDelete" title="Hapus Konten">
      <p class="text-sm text-text-primary">
        Yakin ingin memindahkan
        <strong>{{ deleteTarget?.title }}</strong>
        ke sampah?
      </p>
      <template #footer>
        <AppButton variant="ghost" size="sm" @click="showDelete = false">Batal</AppButton>
        <AppButton
          variant="danger"
          size="sm"
          :loading="deleteMutation.isPending.value"
          @click="confirmDelete"
        >
          Hapus
        </AppButton>
      </template>
    </AppModal>
  </section>
</template>

<style scoped>
/* ── Toolbar filter ── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.filter-bar__search {
  flex: 1;
  max-width: 420px;
}
.filter-bar__status {
  width: 180px;
  flex-shrink: 0;
}

/* Default (desktop): tabel tampil, kartu disembunyikan. */
.content-cards {
  display: none;
}

@media (max-width: 767px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-bar__search {
    max-width: none;
  }
  .filter-bar__status {
    width: 100%;
  }

  .content-table {
    display: none;
  }
  .content-cards {
    display: flex;
    flex-direction: column;
  }
  .content-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--color-border);
  }
  .content-card:last-child {
    border-bottom: none;
  }
  .content-card__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .content-card__meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 6px;
  }
  .content-card__date {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-muted);
  }
  .content-card__actions {
    display: flex;
    gap: 8px;
  }
  .content-card__actions :deep(.app-btn) {
    flex: 1;
    min-height: 40px;
  }
}
</style>
