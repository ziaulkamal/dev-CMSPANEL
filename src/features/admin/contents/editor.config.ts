/**
 * src/features/admin/contents/editor.config.ts
 * Konstanta editor konten: opsi tipe, state machine transisi, & definisi field meta per-tipe.
 */
import type { ContentStatus, ContentType } from '@/types/domain';

/** Opsi tipe konten untuk AppSelect (hanya dipilih saat create). */
export const CONTENT_TYPE_OPTIONS: ReadonlyArray<{ value: ContentType; label: string }> = [
  { value: 'post', label: 'Post' },
  { value: 'page', label: 'Page' },
  { value: 'video', label: 'Video' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'live_report', label: 'Live Report' },
];

/**
 * Flag tata letak editor per tipe konten — dibaca ContentEditorView untuk
 * memilih field yang relevan, tanpa menyebar `v-if="type === '…'"` di template.
 */
export interface TypeLayout {
  /** Tampilkan pilihan penulis pendamping (khas artikel). */
  showCoAuthors: boolean;
  /** Tampilkan datetime "Tanggal Terbit" (khas konten ber-waktu). */
  showPublishedAt: boolean;
  /** Tampilkan taxonomy picker (kategori/tag). */
  showTaxonomy: boolean;
  /** Naikkan panel field khas-tipe ke kolom utama, di atas body. */
  prominentTypePanel: boolean;
}

const TYPE_LAYOUTS: Readonly<Record<ContentType, TypeLayout>> = {
  // Post: artikel penuh — semua elemen aktif.
  post: { showCoAuthors: true, showPublishedAt: true, showTaxonomy: true, prominentTypePanel: false },
  // Page: halaman statis — tanpa co-author / tanggal terbit, taxonomy opsional disembunyikan.
  page: { showCoAuthors: false, showPublishedAt: false, showTaxonomy: false, prominentTypePanel: false },
  // Video / Gallery / Live Report: field khas-tipe ditonjolkan di kolom utama.
  video: { showCoAuthors: true, showPublishedAt: true, showTaxonomy: true, prominentTypePanel: true },
  gallery: { showCoAuthors: true, showPublishedAt: true, showTaxonomy: true, prominentTypePanel: true },
  live_report: { showCoAuthors: true, showPublishedAt: true, showTaxonomy: true, prominentTypePanel: true },
};

export function typeLayout(type: ContentType): TypeLayout {
  return TYPE_LAYOUTS[type];
}

