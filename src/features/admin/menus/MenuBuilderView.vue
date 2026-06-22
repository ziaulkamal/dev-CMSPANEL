<!--
  src/features/admin/menus/MenuBuilderView.vue
  Penyusun menu navigasi front-end (hamburger). Dua panel:
  kiri = sumber item (URL manual / Page / Kategori), kanan = struktur menu 2 tingkat.
  Reorder & indentasi via tombol (tanpa dependency drag-drop).
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import {
  Link2,
  FileText,
  Tags,
  Plus,
  ChevronUp,
  ChevronDown,
  IndentIncrease,
  IndentDecrease,
  Trash2,
  Save,
  GripVertical,
} from '@lucide/vue';
import { contentService } from '@/services/content.service';
import { taxonomyService } from '@/services/taxonomy.service';
import {
  menuService,
  emptyMenuSet,
  MENU_LOCATIONS,
  type MenuItem,
  type MenuItemSource,
  type MenuLocation,
  type MenuSet,
} from '@/services/menu.service';
import { useToast } from '@/composables/useToast';
import { useIsMobile } from '@/composables/useIsMobile';
import AppCard from '@/components/app/AppCard.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import InlineEditText from '@/components/ui/InlineEditText.vue';

const toast = useToast();
const isMobile = useIsMobile();

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ── Struktur menu multi-lokasi (state lokal) ──────────────────────
// Seluruh set dimuat sekali; `activeLocation` menentukan pohon yang diedit.
const menuSet = ref<MenuSet>(emptyMenuSet());
const activeLocation = ref<MenuLocation>('top');

/** Pohon untuk lokasi aktif (proxy read/write ke menuSet). */
const tree = computed<MenuItem[]>({
  get: () => menuSet.value[activeLocation.value],
  set: (v) => {
    menuSet.value[activeLocation.value] = v;
  },
});

useQuery({
  queryKey: ['admin-menu'],
  queryFn: async () => {
    try {
      menuSet.value = await menuService.getAll();
    } catch {
      // Endpoint mungkin belum ada — mulai dari kosong (UI-only).
      menuSet.value = emptyMenuSet();
    }
    return menuSet.value;
  },
});

// Flatten ke daftar render: top-level + child (1 tingkat).
interface FlatRow {
  item: MenuItem;
  depth: 0 | 1;
  parentIndex: number;
  childIndex: number; // -1 untuk top-level
}
const rows = computed<FlatRow[]>(() => {
  const out: FlatRow[] = [];
  tree.value.forEach((parent, pi) => {
    out.push({ item: parent, depth: 0, parentIndex: pi, childIndex: -1 });
    parent.children.forEach((child, ci) => {
      out.push({ item: child, depth: 1, parentIndex: pi, childIndex: ci });
    });
  });
  return out;
});

function addToMenu(label: string, url: string, source: MenuItemSource, refId?: string): void {
  tree.value.push({ id: uid(), label, url, source, ref_id: refId ?? null, children: [] });
}

function removeRow(row: FlatRow): void {
  if (row.depth === 0) {
    // Naikkan child ke top-level saat parent dihapus agar tak hilang.
    const parent = tree.value[row.parentIndex];
    tree.value.splice(row.parentIndex, 1, ...parent.children);
    if (parent.children.length === 0) tree.value.splice(row.parentIndex, 1);
  } else {
    tree.value[row.parentIndex].children.splice(row.childIndex, 1);
  }
}

function moveUp(row: FlatRow): void {
  if (row.depth === 0) {
    const i = row.parentIndex;
    if (i > 0) tree.value.splice(i - 1, 0, tree.value.splice(i, 1)[0]);
  } else {
    const arr = tree.value[row.parentIndex].children;
    const i = row.childIndex;
    if (i > 0) arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
  }
}

function moveDown(row: FlatRow): void {
  if (row.depth === 0) {
    const i = row.parentIndex;
    if (i < tree.value.length - 1) tree.value.splice(i + 1, 0, tree.value.splice(i, 1)[0]);
  } else {
    const arr = tree.value[row.parentIndex].children;
    const i = row.childIndex;
    if (i < arr.length - 1) arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
  }
}

