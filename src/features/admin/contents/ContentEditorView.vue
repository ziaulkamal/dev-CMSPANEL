<!--
  src/features/admin/contents/ContentEditorView.vue
  Editor konten admin (create/edit) — layout dua kolom (konten + sidebar publish),
  WYSIWYG, gambar unggulan, taxonomies, SEO, meta EAV, alur editorial & article lock.
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { AxiosError } from 'axios';
import {
  FileWarning,
  ArrowLeft,
  Image as ImageIcon,
  Tags,
  Search,
  Settings,
  Link as LinkIcon,
  Save,
  Lock,
  AlertCircle,
} from '@lucide/vue';

import AppCard from '@/components/app/AppCard.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppSelect from '@/components/app/AppSelect.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppCheckbox from '@/components/app/AppCheckbox.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';

import RichTextEditor from './RichTextEditor.vue';
import FeaturedImagePicker from './FeaturedImagePicker.vue';
import TaxonomyPicker from './TaxonomyPicker.vue';
import SeoPanel from './SeoPanel.vue';
import TypeSettingsPanel from './TypeSettingsPanel.vue';
import EditorialActions from './EditorialActions.vue';
import {
  CONTENT_TYPE_OPTIONS,
  allowedMetaKeys,
  typeMetaFields,
  typeLayout,
  typeLabel,
  TYPE_ACCENT,
  FEATURED_IMAGE_KEY,
  SLUG_KEY,
} from './editor.config';

import { contentService } from '@/services/content.service';
import { authorService } from '@/services/author.service';
import { useContentLock } from '@/composables/useContentLock';
import { useToast } from '@/composables/useToast';
import { useIsMobile } from '@/composables/useIsMobile';
import type { ApiError } from '@/types/api';
import type { Content, ContentStatus, ContentType } from '@/types/domain';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const queryClient = useQueryClient();
const isMobile = useIsMobile();

// ── Mode ──────────────────────────────────────────────────────────
const contentId = computed<string | null>(() =>
  typeof route.params.id === 'string' ? route.params.id : null,
);
const isEdit = computed<boolean>(() => contentId.value !== null);

// ── Form state ────────────────────────────────────────────────────
interface FormState {
  title: string;
  type: ContentType;
  body: string;
  primary_author_id: string;
  co_author_ids: string[];
  published_at: string;
}
const form = reactive<FormState>({
  title: '',
  type: 'post',
  body: '',
  primary_author_id: '',
  co_author_ids: [],
  published_at: '',
});
const meta = ref<Record<string, string>>({});
const terms = ref<Record<string, string[]>>({});
const fieldErrors = ref<Record<string, string>>({});
const slugTouched = ref(false);

// ── Slug / permalink ──────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
const slug = computed<string>({
  get: () => meta.value[SLUG_KEY] ?? '',
  set: (v) => {
    slugTouched.value = true;
    meta.value = { ...meta.value, [SLUG_KEY]: v };
  },
});
watch(
  () => form.title,
  (title) => {
    if (!slugTouched.value && !isEdit.value) {
      meta.value = { ...meta.value, [SLUG_KEY]: slugify(title) };
    }
  },
);
const permalinkBase = `${window.location.origin}/`;

// ── Featured image (meta) ─────────────────────────────────────────
const featuredImage = computed<string>({
  get: () => meta.value[FEATURED_IMAGE_KEY] ?? '',
  set: (v) => (meta.value = { ...meta.value, [FEATURED_IMAGE_KEY]: v }),
});

// ── Authors ───────────────────────────────────────────────────────
const authorsQuery = useQuery({
  queryKey: ['authors'],
  queryFn: () => authorService.list(),
});
const authorOptions = computed(() =>
  (authorsQuery.data.value ?? []).map((a) => ({ value: a.id, label: a.display_name })),
);
const coAuthorOptions = computed(() =>
  authorOptions.value.filter((o) => o.value !== form.primary_author_id),
);

// ── Type options & tata letak per tipe ────────────────────────────
const typeOptions = [...CONTENT_TYPE_OPTIONS];
const hasTypeSettings = computed<boolean>(() => typeMetaFields(form.type).length > 0);
const currentTypeLabel = computed<string>(() => typeLabel(form.type));
const layout = computed(() => typeLayout(form.type));
const accent = computed<string>(() => TYPE_ACCENT[form.type]);

