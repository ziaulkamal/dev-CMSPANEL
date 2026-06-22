<!--
  src/features/admin/widgets/WidgetFormModal.vue
  Form widget rail: penempatan + judul + sumber (otomatis by-query / kurasi manual).
  Tidak menyimpan sendiri — emit `save(widget)`; induk (WidgetListView) yang persist
  ke settings 'home.widgets'.
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { Plus, Trash2, Search } from '@lucide/vue';
import { contentService } from '@/services/content.service';
import { taxonomyService } from '@/services/taxonomy.service';
import {
  WIDGET_PLACEMENTS,
  defaultWidget,
  type Widget,
  type WidgetPlacement,
  type WidgetSourceMode,
  type WidgetManualItem,
} from '@/services/widget.service';
import { useToast } from '@/composables/useToast';
import AppModal from '@/components/app/AppModal.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppSelect from '@/components/app/AppSelect.vue';
import AppToggle from '@/components/app/AppToggle.vue';
import AppButton from '@/components/app/AppButton.vue';

const props = defineProps<{ modelValue: boolean; widget: Widget | null; saving?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; save: [w: Widget] }>();

const toast = useToast();

const open = computed<boolean>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});
const isEdit = computed(() => props.widget !== null);

const PLACEMENT_OPTIONS = WIDGET_PLACEMENTS;
const SOURCE_OPTIONS: Array<{ value: WidgetSourceMode; label: string }> = [
  { value: 'auto', label: 'Otomatis (feed terbaru)' },
  { value: 'taxonomy', label: 'Dari kategori / taxonomy' },
  { value: 'manual', label: 'Kurasi manual (pilih konten)' },
];
const CONTENT_TYPE_OPTIONS = [
  { value: 'post', label: 'Artikel (post)' },
  { value: 'video', label: 'Video' },
  { value: 'page', label: 'Halaman' },
];
const SORT_OPTIONS = [
  { value: '-published_at', label: 'Terbaru' },
  { value: 'published_at', label: 'Terlama' },
  { value: '-created_at', label: 'Baru dibuat' },
];

interface FormState {
  title: string;
  placement: WidgetPlacement;
  source_mode: WidgetSourceMode;
  content_type: string;
  sort: string;
  limit: string;
  // taxonomy
  taxonomy_slug: string;
  term_id: string;
  tax_limit: string;
  active: boolean;
  sort_order: string;
}

function blank(): FormState {
  const d = defaultWidget();
  return {
    title: '',
    placement: d.placement,
    source_mode: d.source_mode,
    content_type: d.auto.content_type,
    sort: d.auto.sort,
    limit: String(d.auto.limit),
    taxonomy_slug: d.taxonomy.taxonomy_slug,
    term_id: d.taxonomy.term_id,
    tax_limit: String(d.taxonomy.limit),
    active: true,
    sort_order: '0',
  };
}

const form = reactive<FormState>(blank());
const manual = ref<WidgetManualItem[]>([]);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return;
    Object.assign(form, blank());
    manual.value = [];
    const w = props.widget;
    if (!w) return;
    form.title = w.title;
    form.placement = w.placement;
    form.source_mode = w.source_mode;
    form.content_type = w.auto.content_type;
    form.sort = w.auto.sort;
    form.limit = String(w.auto.limit);
    form.taxonomy_slug = w.taxonomy?.taxonomy_slug ?? 'category';
    form.term_id = w.taxonomy?.term_id ?? '';
    form.tax_limit = String(w.taxonomy?.limit ?? 5);
    form.active = w.active;
    form.sort_order = String(w.sort_order);
    manual.value = [...w.manual];
  },
);

// ── Taxonomy & term (mode taxonomy) ───────────────────────────────
const { data: taxRes } = useQuery({
  queryKey: ['widget-taxonomies'],
  queryFn: () => taxonomyService.list(),
  enabled: computed(() => open.value && form.source_mode === 'taxonomy'),
  staleTime: 5 * 60_000,
});
const taxonomyOptions = computed(() =>
  (taxRes.value ?? []).map((t) => ({ value: t.slug, label: t.label })),
);