/** Jadikan child dari item top-level di atasnya. */
function indent(row: FlatRow): void {
  if (row.depth !== 0 || row.parentIndex === 0) return;
  const item = tree.value.splice(row.parentIndex, 1)[0];
  const newParent = tree.value[row.parentIndex - 1];
  // Pindahkan child item (bila ada) ikut sebagai sibling agar tetap 2 tingkat.
  newParent.children.push(item, ...item.children);
  item.children = [];
}

/** Keluarkan child menjadi top-level tepat setelah parent-nya. */
function outdent(row: FlatRow): void {
  if (row.depth !== 1) return;
  const parent = tree.value[row.parentIndex];
  const item = parent.children.splice(row.childIndex, 1)[0];
  tree.value.splice(row.parentIndex + 1, 0, item);
}

function setLabel(row: FlatRow, label: string): void {
  if (label) row.item.label = label;
}

// ── Drag-and-drop untuk mengurutkan (depth tidak berubah; nesting via tombol) ──
const dragId = ref<string | null>(null);
const dropTargetId = ref<string | null>(null);

function onDragStart(row: FlatRow): void {
  dragId.value = row.item.id;
}
function onDragEnter(row: FlatRow): void {
  if (dragId.value && dragId.value !== row.item.id) dropTargetId.value = row.item.id;
}
function onDragEnd(): void {
  dragId.value = null;
  dropTargetId.value = null;
}

/** Pindahkan item dalam array yang sama (top-level atau sibling) ke posisi target. */
function reorderWithin(arr: MenuItem[], fromId: string, toId: string): void {
  const from = arr.findIndex((m) => m.id === fromId);
  const to = arr.findIndex((m) => m.id === toId);
  if (from < 0 || to < 0 || from === to) return;
  arr.splice(to, 0, arr.splice(from, 1)[0]);
}

function onDrop(target: FlatRow): void {
  const sourceId = dragId.value;
  onDragEnd();
  if (!sourceId || sourceId === target.item.id) return;

  const source = rows.value.find((r) => r.item.id === sourceId);
  if (!source) return;

  // Hanya izinkan reorder dalam scope yang sama; depth tetap (sesuai mode hybrid).
  if (source.depth === 0 && target.depth === 0) {
    reorderWithin(tree.value, sourceId, target.item.id);
  } else if (
    source.depth === 1 &&
    target.depth === 1 &&
    source.parentIndex === target.parentIndex
  ) {
    reorderWithin(tree.value[source.parentIndex].children, sourceId, target.item.id);
  }
  // Lintas-level / lintas-parent diabaikan — gunakan tombol indent/outdent.
}

// ── Sumber item: tab ──────────────────────────────────────────────
const SOURCE_TABS = [
  { value: 'custom' as const, label: 'URL Manual', icon: Link2 },
  { value: 'page' as const, label: 'Halaman', icon: FileText },
  { value: 'category' as const, label: 'Kategori', icon: Tags },
];

/** Ikon badge sumber pada node menu. */
const SOURCE_ICON: Record<MenuItemSource, unknown> = {
  custom: Link2,
  page: FileText,
  category: Tags,
};
const activeSource = ref<MenuItemSource>('custom');

// URL manual
const custom = reactive({ label: '', url: '' });
function addCustom(): void {
  if (!custom.label.trim() || !custom.url.trim()) {
    toast.error('Label dan URL wajib diisi.');
    return;
  }
  addToMenu(custom.label.trim(), custom.url.trim(), 'custom');
  custom.label = '';
  custom.url = '';
}

// Halaman (content type=page)
const pagesQuery = useQuery({
  queryKey: ['menu-pages'],
  queryFn: () => contentService.list({ type: 'page', limit: 100, sort: '-created_at' }),
});
const pages = computed(() => pagesQuery.data.value?.data ?? []);
function addPage(p: { id: string; title: string; slug: string }): void {
  addToMenu(p.title, `/${p.slug}`, 'page', p.id);
}