/** Judul header: verb (Tambah/Edit) + label tipe — "Tambah Post", "Edit Page". */
const headingText = computed<string>(
  () => `${isEdit.value ? 'Edit' : 'Tambah'} ${currentTypeLabel.value}`,
);

// ── Detail + meta (edit) ──────────────────────────────────────────
const detailQuery = useQuery({
  queryKey: ['admin-content', contentId],
  enabled: isEdit,
  queryFn: () => contentService.detail(contentId.value as string),
});
const metaQuery = useQuery({
  queryKey: ['admin-content-meta', contentId],
  enabled: isEdit,
  queryFn: () => contentService.meta(contentId.value as string),
});

const currentStatus = computed<ContentStatus>(() => detailQuery.data.value?.status ?? 'draft');

function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function hydrate(content: Content, contentMeta: Record<string, string>): void {
  form.title = content.title ?? '';
  form.type = content.type;
  form.body = content.body ?? '';
  form.published_at = toLocalInput(content.published_at);
  const authors = content.authors ?? [];
  form.primary_author_id = authors[0]?.id ?? '';
  form.co_author_ids = authors.slice(1).map((a) => a.id);
  meta.value = { ...contentMeta };
  if (content.slug && !meta.value[SLUG_KEY]) meta.value[SLUG_KEY] = content.slug;
  slugTouched.value = true;
  // Kelompokkan term per taxonomy.
  const grouped: Record<string, string[]> = {};
  for (const t of content.terms ?? []) {
    const tx = (t as { taxonomy?: string }).taxonomy ?? 'uncategorized';
    (grouped[tx] ??= []).push(t.id);
  }
  terms.value = grouped;
}

watch(
  () => [detailQuery.data.value, metaQuery.data.value] as const,
  ([content, contentMeta]) => {
    if (content && contentMeta) hydrate(content, contentMeta);
  },
  { immediate: true },
);

// ── Article lock (edit) ───────────────────────────────────────────
const lock = isEdit.value ? useContentLock(contentId.value as string) : null;
const readOnly = computed<boolean>(() => lock?.locked.value ?? false);
const lockedByName = computed<string>(() => lock?.lockedBy.value?.locked_by ?? 'pengguna lain');
if (lock) {
  void lock.acquire();
}

// ── Payload helpers ───────────────────────────────────────────────
function trimmedMeta(): Record<string, string> {
  const allowed = allowedMetaKeys(form.type);
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(meta.value)) {
    if (allowed.has(key) && value !== '') out[key] = value;
  }
  return out;
}
function allTermIds(): string[] {
  return Object.values(terms.value).flat();
}

function applyValidationError(err: unknown): boolean {
  const ax = err as AxiosError<ApiError>;
  if (ax.response?.data?.error?.code === 'VALIDATION_ERROR') {
    const details = ax.response.data.error.details ?? {};
    const mapped: Record<string, string> = {};
    for (const [key, val] of Object.entries(details)) {
      mapped[key] = Array.isArray(val) ? String(val[0]) : String(val);
    }
    fieldErrors.value = mapped;
    toast.error('Periksa kembali isian form.');
    return true;
  }
  return false;
}

const saveMutation = useMutation({
  mutationFn: async (): Promise<Content> => {
    // Gambar sudah di-upload saat dipilih → body & meta berisi URL nyata.
    const base = {
      title: form.title,
      body: form.body,
      primary_author_id: form.primary_author_id,
      co_author_ids: form.co_author_ids,
      term_ids: allTermIds(),
      ...(form.published_at ? { published_at: new Date(form.published_at).toISOString() } : {}),
      ...(slug.value ? { slug: slug.value } : {}),
    };
    const metaPayload = trimmedMeta();

    if (isEdit.value) {
      const id = contentId.value as string;
      const updated = await contentService.update(id, base as Partial<Content>);
      await contentService.upsertMeta(id, metaPayload);
      return updated;
    }
    const created = await contentService.create({
      type: form.type,
      ...base,
    } as Partial<Content> & { type: string; title: string });
    await contentService.upsertMeta(created.id, metaPayload);
    return created;
  },
  onSuccess: (content) => {
    fieldErrors.value = {};
    justSaved.value = true;
    savedSnapshot.value = snapshot();
    toast.success('Konten tersimpan.');
    void queryClient.invalidateQueries({ queryKey: ['admin-contents'] });
    if (isEdit.value) {
      void queryClient.invalidateQueries({ queryKey: ['admin-content', contentId.value] });
    } else {
      void router.replace({ name: 'admin-content-edit', params: { id: content.id } });
    }
    void Promise.resolve().then(() => {
      justSaved.value = false;
    });
  },
  onError: (err) => {
    if (!applyValidationError(err)) toast.error('Gagal menyimpan konten.');
  },
});

