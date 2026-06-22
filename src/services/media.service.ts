/**
 * src/services/media.service.ts
 * Media library: listing, upload multipart (MinIO), hapus.
 * Backend mengembalikan media dalam camelCase (fileUrl, mimeType, …);
 * di-normalisasi ke bentuk `Media` (snake_case) agar konsisten di seluruh frontend.
 */
import { http } from '@/lib/http';
import type { ApiSuccess } from '@/types/api';
import type { ContentListParams } from './content.service';
import type { Media } from '@/types/domain';

export interface UploadMeta {
  alt_text?: string;
  caption?: string;
}

/** Field yang dapat diperbarui pasca-upload (rename & metadata). */
export interface MediaUpdate {
  filename?: string;
  alt_text?: string;
  caption?: string;
}

/** Bentuk mentah media dari backend (camelCase) — sebagian field opsional. */
interface RawMedia {
  id: string;
  fileUrl?: string;
  file_url?: string;
  storageKey?: string;
  mimeType?: string;
  mime_type?: string;
  fileSize?: number;
  file_size?: number;
  altText?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  createdAt?: string;
  created_at?: string;
}

/** Normalisasi camelCase → snake_case `Media`. Toleran bila backend sudah snake_case. */
function normalize(raw: RawMedia): Media {
  return {
    id: raw.id,
    file_url: raw.fileUrl ?? raw.file_url ?? '',
    mime_type: raw.mimeType ?? raw.mime_type ?? '',
    file_size: raw.fileSize ?? raw.file_size ?? 0,
    alt_text: raw.altText ?? raw.alt_text ?? undefined,
    caption: raw.caption ?? undefined,
    width: raw.width ?? undefined,
    height: raw.height ?? undefined,
    created_at: raw.createdAt ?? raw.created_at ?? undefined,
  };
}

export const mediaService = {
  async list(params?: Pick<ContentListParams, 'limit' | 'cursor' | 'sort'>) {
    const res = await http.getList<RawMedia[]>('/media', params);
    return { ...res, data: res.data.map(normalize) } as ApiSuccess<Media[]>;
  },
  /** Upload satu file + metadata opsional via multipart/form-data. */
  async upload(file: File, meta: UploadMeta = {}) {
    const form = new FormData();
    form.append('file', file);
    if (meta.alt_text) form.append('alt_text', meta.alt_text);
    if (meta.caption) form.append('caption', meta.caption);
    const raw = await http.upload<RawMedia>('/media', form);
    return normalize(raw);
  },
  /**
   * Perbarui metadata media (rename / alt_text / caption).
   * Dependency backend: endpoint PATCH /media/:id (tandai bila belum ada).
   */
  async update(id: string, payload: MediaUpdate) {
    const raw = await http.patch<RawMedia>(`/media/${id}`, payload);
    return normalize(raw);
  },
  remove(id: string) {
    return http.delete<unknown>(`/media/${id}`);
  },
};