const { data: termRes } = useQuery({
  queryKey: computed(() => ['widget-terms', form.taxonomy_slug]),
  queryFn: async () => {
    try {
      return await taxonomyService.terms(form.taxonomy_slug);
    } catch {
      return [];
    }
  },
  enabled: computed(() => open.value && form.source_mode === 'taxonomy' && !!form.taxonomy_slug),
  staleTime: 5 * 60_000,
});
const termOptions = computed(() =>
  (termRes.value ?? []).map((t) => ({ value: t.id, label: t.name })),
);
function termSlugOf(id: string): string | undefined {
  return (termRes.value ?? []).find((t) => t.id === id)?.slug;
}

// ── Pencarian konten untuk mode manual ────────────────────────────
const searchTerm = ref('');
const searchType = computed(() => form.content_type || 'post');
const { data: searchRes, isFetching } = useQuery({
  queryKey: computed(() => ['widget-content-search', searchType.value]),
  queryFn: () =>
    contentService
      .list({ type: searchType.value, status: 'published', sort: '-published_at', limit: 50 })
      .then((r) => r.data),
  enabled: computed(() => open.value && form.source_mode === 'manual'),
  staleTime: 60_000,
});
const candidates = computed(() => {
  const q = searchTerm.value.trim().toLowerCase();
  const list = searchRes.value ?? [];
  const chosen = new Set(manual.value.map((m) => m.id));
  return list
    .filter((c) => !chosen.has(c.id))
    .filter((c) => !q || (c.title ?? '').toLowerCase().includes(q))
    .slice(0, 20);
});

function addManual(c: { id: string; title: string; slug?: string }): void {
  manual.value.push({ id: c.id, title: c.title, slug: c.slug });
}
function removeManual(i: number): void {
  manual.value.splice(i, 1);
}
function moveManual(i: number, dir: -1 | 1): void {
  const j = i + dir;
  if (j < 0 || j >= manual.value.length) return;
  [manual.value[i], manual.value[j]] = [manual.value[j], manual.value[i]];
}

function submit(): void {
  if (form.source_mode === 'manual' && manual.value.length === 0) {
    toast.error('Tambahkan minimal satu konten untuk mode manual.');
    return;
  }
  if (form.source_mode === 'taxonomy' && !form.term_id) {
    toast.error('Pilih kategori/term untuk mode taxonomy.');
    return;
  }
  const base = props.widget ?? defaultWidget();
  const w: Widget = {
    ...base,
    title: form.title.trim(),
    placement: form.placement,
    source_mode: form.source_mode,
    auto: {
      content_type: form.content_type,
      sort: form.sort,
      limit: Number(form.limit) || 5,
    },
    manual: manual.value,
    taxonomy: {
      taxonomy_slug: form.taxonomy_slug,
      term_id: form.term_id,
      term_slug: termSlugOf(form.term_id),
      content_type: form.content_type,
      limit: Number(form.tax_limit) || 5,
    },
    active: form.active,
    sort_order: Number(form.sort_order) || 0,
  };
  emit('save', w);
}
</script>

