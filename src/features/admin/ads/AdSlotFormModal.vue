<!--
  src/features/admin/ads/AdSlotFormModal.vue
  Form dinamis AdSlot: pilih kind → field config relevan; pilih posisi → opsi tata letak.
  Reuse AppModal, AppInput, AppSelect, AppToggle, FeaturedImagePicker (preview image).
-->
<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { useToast } from '@/composables/useToast';
import { adsService, AD_POSITION_OPTIONS, type AdSlot, type AdKind, type AdPosition } from '@/services/ads.service';
import AppModal from '@/components/app/AppModal.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppSelect from '@/components/app/AppSelect.vue';
import AppToggle from '@/components/app/AppToggle.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppTextarea from '@/components/app/AppTextarea.vue';
import FeaturedImagePicker from '@/features/admin/contents/FeaturedImagePicker.vue';

const props = defineProps<{ modelValue: boolean; slot: AdSlot | null }>();
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; saved: [] }>();

const toast = useToast();

const open = computed<boolean>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});
const isEdit = computed(() => props.slot !== null);

const KIND_OPTIONS = [
  { value: 'image', label: 'Gambar' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'adsense', label: 'Google AdSense' },
];
// Posisi dari sumber tunggal di ads.service (hindari drift dengan public).
const POSITION_OPTIONS = AD_POSITION_OPTIONS;

interface FormState {
  name: string;
  kind: AdKind;
  position: AdPosition;
  active: boolean;
  sort_order: string;
  // config (image)
  image_media_id: string;
  target_url: string;
  alt: string;
  // config (javascript)
  script: string;
  // config (adsense)
  client_id: string;
  slot_id: string;
  // options
  paragraph_index: string;
  delay_seconds: string;
  dismissible: boolean;
}

function blankForm(): FormState {
  return {
    name: '',
    kind: 'image',
    position: 'in_post_below_title',
    active: true,
    sort_order: '0',
    image_media_id: '',
    target_url: '',
    alt: '',
    script: '',
    client_id: '',
    slot_id: '',
    paragraph_index: '1',
    delay_seconds: '5',
    dismissible: true,
  };
}

const form = reactive<FormState>(blankForm());

/** Hidrasi form dari slot saat dibuka (edit) atau reset (create). */
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return;
    Object.assign(form, blankForm());
    const s = props.slot;
    if (!s) return;
    form.name = s.name;
    form.kind = s.kind;
    form.position = s.position;
    form.active = s.active;
    form.sort_order = String(s.sort_order);
    const cfg = s.config ?? {};
    form.image_media_id = String(cfg.image_media_id ?? '');
    form.target_url = String(cfg.target_url ?? '');
    form.alt = String(cfg.alt ?? '');
    form.script = String(cfg.script ?? '');
    form.client_id = String(cfg.client_id ?? '');
    form.slot_id = String(cfg.slot_id ?? '');
    const opt = s.options ?? {};
    form.paragraph_index = String(opt.paragraph_index ?? 1);
    form.delay_seconds = String(opt.delay_seconds ?? 5);
    form.dismissible = opt.dismissible !== false;
  },
);

const showParagraph = computed(() => form.position === 'in_post_after_paragraph');
const showTimer = computed(() => form.position === 'floating_bottom_timer');

function buildConfig(): Record<string, unknown> {
  if (form.kind === 'image') {
    return { image_media_id: form.image_media_id, target_url: form.target_url, alt: form.alt };
  }
  if (form.kind === 'javascript') return { script: form.script };
  return { client_id: form.client_id, slot_id: form.slot_id };
}

function buildOptions(): Record<string, unknown> {
  const opt: Record<string, unknown> = {};
  if (showParagraph.value) opt.paragraph_index = Number(form.paragraph_index) || 1;
  if (showTimer.value) {
    opt.delay_seconds = Number(form.delay_seconds) || 0;
    opt.dismissible = form.dismissible;
  }
  return opt;
}

const mutation = useMutation({
  mutationFn: () => {
    const payload = {
      name: form.name.trim(),
      kind: form.kind,
      position: form.position,
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
      config: buildConfig(),
      options: buildOptions(),
    };
    return props.slot ? adsService.update(props.slot.id, payload) : adsService.create(payload);
  },
  onSuccess: () => {
    toast.success(isEdit.value ? 'Ad slot diperbarui.' : 'Ad slot dibuat.');
    emit('saved');
    open.value = false;
  },
  onError: () => toast.error('Gagal menyimpan ad slot.'),
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
  <AppModal v-model="open" :title="isEdit ? 'Ubah Ad Slot' : 'Tambah Ad Slot'" size="md">
    <div class="flex flex-col gap-4">
      <AppInput v-model="form.name" label="Nama" placeholder="mis. Banner Header" required />

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppSelect v-model="form.kind" label="Tipe" :options="KIND_OPTIONS" />
        <AppSelect v-model="form.position" label="Posisi" :options="POSITION_OPTIONS" />
      </div>

      <!-- Config: image -->
      <template v-if="form.kind === 'image'">
        <div>
          <span class="mb-1.5 block text-xs font-semibold text-text-primary">Gambar</span>
          <FeaturedImagePicker v-model="form.image_media_id" />
        </div>
        <AppInput v-model="form.target_url" label="URL tujuan" placeholder="https://…" />
        <AppInput v-model="form.alt" label="Teks alternatif" placeholder="Deskripsi gambar" />
      </template>

      <!-- Config: javascript -->
      <template v-else-if="form.kind === 'javascript'">
        <AppTextarea v-model="form.script" label="Kode JavaScript" :rows="5" placeholder="<script>…" />
      </template>

      <!-- Config: adsense -->
      <template v-else>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppInput v-model="form.client_id" label="Client ID" placeholder="ca-pub-…" />
          <AppInput v-model="form.slot_id" label="Slot ID" placeholder="1234567890" />
        </div>
      </template>

      <!-- Opsi tata letak per posisi -->
      <AppInput
        v-if="showParagraph"
        v-model="form.paragraph_index"
        label="Setelah paragraf ke-"
        type="number"
      />
      <template v-if="showTimer">
        <AppInput v-model="form.delay_seconds" label="Delay tampil (detik)" type="number" />
        <AppToggle v-model="form.dismissible" label="Bisa ditutup pengunjung" />
      </template>

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