// Kategori (taxonomy "category" terms)
const CATEGORY_SLUG = 'category';
const termsQuery = useQuery({
  queryKey: ['menu-terms', CATEGORY_SLUG],
  queryFn: async () => {
    try {
      return await taxonomyService.terms(CATEGORY_SLUG);
    } catch {
      return [];
    }
  },
});
const terms = computed(() => termsQuery.data.value ?? []);
function addTerm(t: { id: string; name: string; slug: string }): void {
  addToMenu(t.name, `/kategori/${t.slug}`, 'category', t.id);
}

/** Isi otomatis: tambahkan semua kategori yang belum ada ke lokasi aktif. */
function addAllTerms(): void {
  const existing = new Set(tree.value.map((m) => m.ref_id).filter(Boolean));
  let added = 0;
  for (const t of terms.value) {
    if (existing.has(t.id)) continue;
    addToMenu(t.name, `/kategori/${t.slug}`, 'category', t.id);
    added++;
  }
  if (added) toast.success(`${added} kategori ditambahkan. Jangan lupa simpan.`);
  else toast.info('Semua kategori sudah ada di menu ini.');
}

// ── Simpan ────────────────────────────────────────────────────────
const saving = ref(false);
async function save(): Promise<void> {
  saving.value = true;
  try {
    await menuService.saveAll(menuSet.value);
    toast.success('Menu tersimpan.');
  } catch {
    toast.error('Gagal menyimpan menu (endpoint backend belum tersedia).');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="flex flex-col gap-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Menu Navigasi</h1>
        <p class="mt-1 text-sm text-text-muted">
          Susun menu front-end per lokasi. Tingkat ke-2 menjadi dropdown (Top) atau diabaikan (Secondary/Footer).
        </p>
      </div>
      <Teleport to="#admin-action-bar" :disabled="!isMobile">
        <AppButton variant="primary" :loading="saving" @click="save">
          <template #icon><Save :size="15" /></template>
          Simpan Menu
        </AppButton>
      </Teleport>
    </header>

    <!-- Pemilih lokasi menu -->
    <div class="loc-tabs">
      <button
        v-for="loc in MENU_LOCATIONS"
        :key="loc.value"
        type="button"
        class="loc-tabs__tab"
        :class="{ 'loc-tabs__tab--active': activeLocation === loc.value }"
        @click="activeLocation = loc.value"
      >
        {{ loc.label }}
        <span class="loc-tabs__count">{{ menuSet[loc.value].length }}</span>
      </button>
    </div>

    <div class="menu-grid">
      <!-- Panel kiri: sumber item -->
      <AppCard padding="md">
        <template #header>
          <span class="text-sm font-semibold text-text-primary">Tambah Item</span>
        </template>

        <!-- Tab sumber -->
        <div class="source-tabs">
          <button
            v-for="t in SOURCE_TABS"
            :key="t.value"
            type="button"
            class="source-tabs__tab"
            :class="{ 'source-tabs__tab--active': activeSource === t.value }"
            @click="activeSource = t.value"
          >
            <component :is="t.icon" :size="14" />
            {{ t.label }}
          </button>
        </div>

        <!-- URL manual -->
        <div v-if="activeSource === 'custom'" class="mt-4 flex flex-col gap-3">
          <AppInput v-model="custom.label" label="Label" placeholder="Beranda" />
          <AppInput v-model="custom.url" label="URL" placeholder="/ atau https://…" />
          <AppButton variant="secondary" size="sm" @click="addCustom">
            <template #icon><Plus :size="14" /></template>
            Tambah ke menu
          </AppButton>
        </div>

        <!-- Halaman -->
        <div v-else-if="activeSource === 'page'" class="mt-4">
          <p v-if="pagesQuery.isLoading.value" class="text-sm text-text-muted">Memuat halaman…</p>
          <AppEmptyState v-else-if="!pages.length" title="Belum ada halaman" />
          <ul v-else class="source-list">
            <li v-for="p in pages" :key="p.id" class="source-list__row">
              <span class="truncate">{{ p.title }}</span>
              <AppButton variant="ghost" size="xs" icon-only aria-label="Tambah" @click="addPage(p)">
                <template #icon><Plus :size="14" /></template>
              </AppButton>
            </li>
          </ul>
        </div>

        <!-- Kategori -->
        <div v-else class="mt-4">
          <p v-if="termsQuery.isLoading.value" class="text-sm text-text-muted">Memuat kategori…</p>
          <AppEmptyState v-else-if="!terms.length" title="Belum ada kategori" />
          <template v-else>
            <AppButton variant="secondary" size="sm" class="mb-3 w-full" @click="addAllTerms">
              <template #icon><Plus :size="14" /></template>
              Isi otomatis semua kategori
            </AppButton>
            <ul class="source-list">
            <li v-for="t in terms" :key="t.id" class="source-list__row">
              <span class="truncate">{{ t.name }}</span>
              <AppButton variant="ghost" size="xs" icon-only aria-label="Tambah" @click="addTerm(t)">
                <template #icon><Plus :size="14" /></template>
              </AppButton>
            </li>
            </ul>
          </template>
        </div>
      </AppCard>

      <!-- Panel kanan: struktur menu -->
      <AppCard padding="md">
        <template #header>
          <span class="text-sm font-semibold text-text-primary">Struktur Menu</span>
        </template>

        <AppEmptyState
          v-if="!rows.length"
          title="Menu kosong"
          description="Tambahkan item dari panel kiri."
        />
        <ul v-else class="menu-tree">
          <li
            v-for="row in rows"
            :key="row.item.id"
            class="menu-node"
            :class="{
              'menu-node--child': row.depth === 1,
              'is-dragging': dragId === row.item.id,
              'is-drop-target': dropTargetId === row.item.id,
            }"
            draggable="true"
            @dragstart="onDragStart(row)"
            @dragenter.prevent="onDragEnter(row)"
            @dragover.prevent
            @drop.prevent="onDrop(row)"
            @dragend="onDragEnd"
          >
            <!-- Drag handle -->
            <span class="menu-node__handle" aria-label="Seret untuk mengurutkan">
              <GripVertical :size="16" />
            </span>

            <!-- Badge sumber -->
            <span class="menu-node__badge" :class="`menu-node__badge--${row.item.source}`">
              <component :is="SOURCE_ICON[row.item.source]" :size="13" />
            </span>

            <!-- Label + URL -->
            <div class="menu-node__info">
              <InlineEditText
                :model-value="row.item.label"
                class="text-sm font-medium text-text-primary"
                @update:model-value="(v: string) => setLabel(row, v)"
              />
              <span class="menu-node__url">{{ row.item.url }}</span>
            </div>

            <!-- Aksi -->
            <div class="menu-node__actions">
              <AppButton variant="ghost" size="xs" icon-only aria-label="Naik" @click="moveUp(row)">
                <template #icon><ChevronUp :size="14" /></template>
              </AppButton>
              <AppButton variant="ghost" size="xs" icon-only aria-label="Turun" @click="moveDown(row)">
                <template #icon><ChevronDown :size="14" /></template>
              </AppButton>
              <AppButton
                v-if="row.depth === 0"
                variant="ghost"
                size="xs"
                icon-only
                aria-label="Jadikan submenu"
                :disabled="row.parentIndex === 0"
                @click="indent(row)"
              >
                <template #icon><IndentIncrease :size="14" /></template>
              </AppButton>
              <AppButton
                v-else
                variant="ghost"
                size="xs"
                icon-only
                aria-label="Keluarkan submenu"
                @click="outdent(row)"
              >
                <template #icon><IndentDecrease :size="14" /></template>
              </AppButton>
              <AppButton
                variant="ghost"
                size="xs"
                icon-only
                aria-label="Hapus"
                @click="removeRow(row)"
              >
                <template #icon><Trash2 :size="14" /></template>
              </AppButton>
            </div>
          </li>
        </ul>
      </AppCard>
    </div>
  </section>
</template>

<style scoped>
/* Pemilih lokasi menu */
.loc-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.loc-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  transition: all 150ms ease;
}
.loc-tabs__tab:hover {
  border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
}
.loc-tabs__tab--active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
}
.loc-tabs__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
}
.loc-tabs__tab--active .loc-tabs__count {
  background: color-mix(in srgb, var(--color-primary) 16%, transparent);
  color: var(--color-primary);
}