function save(): void {
  if (readOnly.value) return;
  saveMutation.mutate();
}

// ── Transisi editorial ────────────────────────────────────────────
const transitionMutation = useMutation({
  mutationFn: (vars: { to: ContentStatus; publishedAt?: string }) =>
    contentService.transition(contentId.value as string, vars.to, vars.publishedAt),
  onSuccess: () => {
    toast.success('Status diperbarui.');
    void queryClient.invalidateQueries({ queryKey: ['admin-content', contentId.value] });
    void queryClient.invalidateQueries({ queryKey: ['admin-contents'] });
  },
  onError: (err) => {
    const ax = err as AxiosError<ApiError>;
    if (ax.response?.data?.error?.code === 'INVALID_STATUS_TRANSITION') {
      toast.error('Transisi status tidak diizinkan.');
      return;
    }
    toast.error('Gagal mengubah status.');
  },
});
function onTransition(to: ContentStatus, publishedAt?: string): void {
  transitionMutation.mutate({ to, publishedAt });
}

// ── UI state ──────────────────────────────────────────────────────
const isDetailLoading = computed<boolean>(
  () => isEdit.value && (detailQuery.isLoading.value || metaQuery.isLoading.value),
);
const isDetailError = computed<boolean>(
  () => isEdit.value && (detailQuery.isError.value || metaQuery.isError.value),
);

function goBack(): void {
  void router.push({ name: 'admin-contents' });
}
function toggleCoAuthor(id: string, checked: boolean): void {
  if (checked) {
    if (!form.co_author_ids.includes(id)) form.co_author_ids.push(id);
  } else {
    form.co_author_ids = form.co_author_ids.filter((x) => x !== id);
  }
}

// ── Ringkasan error ───────────────────────────────────────────────
const FIELD_LABELS: Record<string, string> = {
  title: 'Judul',
  type: 'Tipe Konten',
  body: 'Isi Konten',
  slug: 'Permalink',
  primary_author_id: 'Penulis Utama',
  published_at: 'Tanggal Terbit',
  seo_title: 'SEO Title',
  seo_description: 'Meta Description',
};
const errorSummary = computed<{ key: string; label: string; message: string }[]>(() =>
  Object.entries(fieldErrors.value).map(([key, message]) => ({
    key,
    label: FIELD_LABELS[key] ?? key,
    message,
  })),
);
function focusField(key: string): void {
  const el = document.querySelector(`[data-field="${key}"]`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  (el?.querySelector('input, textarea, select') as HTMLElement | null)?.focus();
}

// ── Dirty tracking & konfirmasi keluar ────────────────────────────
function snapshot(): string {
  return JSON.stringify({ form, meta: meta.value, terms: terms.value });
}
const savedSnapshot = ref<string>('');
const justSaved = ref(false);
const isDirty = computed<boolean>(() => savedSnapshot.value !== '' && snapshot() !== savedSnapshot.value);

onMounted(() => {
  // Baseline awal; untuk mode edit di-reset lagi setelah hydrate.
  savedSnapshot.value = snapshot();
});
watch(
  () => [detailQuery.data.value, metaQuery.data.value] as const,
  ([c, m]) => {
    if (c && m) savedSnapshot.value = snapshot();
  },
);

function onBeforeUnload(e: BeforeUnloadEvent): void {
  if (isDirty.value && !justSaved.value) {
    e.preventDefault();
    e.returnValue = '';
  }
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload));
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload));

// Konfirmasi keluar via modal (bukan window.confirm bawaan browser).
const showLeaveConfirm = ref(false);
let resolveLeave: ((leave: boolean) => void) | null = null;

