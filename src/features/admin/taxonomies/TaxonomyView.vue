<!--
  src/features/admin/taxonomies/TaxonomyView.vue
  Manajemen taxonomy & term: daftar taxonomy (kiri) + term hierarkis dengan aksi edit/hapus (kanan).
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { Tags, Plus, Pencil, Trash2 } from '@lucide/vue';
import { taxonomyService } from '@/services/taxonomy.service';
import { useToast } from '@/composables/useToast';
import AppCard from '@/components/app/AppCard.vue';
import AppBadge from '@/components/app/AppBadge.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import TaxonomyCreateModal from './TaxonomyCreateModal.vue';
import TermCreateModal from './TermCreateModal.vue';
import TermEditModal from './TermEditModal.vue';
import TaxonomyEditModal from './TaxonomyEditModal.vue';
import type { Taxonomy, Term } from '@/types/domain';

const queryClient = useQueryClient();
const toast = useToast();

const TAXONOMIES_KEY = ['admin-taxonomies'] as const;
const selectedSlug = ref<string | null>(null);

const taxonomiesQuery = useQuery({
  queryKey: TAXONOMIES_KEY,
  queryFn: () => taxonomyService.list(),
});

watch(
  () => taxonomiesQuery.data.value,
  (list) => {
    if (!selectedSlug.value && list && list.length) selectedSlug.value = list[0].slug;
  },
  { immediate: true },
);

const selectedTaxonomy = computed<Taxonomy | null>(
  () => taxonomiesQuery.data.value?.find((t) => t.slug === selectedSlug.value) ?? null,
);

const termsKey = computed(() => ['admin-taxonomy-terms', selectedSlug.value] as const);
const termsQuery = useQuery({
  queryKey: termsKey,
  queryFn: () => taxonomyService.terms(selectedSlug.value as string),
  enabled: computed<boolean>(() => selectedSlug.value !== null),
});

const terms = computed<Term[]>(() => termsQuery.data.value ?? []);

/**
 * Susun term jadi urutan induk→anak (depth-first), diurut ascending per level.
 * `isLast` menandai anak terakhir di levelnya agar konektor pohon (└ vs ├) tepat.
 */
interface OrderedTerm {
  term: Term;
  depth: number;
  isLast: boolean;
}
const orderedTerms = computed<OrderedTerm[]>(() => {
  const children = new Map<string | null, Term[]>();
  for (const t of terms.value) {
    const key = t.parent_id ?? null;
    const bucket = children.get(key);
    if (bucket) bucket.push(t);
    else children.set(key, [t]);
  }
  children.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));

  const out: OrderedTerm[] = [];
  const seen = new Set<string>();
  const walk = (parent: string | null, depth: number) => {
    const list = children.get(parent) ?? [];
    list.forEach((t, i) => {
      out.push({ term: t, depth, isLast: i === list.length - 1 });
      seen.add(t.id);
      walk(t.id, depth + 1);
    });
  };
  walk(null, 0);
  // Term yatim (parent_id menunjuk term tak ada) diperlakukan sebagai root.
  for (const t of terms.value) if (!seen.has(t.id)) out.push({ term: t, depth: 0, isLast: true });
  return out;
});

function selectTaxonomy(slug: string): void {
  selectedSlug.value = slug;
}

function refreshTaxonomies(): void {
  void queryClient.invalidateQueries({ queryKey: TAXONOMIES_KEY });
}
function refreshTerms(): void {
  void queryClient.invalidateQueries({ queryKey: termsKey.value });
}

// ── Create modals ────────────────────────────────────────────
const taxCreateOpen = ref(false);
const termCreateOpen = ref(false);

// ── Edit modals ──────────────────────────────────────────────
const editingTerm = ref<Term | null>(null);
const termModalOpen = ref(false);
function openTermEdit(term: Term): void {
  editingTerm.value = term;
  termModalOpen.value = true;
}

const editingTax = ref<Taxonomy | null>(null);
const taxModalOpen = ref(false);
function openTaxEdit(tax: Taxonomy): void {
  editingTax.value = tax;
  taxModalOpen.value = true;
}

// ── Delete (term) ────────────────────────────────────────────
const termToDelete = ref<Term | null>(null);
const termConfirmOpen = ref(false);
const deleteTermMutation = useMutation({
  mutationFn: () => taxonomyService.removeTerm(selectedSlug.value as string, termToDelete.value!.id),
  onSuccess: () => {
    toast.success('Term dihapus.');
    termConfirmOpen.value = false;
    refreshTerms();
  },
  onError: () => toast.error('Gagal menghapus term.'),
});

