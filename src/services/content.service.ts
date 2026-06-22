/**
 * src/services/content.service.ts
 * Akses konten: feed publik, detail, CRUD admin, transisi status, lock, meta.
 */
import { http } from '@/lib/http';
import type { ApiSuccess } from '@/types/api';
import type { Content, ContentStatus, ContentSummary } from '@/types/domain';

/**
 * Parameter listing konten — hanya key yang di-whitelist backend
 * (lihat dev-CMSCORE list-content.query.ts). Kirim key lain → 400.
 */
export interface ContentListParams {
  type?: string;
  status?: ContentStatus;
  cursor?: string | null;
  limit?: number;
  sort?: string;
}

export const contentService = {
  /** Feed/listing cursor-based. Anonim hanya menerima `published`. */
  list(params?: ContentListParams) {
    return http.getList<ContentSummary[]>('/contents', params);
  },
  detail(id: string) {
    return http.get<Content>(`/contents/${id}`);
  },
  meta(id: string) {
    return http.get<Record<string, string>>(`/contents/${id}/meta`);
  },
  create(payload: Partial<Content> & { type: string; title: string }) {
    return http.post<Content>('/contents', payload);
  },
  update(id: string, payload: Partial<Content>) {
    return http.put<Content>(`/contents/${id}`, payload);
  },
  remove(id: string) {
    return http.delete<unknown>(`/contents/${id}`);
  },
  /** Transisi editorial; `published_at` wajib untuk `scheduled`. */
  transition(id: string, to: ContentStatus, published_at?: string) {
    return http.post<Content>(`/contents/${id}/transition`, { to, published_at });
  },
  upsertMeta(id: string, meta: Record<string, string>) {
    return http.put<Record<string, string>>(`/contents/${id}/meta`, { meta });
  },
  lock(id: string) {
    return http.post<unknown>(`/contents/${id}/lock`);
  },
  heartbeat(id: string) {
    return http.post<unknown>(`/contents/${id}/lock/heartbeat`);
  },
  unlock(id: string, force = false) {
    return http.delete<unknown>(`/contents/${id}/lock`, force ? { force: true } : undefined);
  },
};

export type { ApiSuccess };