onBeforeRouteLeave(() => {
  if (!isDirty.value || justSaved.value) return true;
  showLeaveConfirm.value = true;
  return new Promise<boolean>((resolve) => {
    resolveLeave = resolve;
  });
});

function confirmLeave(): void {
  showLeaveConfirm.value = false;
  resolveLeave?.(true);
  resolveLeave = null;
}

function cancelLeave(): void {
  showLeaveConfirm.value = false;
  resolveLeave?.(false);
  resolveLeave = null;
}
</script>

<template>
  <section class="editor">
    <!-- Header (sticky) -->
    <header class="editor__topbar">
      <div class="editor__topbar-left">
        <AppButton variant="ghost" size="sm" @click="goBack">
          <template #icon><ArrowLeft :size="16" /></template>
          Kembali
        </AppButton>
        <div class="editor__title-block">
          <span class="editor__accent" :style="{ background: accent }" aria-hidden="true" />
          <h1 class="editor__heading">{{ headingText }}</h1>
          <div v-if="isEdit" class="editor__status">
            <StatusBadge :status="currentStatus" />
          </div>
        </div>
      </div>
      <Teleport to="#admin-action-bar" :disabled="!isMobile">
        <div class="editor__topbar-right">
          <AppButton variant="ghost" :disabled="saveMutation.isPending.value" @click="goBack">
            Batal
          </AppButton>
          <AppButton
            variant="primary"
            :loading="saveMutation.isPending.value"
            :disabled="readOnly"
            @click="save"
          >
            <template #icon><Save :size="15" /></template>
            {{ isEdit ? 'Simpan Perubahan' : 'Buat Konten' }}
          </AppButton>
        </div>
      </Teleport>
    </header>

    <!-- Lock banner -->
    <div v-if="readOnly" class="editor__lock">
      <Lock :size="15" />
      <span>Sedang diedit oleh <strong>{{ lockedByName }}</strong>. Form bersifat hanya-baca.</span>
    </div>

    <!-- Ringkasan error -->
    <div v-if="errorSummary.length" class="editor__errors" role="alert">
      <div class="editor__errors-head">
        <AlertCircle :size="16" />
        <span>Periksa kembali {{ errorSummary.length }} isian berikut:</span>
      </div>
      <ul class="editor__errors-list">
        <li v-for="e in errorSummary" :key="e.key">
          <button type="button" class="editor__errors-link" @click="focusField(e.key)">
            {{ e.label }}
          </button>
          <span class="editor__errors-msg">— {{ e.message }}</span>
        </li>
      </ul>
    </div>

    <!-- Loading / error (edit) -->
    <AppCard v-if="isDetailLoading" padding="lg">
      <p class="editor__muted">Memuat konten…</p>
    </AppCard>
    <AppCard v-else-if="isDetailError" padding="lg">
      <AppEmptyState
        :icon="FileWarning"
        title="Gagal memuat konten"
        description="Konten tidak ditemukan atau terjadi kesalahan."
      >
        <AppButton variant="secondary" size="sm" @click="goBack">Kembali ke daftar</AppButton>
      </AppEmptyState>
    </AppCard>

    <!-- ── Grid dua kolom ─────────────────────────────────────────── -->
    <div v-else class="editor__grid">
      <!-- Kolom utama -->
      <div class="editor__main">
        <!-- Pengaturan per tipe — ditonjolkan di atas untuk video/gallery/live report -->
        <AppCard
          v-if="hasTypeSettings && layout.prominentTypePanel"
          padding="lg"
          class="editor__type-card"
          :style="{ '--type-accent': accent }"
        >
          <template #header>
            <div class="editor__card-head">
              <Settings :size="15" :style="{ color: accent }" />
              <span class="editor__card-title">Pengaturan {{ currentTypeLabel }}</span>
            </div>
          </template>
          <TypeSettingsPanel
            v-model:meta="meta"
            :type="form.type"
            :disabled="readOnly"
            :errors="fieldErrors"
          />
        </AppCard>

        <!-- Judul + permalink + editor -->
        <AppCard padding="lg">
          <div class="editor__main-stack">
            <div data-field="title">
              <AppInput
                v-model="form.title"
                label="Judul"
                placeholder="Masukkan judul konten…"
                size="lg"
                required
                :disabled="readOnly"
                :error="fieldErrors.title"
              />
            </div>

            <!-- Permalink -->
            <div class="editor__permalink" data-field="slug">
              <span class="editor__permalink-label"><LinkIcon :size="13" /> Permalink</span>
              <div class="editor__permalink-row">
                <span class="editor__permalink-base">{{ permalinkBase }}</span>
                <AppInput
                  v-model="slug"
                  size="sm"
                  placeholder="slug-otomatis"
                  :disabled="readOnly"
                  :error="fieldErrors.slug"
                />
              </div>
            </div>

            <div data-field="body">
              <RichTextEditor
                v-model="form.body"
                label="Isi Konten"
                :disabled="readOnly"
                :error="fieldErrors.body"
              />
            </div>
          </div>
        </AppCard>

        <!-- Pengaturan per tipe (posisi standar — di bawah body) -->
        <AppCard v-if="hasTypeSettings && !layout.prominentTypePanel" padding="lg">
          <template #header>
            <div class="editor__card-head">
              <Settings :size="15" />
              <span class="editor__card-title">Pengaturan {{ currentTypeLabel }}</span>
            </div>
          </template>
          <TypeSettingsPanel
            v-model:meta="meta"
            :type="form.type"
            :disabled="readOnly"
            :errors="fieldErrors"
          />
        </AppCard>

        <!-- SEO -->
        <AppCard padding="lg">
          <template #header>
            <div class="editor__card-head">
              <Search :size="15" />
              <span class="editor__card-title">SEO</span>
            </div>
          </template>
          <SeoPanel
            v-model:meta="meta"
            :disabled="readOnly"
            :errors="fieldErrors"
            :preview-title="form.title"
            :permalink="permalinkBase + slug"
          />
        </AppCard>
      </div>

      <!-- Sidebar -->
      <aside class="editor__side">
        <!-- Publikasi -->
        <AppCard padding="md">
          <template #header>
            <div class="editor__card-head">
              <span class="editor__card-title">Publikasi</span>
            </div>
          </template>

          <div class="editor__side-stack">
            <EditorialActions
              v-if="isEdit"
              :status="currentStatus"
              :loading="transitionMutation.isPending.value"
              :disabled="readOnly"
              @transition="onTransition"
            />
            <p v-else class="editor__hint">
              Konten baru disimpan sebagai <strong>Draft</strong>. Aksi penerbitan tersedia setelah
              disimpan.
            </p>

            <AppInput
              v-if="layout.showPublishedAt"
              v-model="form.published_at"
              type="datetime-local"
              label="Tanggal Terbit"
              size="sm"
              :disabled="readOnly"
              :hint="form.published_at ? '' : 'Kosongkan untuk terbit segera.'"
              :error="fieldErrors.published_at"
            />
          </div>
        </AppCard>

        <!-- Tipe & Penulis -->
        <AppCard padding="md">
          <template #header>
            <div class="editor__card-head">
              <span class="editor__card-title">Pengaturan Konten</span>
            </div>
          </template>
          <div class="editor__side-stack">
            <div data-field="type">
              <AppSelect
                v-model="form.type"
                label="Tipe Konten"
                native
                :options="typeOptions"
                size="sm"
                :disabled="isEdit || readOnly"
                :hint="isEdit ? 'Tipe tidak dapat diubah.' : ''"
                :error="fieldErrors.type"
              />
            </div>

            <div data-field="primary_author_id">
              <AppSelect
                v-model="form.primary_author_id"
                label="Penulis Utama"
                native
                placeholder="Pilih penulis…"
                size="sm"
                :options="authorOptions"
                :disabled="readOnly || authorsQuery.isLoading.value"
                :error="fieldErrors.primary_author_id"
              />
            </div>

            <div v-if="layout.showCoAuthors && coAuthorOptions.length" class="editor__coauthors">
              <p class="editor__field-label">Penulis Pendamping</p>
              <div class="editor__coauthor-list">
                <AppCheckbox
                  v-for="opt in coAuthorOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :model-value="form.co_author_ids.includes(opt.value)"
                  :disabled="readOnly"
                  @update:model-value="(v: boolean) => toggleCoAuthor(opt.value, v)"
                />
              </div>
            </div>
          </div>
        </AppCard>

        <!-- Gambar unggulan -->
        <AppCard padding="md">
          <template #header>
            <div class="editor__card-head">
              <ImageIcon :size="15" />
              <span class="editor__card-title">Gambar Unggulan</span>
            </div>
          </template>
          <FeaturedImagePicker v-model="featuredImage" :disabled="readOnly" />
        </AppCard>

        <!-- Taxonomies -->
        <AppCard v-if="layout.showTaxonomy" padding="md">
          <template #header>
            <div class="editor__card-head">
              <Tags :size="15" />
              <span class="editor__card-title">Taxonomies</span>
            </div>
          </template>
          <TaxonomyPicker v-model="terms" :disabled="readOnly" />
        </AppCard>
      </aside>
    </div>

    <!-- Konfirmasi tinggalkan halaman saat ada perubahan belum disimpan -->
    <ConfirmDialog
      :model-value="showLeaveConfirm"
      title="Perubahan belum disimpan"
      message="Ada perubahan yang belum disimpan. Jika kamu meninggalkan halaman ini, perubahan tersebut akan hilang. Lanjut keluar?"
      confirm-label="Tinggalkan halaman"
      :danger="true"
      @confirm="confirmLeave"
      @update:model-value="(v: boolean) => { if (!v) cancelLeave(); }"
    />
  </section>