/** Label tipe untuk judul/section ("Post", "Page", …). */
export function typeLabel(type: ContentType): string {
  return CONTENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

/** Warna aksen per tipe (token CSS) untuk strip header & badge tipe. */
export const TYPE_ACCENT: Readonly<Record<ContentType, string>> = {
  post: 'var(--color-primary)',
  page: 'var(--color-text-muted)',
  video: 'var(--color-danger)',
  gallery: 'var(--color-success)',
  live_report: 'var(--color-warning)',
};

/** State machine editorial: transisi legal dari tiap status. */
export const STATUS_TRANSITIONS: Readonly<Record<ContentStatus, ReadonlyArray<ContentStatus>>> = {
  draft: ['pending_review', 'trashed'],
  pending_review: ['draft', 'scheduled', 'published', 'trashed'],
  scheduled: ['published', 'trashed'],
  published: ['archived', 'trashed'],
  archived: ['published', 'trashed'],
  trashed: ['draft'],
};

/** Label aksi transisi (verb) untuk tombol. */
export const TRANSITION_LABEL: Readonly<Record<ContentStatus, string>> = {
  draft: 'Kembalikan ke Draft',
  pending_review: 'Ajukan Review',
  scheduled: 'Jadwalkan',
  published: 'Terbitkan',
  archived: 'Arsipkan',
  trashed: 'Buang ke Sampah',
};

/** Tipe input field meta. */
export type MetaFieldType = 'text' | 'textarea' | 'datetime-local' | 'select';

/** Definisi satu field meta EAV. */
export interface MetaFieldDef {
  key: string;
  label: string;
  type: MetaFieldType;
  placeholder?: string;
  options?: ReadonlyArray<{ value: string; label: string }>;
}

/** Key meta yang dikelola langsung oleh panel publish (bukan via field generik). */
export const FEATURED_IMAGE_KEY = 'featured_image';
export const SLUG_KEY = 'slug';

/** Field SEO dasar — selalu tampil di panel SEO. */
export const SEO_FIELDS: ReadonlyArray<MetaFieldDef> = [
  { key: 'seo_title', label: 'SEO Title', type: 'text', placeholder: 'Judul untuk mesin pencari' },
  {
    key: 'seo_description',
    label: 'Meta Description',
    type: 'textarea',
    placeholder: 'Ringkasan ~155 karakter untuk hasil pencarian',
  },
];

/** Field SEO lanjutan — hanya tampil saat "Advanced" diaktifkan. */
export const SEO_ADVANCED_FIELDS: ReadonlyArray<MetaFieldDef> = [
  { key: 'canonical_url', label: 'Canonical URL', type: 'text', placeholder: 'https://…' },
  { key: 'og_image', label: 'OG Image URL', type: 'text', placeholder: 'https://…' },
  { key: 'seo_keywords', label: 'Focus Keywords', type: 'text', placeholder: 'pisahkan dengan koma' },
  {
    key: 'robots',
    label: 'Robots',
    type: 'select',
    options: [
      { value: 'index,follow', label: 'Index, Follow (default)' },
      { value: 'noindex,follow', label: 'No Index, Follow' },
      { value: 'index,nofollow', label: 'Index, No Follow' },
      { value: 'noindex,nofollow', label: 'No Index, No Follow' },
    ],
  },
];

/** Field meta tambahan per tipe konten. */
export const TYPE_FIELDS: Readonly<Record<ContentType, ReadonlyArray<MetaFieldDef>>> = {
  post: [],
  page: [],
  video: [
    { key: 'video_url', label: 'Video URL', type: 'text', placeholder: 'https://…' },
    {
      key: 'video_provider',
      label: 'Provider',
      type: 'select',
      options: [
        { value: 'youtube', label: 'YouTube' },
        { value: 'vimeo', label: 'Vimeo' },
        { value: 'self_hosted', label: 'Self-hosted' },
      ],
    },
    { key: 'video_duration', label: 'Durasi (detik)', type: 'text' },
    { key: 'video_thumbnail', label: 'Thumbnail URL', type: 'text', placeholder: 'https://…' },
  ],
  gallery: [
    { key: 'gallery_cover', label: 'Cover URL', type: 'text', placeholder: 'https://…' },
    {
      key: 'gallery_layout',
      label: 'Layout',
      type: 'select',
      options: [
        { value: 'grid', label: 'Grid' },
        { value: 'masonry', label: 'Masonry' },
        { value: 'carousel', label: 'Carousel' },
      ],
    },
  ],
  live_report: [
    { key: 'event_start_time', label: 'Mulai Acara', type: 'datetime-local' },
    { key: 'event_end_time', label: 'Selesai Acara', type: 'datetime-local' },
    {
      key: 'live_status',
      label: 'Status Live',
      type: 'select',
      options: [
        { value: 'upcoming', label: 'Akan Datang' },
        { value: 'live', label: 'Sedang Berlangsung' },
        { value: 'ended', label: 'Selesai' },
      ],
    },
  ],
};

/** Field meta tambahan spesifik tipe (tanpa SEO) — untuk panel "Pengaturan {tipe}". */
export function typeMetaFields(type: ContentType): MetaFieldDef[] {
  return [...TYPE_FIELDS[type]];
}

/**
 * Semua key meta yang sah dikirim ke backend untuk satu tipe konten.
 * Dipakai sebagai allow-list saat menyusun payload meta.
 */
export function allowedMetaKeys(type: ContentType): Set<string> {
  return new Set([
    FEATURED_IMAGE_KEY,
    SLUG_KEY,
    ...SEO_FIELDS.map((f) => f.key),
    ...SEO_ADVANCED_FIELDS.map((f) => f.key),
    ...TYPE_FIELDS[type].map((f) => f.key),
  ]);
}