.menu-grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) {
  .menu-grid {
    grid-template-columns: 1fr;
  }
}

/* Tab sumber */
.source-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
}
.source-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  justify-content: center;
  padding: 7px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: calc(var(--radius-md) - 2px);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all 150ms ease;
}
.source-tabs__tab--active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.source-list {
  display: flex;
  flex-direction: column;
  max-height: 360px;
  overflow-y: auto;
}
.source-list__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-primary);
}
.source-list__row:last-child {
  border-bottom: none;
}

/* ── Struktur menu: nested tree + drag handle ── */
.menu-tree {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.menu-node {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  transition:
    box-shadow 150ms ease,
    border-color 150ms ease,
    transform 150ms ease,
    opacity 150ms ease;
}
.menu-node:hover {
  border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

/* Child: indent + garis penghubung siku (└) ke parent. */
.menu-node--child {
  margin-left: 30px;
}
.menu-node--child::before {
  content: '';
  position: absolute;
  left: -18px;
  top: -9px;
  bottom: 50%;
  width: 1px;
  background: var(--color-border);
}
.menu-node--child::after {
  content: '';
  position: absolute;
  left: -18px;
  top: 50%;
  width: 14px;
  height: 1px;
  background: var(--color-border);
}

/* State drag */
.menu-node.is-dragging {
  opacity: 0.5;
}
.menu-node.is-drop-target {
  border-color: var(--color-primary);
  box-shadow: 0 -2px 0 0 var(--color-primary);
}

/* Drag handle */
.menu-node__handle {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--color-text-subtle);
  cursor: grab;
  transition: color 150ms ease;
}
.menu-node:hover .menu-node__handle {
  color: var(--color-primary);
}
.menu-node__handle:active {
  cursor: grabbing;
}

/* Badge sumber */
.menu-node__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
}
.menu-node__badge--page {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}
.menu-node__badge--category {
  color: var(--color-success);
  background: color-mix(in srgb, var(--color-success) 14%, transparent);
}
.menu-node__badge--custom {
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
}

