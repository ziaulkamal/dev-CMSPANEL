<!--
  src/features/admin/popups/PopupFormModal.vue
  Form Popup: pilih kind → konten relevan (RichText / gambar+link), segmentasi halaman,
  durasi (rentang tanggal, delay, auto-close) & frekuensi per pengunjung.
  Reuse AppModal, AppInput, AppSelect, AppToggle, RichTextEditor, FeaturedImagePicker.
-->
<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { useToast } from '@/composables/useToast';
import {
  popupService,
  type Popup,
  type PopupKind,
  type PopupScope,
  type PopupFrequency,
} from '@/services/popup.service';
import AppModal from '@/components/app/AppModal.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppSelect from '@/components/app/AppSelect.vue';
import AppToggle from '@/components/app/AppToggle.vue';
import AppButton from '@/components/app/AppButton.vue';
import RichTextEditor from '@/features/admin/contents/RichTextEditor.vue';
import FeaturedImagePicker from '@/features/admin/contents/FeaturedImagePicker.vue';

const props = defineProps<{ modelValue: boolean; popup: Popup | null }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; saved: [] }>();

const toast = useToast();

const open = computed<boolean>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});
const isEdit = computed(() => props.popup !== null);

const KIND_OPTIONS = [
  { value: 'html', label: 'HTML / Rich text' },
  { value: 'image', label: 'Gambar + link' },
];
const SCOPE_OPTIONS = [
  { value: 'all_public', label: 'Semua halaman publik' },
  { value: 'root', label: 'Beranda (root index) saja' },
];
const FREQUENCY_OPTIONS = [
  { value: 'always', label: 'Selalu (setiap kunjungan)' },
  { value: 'session', label: 'Sekali per sesi' },
  { value: 'days', label: 'Sekali per N hari' },
];

interface FormState {
  name: string;
  kind: PopupKind;
  active: boolean;
  sort_order: string;
  // content (html)
  html: string;
  // content (image)
  image_media_id: string;
  target_url: string;
  alt: string;
  // display
  scope: PopupScope;
  delay_seconds: string;
  auto_close_seconds: string;
  frequency: PopupFrequency;
  frequency_days: string;
  // rentang tayang (datetime-local)
  start_at: string;
  end_at: string;
}

function blankForm(): FormState {
  return {
    name: '',
    kind: 'html',
    active: true,
    sort_order: '0',
    html: '',
    image_media_id: '',
    target_url: '',
    alt: '',
    scope: 'all_public',
    delay_seconds: '3',
    auto_close_seconds: '0',
    frequency: 'session',
    frequency_days: '7',
    start_at: '',
    end_at: '',
  };
}

const form = reactive<FormState>(blankForm());

/** Konversi ISO (BE) → nilai input datetime-local (tanpa zona, menit). */
function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Hidrasi form dari popup saat dibuka (edit) atau reset (create). */
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return;
    Object.assign(form, blankForm());
    const p = props.popup;
    if (!p) return;
    form.name = p.name;
    form.kind = p.kind;
    form.active = p.active;
    form.sort_order = String(p.sortOrder ?? 0);
    const c = p.content ?? {};
    form.html = String(c.html ?? '');
    form.image_media_id = String(c.image_media_id ?? '');
    form.target_url = String(c.target_url ?? '');
    form.alt = String(c.alt ?? '');
    const d = p.display ?? {};
    form.scope = (d.scope as PopupScope) ?? 'all_public';
    form.delay_seconds = String(d.delay_seconds ?? 3);
    form.auto_close_seconds = String(d.auto_close_seconds ?? 0);
    form.frequency = (d.frequency as PopupFrequency) ?? 'session';
    form.frequency_days = String(d.frequency_days ?? 7);
    form.start_at = toLocalInput(p.startAt);
    form.end_at = toLocalInput(p.endAt);
  },
);

function buildContent(): Record<string, unknown> {
  if (form.kind === 'html') return { html: form.html };
  return { image_media_id: form.image_media_id, target_url: form.target_url, alt: form.alt };
}

function buildDisplay(): Record<string, unknown> {
  const display: Record<string, unknown> = {
    scope: form.scope,
    delay_seconds: Number(form.delay_seconds) || 0,
    auto_close_seconds: Number(form.auto_close_seconds) || 0,
    frequency: form.frequency,
  };
  if (form.frequency === 'days') display.frequency_days = Number(form.frequency_days) || 1;
  return display;
}

/** datetime-local → ISO (atau null bila kosong). */
function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const mutation = useMutation({
  mutationFn: () => {
    const payload = {
      name: form.name.trim(),
      kind: form.kind,
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
      content: buildContent(),
      display: buildDisplay(),
      start_at: toIso(form.start_at),
      end_at: toIso(form.end_at),
    };
    return props.popup ? popupService.update(props.popup.id, payload) : popupService.create(payload);
  },
  onSuccess: () => {
    toast.success(isEdit.value ? 'Popup diperbarui.' : 'Popup dibuat.');
    emit('saved');
    open.value = false;
  },
  onError: () => toast.error('Gagal menyimpan popup.'),
});

function submit(): void {
  if (!form.name.trim()) {
    toast.error('Nama wajib diisi.');
    return;
  }
  mutation.mutate();
}
</script>

<template>
  <AppModal v-model="open" :title="isEdit ? 'Ubah Popup' : 'Tambah Popup'" size="lg">
    <div class="flex flex-col gap-4">
      <AppInput v-model="form.name" label="Nama" placeholder="mis. Promo Lebaran" required />

      <AppSelect v-model="form.kind" label="Tipe konten" :options="KIND_OPTIONS" />

      <!-- Konten: html -->
      <template v-if="form.kind === 'html'">
        <RichTextEditor v-model="form.html" label="Konten popup" />
      </template>

      <!-- Konten: image -->
      <template v-else>
        <div>
          <span class="mb-1.5 block text-xs font-semibold text-text-primary">Gambar</span>
          <FeaturedImagePicker v-model="form.image_media_id" />
        </div>
        <AppInput v-model="form.target_url" label="URL tujuan (saat diklik)" placeholder="https://…" />
        <AppInput v-model="form.alt" label="Teks alternatif" placeholder="Deskripsi gambar" />
      </template>

      <!-- Segmentasi & durasi -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppSelect v-model="form.scope" label="Tampil di" :options="SCOPE_OPTIONS" />
        <AppSelect v-model="form.frequency" label="Frekuensi" :options="FREQUENCY_OPTIONS" />
      </div>

      <AppInput
        v-if="form.frequency === 'days'"
        v-model="form.frequency_days"
        label="Tampil sekali tiap (hari)"
        type="number"
      />

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppInput v-model="form.delay_seconds" label="Delay tampil (detik)" type="number" />
        <AppInput
          v-model="form.auto_close_seconds"
          label="Auto-tutup setelah (detik, 0 = tidak)"
          type="number"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppInput v-model="form.start_at" label="Mulai tayang (opsional)" type="datetime-local" />
        <AppInput v-model="form.end_at" label="Akhir tayang (opsional)" type="datetime-local" />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppInput v-model="form.sort_order" label="Urutan" type="number" />
        <div class="flex items-end">
          <AppToggle v-model="form.active" label="Aktif" />
        </div>
      </div>
    </div>

    <template #footer>
      <AppButton variant="secondary" :disabled="mutation.isPending.value" @click="open = false">
        Batal
      </AppButton>
      <AppButton variant="primary" :loading="mutation.isPending.value" @click="submit">
        {{ isEdit ? 'Simpan' : 'Buat' }}
      </AppButton>
    </template>
  </AppModal>
</template>