</template>

<style scoped>
.editor { display: flex; flex-direction: column; gap: 20px; }

/* Topbar (sticky) */
.editor__topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 0;
  margin: -4px 0;
  background: color-mix(in srgb, var(--color-bg) 88%, transparent);
  backdrop-filter: blur(8px);
}
.editor__topbar-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
.editor__title-block { display: flex; align-items: center; gap: 10px; min-width: 0; }
.editor__accent {
  width: 4px;
  height: 20px;
  border-radius: 99px;
  flex-shrink: 0;
}
.editor__heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
}

/* Kartu pengaturan tipe yang ditonjolkan: strip aksen warna di tepi kiri. */
.editor__type-card {
  border-left: 3px solid var(--type-accent, var(--color-primary));
}
.editor__topbar-right { display: flex; align-items: center; gap: 10px; }

.editor__lock {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 16px;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-warning);
  background: var(--color-warning-light);
  color: var(--color-text-primary);
  font-size: 13px;
}
.editor__muted { font-size: 13px; color: var(--color-text-muted); }

/* Ringkasan error */
.editor__errors {
  border: 1.5px solid var(--color-danger);
  background: var(--color-danger-light);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
}
.editor__errors-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-danger);
  margin-bottom: 6px;
}
.editor__errors-list { display: flex; flex-direction: column; gap: 3px; }
.editor__errors-list li { font-size: 12.5px; color: var(--color-text-muted); }
.editor__errors-link {
  border: none;
  background: none;
  padding: 0;
  color: var(--color-danger);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}