.menu-node__info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
/* Label diperkecil agar tree tampak lebih ringkas & rapi. */
.menu-node__info :deep(.text-sm) {
  font-size: 12.5px;
}
.menu-node__url {
  font-size: 10.5px;
  color: var(--color-text-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.menu-node__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

/* ── Penyesuaian mobile ── */
@media (max-width: 640px) {
  .menu-grid {
    gap: 14px;
  }

  /* Tab sumber: ikon-only agar tidak sesak */
  .source-tabs__tab {
    padding: 9px 6px;
    font-size: 0;
    gap: 0;
  }
  .source-tabs__tab :deep(svg) {
    width: 18px;
    height: 18px;
  }

  .source-list {
    max-height: 280px;
  }
  .source-list__row {
    padding: 10px 4px;
    font-size: 13.5px;
  }

  /* Node tetap satu baris ringkas; handle & aksi nyaman disentuh. */
  .menu-node {
    gap: 8px;
    padding: 8px 9px;
  }
  .menu-node--child {
    margin-left: 20px;
  }
  .menu-node--child::before {
    left: -13px;
  }
  .menu-node--child::after {
    left: -13px;
    width: 10px;
  }
  .menu-node__badge {
    width: 26px;
    height: 26px;
  }
  .menu-node__info :deep(.text-sm) {
    font-size: 12px;
  }
  .menu-node__url {
    font-size: 10px;
  }
  .menu-node__actions :deep(.app-btn) {
    min-width: 32px;
    min-height: 32px;
    padding: 5px;
  }
}
</style>
