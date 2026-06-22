/**
 * src/services/comment.service.ts
 * Komentar publik per konten (baca approved) & kirim (default pending).
 */
import { http } from '@/lib/http';
import type { Comment } from '@/types/domain';

export interface CreateCommentPayload {
  body: string;
  guest_name?: string;
  guest_email?: string;
  parent_id?: string | null;
}

export const commentService = {
  /** Komentar `approved` untuk satu konten. */
  listForContent(contentId: string) {
    return http.get<Comment[]>(`/contents/${contentId}/comments`);
  },
  /** Kirim komentar (rate-limited 5/menit; status awal `pending`). */
  create(contentId: string, payload: CreateCommentPayload) {
    return http.post<Comment>(`/contents/${contentId}/comments`, payload);
  },

  // ── Admin (moderasi, butuh manage_comments) ──────────────────
  /** Semua komentar untuk moderasi. */
  listAll(params?: { limit?: number; cursor?: string | null; status?: string }) {
    return http.getList<Comment[]>('/comments', params);
  },
  updateStatus(id: string, status: 'approved' | 'spam' | 'trash' | 'pending') {
    return http.put<Comment>(`/comments/${id}/status`, { status });
  },
};