.editor__errors-msg { margin-left: 4px; }

/* Grid */
.editor__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
}
.editor__main { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.editor__side { display: flex; flex-direction: column; gap: 20px; }

.editor__main-stack { display: flex; flex-direction: column; gap: 18px; }
.editor__side-stack { display: flex; flex-direction: column; gap: 16px; }

/* Card header */
.editor__card-head { display: flex; align-items: center; gap: 8px; color: var(--color-text-muted); }
.editor__card-title { font-size: 13.5px; font-weight: 600; color: var(--color-text-primary); }

/* Permalink */
.editor__permalink { display: flex; flex-direction: column; gap: 6px; }
.editor__permalink-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.editor__permalink-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.editor__permalink-base {
  font-size: 12.5px;
  color: var(--color-text-subtle);
  font-family: var(--font-mono);
  white-space: nowrap;
}
.editor__permalink-row :deep(.app-input-wrap) { flex: 1; min-width: 160px; }

.editor__hint { font-size: 12.5px; color: var(--color-text-muted); line-height: 1.5; }
.editor__field-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 9px;
}
.editor__coauthor-list { display: flex; flex-direction: column; gap: 9px; }

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .editor__grid { grid-template-columns: 1fr; }
  .editor__side { flex-direction: column; }
}
@media (max-width: 640px) {
  .editor__topbar { align-items: flex-start; }
  .editor__topbar-right { width: 100%; }
  .editor__topbar-right :deep(.app-btn) { flex: 1; }
  .editor__heading { font-size: 1.25rem; }
}
</style>