// ── Delete (taxonomy) ────────────────────────────────────────
const taxToDelete = ref<Taxonomy | null>(null);
const taxConfirmOpen = ref(false);
const deleteTaxMutation = useMutation({
  mutationFn: () => taxonomyService.remove(taxToDelete.value!.slug),
  onSuccess: () => {
    toast.success('Taxonomy dihapus.');
    taxConfirmOpen.value = false;
    if (selectedSlug.value === taxToDelete.value?.slug) selectedSlug.value = null;
    refreshTaxonomies();
  },
  onError: () => toast.error('Gagal menghapus taxonomy.'),
});
</script>

<template>
  <section class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-text-primary">Taxonomy</h1>
      <p class="mt-1 text-sm text-text-muted">Kelola taxonomy dan term-nya.</p>
    </header>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Panel kiri: daftar taxonomy -->
      <div class="flex flex-col gap-6">
        <AppCard padding="none">
          <template #header>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-text-primary">Taxonomy</p>
              <p class="mt-0.5 text-xs text-text-muted">Pilih untuk melihat term-nya.</p>
            </div>
            <AppButton variant="secondary" size="sm" @click="taxCreateOpen = true">
              <template #icon><Plus :size="16" /></template>
              Baru
            </AppButton>
          </template>

          <div v-if="taxonomiesQuery.isLoading.value" class="flex justify-center py-10">
            <AppSpinner size="lg" />
          </div>

          <AppEmptyState
            v-else-if="taxonomiesQuery.isError.value"
            title="Gagal memuat taxonomy"
            description="Terjadi kesalahan saat mengambil daftar. Coba muat ulang."
            :icon="Tags"
            size="sm"
          />

          <AppEmptyState
            v-else-if="!taxonomiesQuery.data.value?.length"
            title="Belum ada taxonomy"
            description="Buat taxonomy pertama lewat tombol 'Baru' di atas."
            :icon="Tags"
            size="sm"
          />

          <ul v-else class="divide-y divide-border">
            <li
              v-for="tax in taxonomiesQuery.data.value"
              :key="tax.id"
              class="group flex items-center gap-2 pr-2 transition-colors hover:bg-bg-subtle"
              :class="tax.slug === selectedSlug ? 'bg-bg-subtle' : ''"
            >
              <button
                type="button"
                class="flex flex-1 items-center justify-between gap-2 px-4 py-3 text-left"
                @click="selectTaxonomy(tax.slug)"
              >
                <span class="flex flex-col">
                  <span class="text-sm font-medium text-text-primary">{{ tax.label }}</span>
                  <span class="text-xs text-text-muted">{{ tax.slug }}</span>
                </span>
                <AppBadge :color="tax.hierarchical ? 'info' : 'default'" size="sm">
                  {{ tax.hierarchical ? 'Hierarkis' : 'Flat' }}
                </AppBadge>
              </button>
              <div class="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                <AppButton variant="ghost" size="sm" icon-only title="Edit" @click="openTaxEdit(tax)">
                  <Pencil :size="16" />
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="sm"
                  icon-only
                  title="Hapus"
                  class="hover:bg-danger/10! hover:text-danger!"
                  @click="(taxToDelete = tax), (taxConfirmOpen = true)"
                >
                  <Trash2 :size="16" />
                </AppButton>
              </div>
            </li>
          </ul>
        </AppCard>
      </div>

      <!-- Panel kanan: term hierarkis -->
      <div class="lg:col-span-2">
        <AppCard padding="md">
          <template #header>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-text-primary">
                {{ selectedTaxonomy ? `Term: ${selectedTaxonomy.label}` : 'Term' }}
              </p>
              <p v-if="selectedTaxonomy" class="mt-0.5 text-xs text-text-muted">
                {{ orderedTerms.length }} term
              </p>
            </div>
            <AppButton
              v-if="selectedTaxonomy"
              variant="primary"
              size="sm"
              @click="termCreateOpen = true"
            >
              <template #icon><Plus :size="16" /></template>
              Tambah term
            </AppButton>
          </template>

          <AppEmptyState
            v-if="!selectedTaxonomy"
            title="Pilih taxonomy"
            description="Pilih salah satu taxonomy di sebelah kiri untuk melihat term-nya."
            :icon="Tags"
            size="sm"
          />

          <template v-else>
            <div v-if="termsQuery.isLoading.value" class="flex justify-center py-10">
              <AppSpinner size="lg" />
            </div>

            <AppEmptyState
              v-else-if="termsQuery.isError.value"
              title="Gagal memuat term"
              description="Terjadi kesalahan saat mengambil term. Coba muat ulang."
              :icon="Tags"
              size="sm"
            />

            <AppEmptyState
              v-else-if="!orderedTerms.length"
              title="Belum ada term"
              description="Tambahkan term pertama lewat tombol 'Tambah term' di atas."
              :icon="Tags"
              size="sm"
            />

            <ul v-else class="flex flex-col gap-1">
              <li
                v-for="{ term, depth, isLast } in orderedTerms"
                :key="term.id"
                class="group flex items-stretch"
              >
                <!-- Rail konektor pohon: satu kolom per level kedalaman -->
                <span
                  v-for="lvl in depth"
                  :key="lvl"
                  class="tree-rail"
                  :class="lvl === depth ? (isLast ? 'tree-rail--elbow' : 'tree-rail--tee') : 'tree-rail--line'"
                  aria-hidden="true"
                />

                <!-- Baris term -->
                <span
                  class="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 transition-colors group-hover:border-border-strong"
                  :class="depth > 0 ? 'bg-bg-subtle/50' : 'bg-surface'"
                >
                  <span class="flex min-w-0 flex-col">
                    <span class="truncate text-sm font-medium text-text-primary">{{ term.name }}</span>
                    <span class="truncate text-xs text-text-muted">{{ term.slug }}</span>
                  </span>
                  <span
                    class="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100"
                  >
                    <AppButton variant="ghost" size="sm" icon-only title="Edit" @click="openTermEdit(term)">
                      <Pencil :size="16" />
                    </AppButton>
                    <AppButton
                      variant="ghost"
                      size="sm"
                      icon-only
                      title="Hapus"
                      class="hover:bg-danger/10! hover:text-danger!"
                      @click="(termToDelete = term), (termConfirmOpen = true)"
                    >
                      <Trash2 :size="16" />
                    </AppButton>
                  </span>
                </span>
              </li>
            </ul>
          </template>
        </AppCard>
      </div>
    </div>

    <!-- Modals -->
    <TaxonomyCreateModal v-model="taxCreateOpen" @created="refreshTaxonomies" />
    <TermCreateModal
      v-if="selectedTaxonomy"
      v-model="termCreateOpen"
      :taxonomy="selectedTaxonomy"
      :terms="terms"
      @created="refreshTerms"
    />

    <TermEditModal
      v-if="selectedTaxonomy"
      v-model="termModalOpen"
      :taxonomy="selectedTaxonomy"
      :term="editingTerm"
      :terms="terms"
      @saved="refreshTerms"
    />
    <TaxonomyEditModal v-model="taxModalOpen" :taxonomy="editingTax" @saved="refreshTaxonomies" />

    <ConfirmDialog
      v-model="termConfirmOpen"
      title="Hapus term"
      :message="`Hapus term '${termToDelete?.name}'? Anak-anaknya akan menjadi root.`"
      :loading="deleteTermMutation.isPending.value"
      @confirm="deleteTermMutation.mutate()"
    />
    <ConfirmDialog
      v-model="taxConfirmOpen"
      title="Hapus taxonomy"
      :message="`Hapus taxonomy '${taxToDelete?.label}' beserta SEMUA term-nya? Tindakan ini permanen.`"
      :loading="deleteTaxMutation.isPending.value"
      @confirm="deleteTaxMutation.mutate()"
    />
  </section>
</template>

<style scoped>
/* Kolom rail konektor pohon (satu per level kedalaman). */
.tree-rail {
  position: relative;
  flex-shrink: 0;
  width: 24px;
  align-self: stretch;
}
/* Garis vertikal lurus (penerus dari leluhur). */
.tree-rail--line::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1.5px;
  background: var(--color-border-strong);
}
/* '├' : garis vertikal penuh + cabang horizontal ke kanan di tengah baris. */
.tree-rail--tee::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1.5px;
  background: var(--color-border-strong);
}
/* '└' : garis vertikal dari atas sampai tengah + cabang horizontal. */
.tree-rail--elbow::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  height: 50%;
  width: 1.5px;
  background: var(--color-border-strong);
}
/* Cabang horizontal ke baris term untuk tee & elbow. */
.tree-rail--tee::after,
.tree-rail--elbow::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 50%;
  height: 1.5px;
  background: var(--color-border-strong);
}
</style>
