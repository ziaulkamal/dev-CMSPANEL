/**
 * src/features/admin/media/upload.config.ts
 * Kebijakan keamanan unggah media: ALLOW-LIST eksplisit (MIME + ekstensi).
 *
 * PENTING: Validasi di sisi klien hanya untuk UX. Backend WAJIB re-validasi
 * tipe asli berkas via magic-bytes — nama file & Content-Type dapat dipalsukan.
 */

export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50 MB

/** Kategori berkas untuk filter & ikon. */
export type MediaCategory = 'image' | 'document' | 'video' | 'other';

interface AllowedDef {
  /** MIME yang diterima. */
  mimes: readonly string[];
  /** Ekstensi (lowercase, tanpa titik) yang diterima. */
  exts: readonly string[];
  category: Exclude<MediaCategory, 'other'>;
}

/**
 * Daftar tipe yang diizinkan. Apa pun di luar daftar ini ditolak —
 * termasuk .js .php .bin .exe .sh .html dan skrip lain yang berpotensi eksploit.
 * (SVG sengaja tidak diizinkan: dapat membawa skrip XSS.)
 */
const ALLOWED: readonly AllowedDef[] = [
  {
    category: 'image',
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    exts: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
  {
    category: 'document',
    mimes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    ],
    exts: ['pdf', 'docx', 'xlsx'],
  },
  {
    category: 'video',
    mimes: ['video/mp4', 'video/webm'],
    exts: ['mp4', 'webm'],
  },
];

/** Atribut `accept` untuk <input type="file"> (gabungan semua MIME + ekstensi). */
export const ACCEPT_ATTR = ALLOWED.flatMap((d) => [
  ...d.mimes,
  ...d.exts.map((e) => `.${e}`),
]).join(',');

function extOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : '';
}

/**
 * Validasi satu berkas terhadap allow-list. Mengembalikan pesan error
 * (string) bila ditolak, atau `null` bila lolos.
 * Memeriksa ekstensi DAN MIME — keduanya harus berada dalam daftar.
 */
export function validateUpload(file: File): string | null {
  if (file.size > MAX_UPLOAD_SIZE) return `${file.name}: ukuran melebihi 50 MB.`;

  const ext = extOf(file.name);
  const def = ALLOWED.find((d) => d.exts.includes(ext));
  if (!def) {
    return `${file.name}: tipe berkas tidak diizinkan. Hanya gambar, PDF, DOCX, XLSX, atau video.`;
  }
  // MIME juga harus cocok kategori (tolak nama palsu seperti virus.pdf.exe).
  if (file.type && !def.mimes.includes(file.type)) {
    return `${file.name}: jenis berkas tidak sesuai ekstensinya.`;
  }
  return null;
}

/** Tentukan kategori dari MIME (untuk ikon & filter). */
export function categoryOf(mime: string): MediaCategory {
  for (const def of ALLOWED) {
    if (def.mimes.includes(mime)) return def.category;
  }
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'other';
}

/** Opsi filter kategori untuk MediaLibraryView. */
export const MEDIA_CATEGORY_FILTERS: ReadonlyArray<{ value: MediaCategory | 'all'; label: string }> =
  [
    { value: 'all', label: 'Semua' },
    { value: 'image', label: 'Gambar' },
    { value: 'document', label: 'Dokumen' },
    { value: 'video', label: 'Video' },
    { value: 'other', label: 'Lainnya' },
  ];