<template>
  <AppModal v-model="open" :title="isEdit ? 'Ubah Widget' : 'Tambah Widget'" size="md">
    <div class="flex flex-col gap-4">
      <AppInput
        v-model="form.title"
        label="Judul rail (opsional)"
        placeholder="Kosongkan untuk pakai judul default"
      />

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppSelect v-model="form.placement" label="Penempatan" :options="PLACEMENT_OPTIONS" />
        <AppSelect v-model="form.source_mode" label="Sumber konten" :options="SOURCE_OPTIONS" />
      </div>

      <!-- Mode otomatis -->
      <template v-if="form.source_mode === 'auto'">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AppSelect v-model="form.content_type" label="Tipe konten" :options="CONTENT_TYPE_OPTIONS" />
          <AppSelect v-model="form.sort" label="Urutan" :options="SORT_OPTIONS" />
          <AppInput v-model="form.limit" label="Jumlah" type="number" />
        </div>
        <p class="text-xs text-text-muted">
          Konten ditarik otomatis dari feed sesuai tipe &amp; urutan. (Filter per-kategori
          belum didukung backend.)
        </p>
      </template>

      <!-- Mode taxonomy -->
      <template v-else-if="form.source_mode === 'taxonomy'">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppSelect v-model="form.taxonomy_slug" label="Taxonomy" :options="taxonomyOptions" />
          <AppSelect v-model="form.term_id" label="Kategori / term" :options="termOptions" />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppSelect v-model="form.content_type" label="Tipe konten" :options="CONTENT_TYPE_OPTIONS" />
          <AppInput v-model="form.tax_limit" label="Jumlah" type="number" />
        </div>
        <p class="text-xs text-text-muted">
          Konten disaring berdasarkan kategori terpilih. Saat ini penyaringan dilakukan
          di sisi klien (backend belum mendukung filter term); bila kategori tak
          mengembalikan hasil, rail menampilkan feed terbaru sebagai cadangan.
        </p>
      </template>

      <!-- Mode manual -->
      <template v-else>
        <AppSelect v-model="form.content_type" label="Cari dari tipe" :options="CONTENT_TYPE_OPTIONS" />

        <!-- Daftar terpilih (urutan = urutan tampil) -->
        <div v-if="manual.length" class="flex flex-col gap-2">
          <span class="text-xs font-semibold text-text-primary">Konten terpilih ({{ manual.length }})</span>
          <div
            v-for="(m, i) in manual"
            :key="m.id"
            class="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2"
          >
            <span class="flex-1 truncate text-sm text-text-primary">{{ m.title }}</span>
            <AppButton variant="ghost" size="xs" icon-only aria-label="Naik" :disabled="i === 0" @click="moveManual(i, -1)">↑</AppButton>
            <AppButton variant="ghost" size="xs" icon-only aria-label="Turun" :disabled="i === manual.length - 1" @click="moveManual(i, 1)">↓</AppButton>
            <AppButton variant="ghost" size="xs" icon-only aria-label="Hapus" @click="removeManual(i)">
              <template #icon><Trash2 :size="14" /></template>
            </AppButton>
          </div>
        </div>

        <!-- Pencarian + kandidat -->
        <div>
          <AppInput v-model="searchTerm" label="Cari konten" placeholder="Ketik judul…">
            <template #prefix><Search :size="15" /></template>
          </AppInput>
          <div class="mt-2 max-h-52 overflow-y-auto rounded-md border border-border">
            <p v-if="isFetching" class="px-3 py-3 text-sm text-text-muted">Memuat…</p>
            <p v-else-if="!candidates.length" class="px-3 py-3 text-sm text-text-muted">
              Tidak ada konten.
            </p>
            <button
              v-for="c in candidates"
              :key="c.id"
              type="button"
              class="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-bg-subtle"
              @click="addManual(c)"
            >
              <span class="truncate text-sm text-text-primary">{{ c.title }}</span>
              <Plus :size="15" class="flex-none text-text-muted" />
            </button>
          </div>
        </div>
      </template>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppInput v-model="form.sort_order" label="Urutan widget" type="number" />
        <div class="flex items-end">
          <AppToggle v-model="form.active" label="Aktif" />
        </div>
      </div>
    </div>

    <template #footer>
      <AppButton variant="secondary" :disabled="saving" @click="open = false">Batal</AppButton>
      <AppButton variant="primary" :loading="saving" @click="submit">
        {{ isEdit ? 'Simpan' : 'Buat' }}
      </AppButton>
    </template>
  </AppModal>
</template>
