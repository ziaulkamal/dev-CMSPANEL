/**
 * src/services/ads.service.ts
 * AdSlot (iklan/widget bertipe) — CRUD admin (manage_settings).
 */
import { http } from '@/lib/http';

export type AdKind = 'image' | 'javascript' | 'adsense';
export type AdPosition =
  | 'in_post_below_title'
  | 'in_post_after_paragraph'
  | 'post_sidebar_left'
  | 'post_sidebar_bottom'
  | 'pre_comments'
  | 'floating_top_nav'
  | 'floating_top_nav_mobile'
  | 'floating_bottom_timer'
  | 'flying_carpet';

/** Sumber tunggal posisi + label — dipakai form admin & dokumentasi public. */
export const AD_POSITION_OPTIONS: Array<{ value: AdPosition; label: string }> = [
  { value: 'in_post_below_title', label: 'Dalam post — di bawah judul' },
  { value: 'in_post_after_paragraph', label: 'Dalam post — setelah paragraf ke-N' },
  { value: 'post_sidebar_left', label: 'Sidebar kiri post' },
  { value: 'post_sidebar_bottom', label: 'Sidebar bawah post (half-page sticky)' },
  { value: 'pre_comments', label: 'Dalam post — sebelum komentar' },
  { value: 'floating_top_nav', label: 'Mengambang — atas (nav, desktop)' },
  { value: 'floating_top_nav_mobile', label: 'Mengambang — atas (nav, mobile 300px)' },
  { value: 'floating_bottom_timer', label: 'Mengambang — bawah (timer)' },
  { value: 'flying_carpet', label: 'Flying carpet' },
];

export interface AdSlot {
  id: string;
  name: string;
  kind: AdKind;
  position: AdPosition;
  active: boolean;
  config: Record<string, unknown>;
  options: Record<string, unknown>;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdSlotPayload {
  name: string;
  kind: AdKind;
  position: AdPosition;
  active?: boolean;
  config?: Record<string, unknown>;
  options?: Record<string, unknown>;
  sort_order?: number;
}

export const adsService = {
  list() {
    return http.get<AdSlot[]>('/ads');
  },
  create(payload: AdSlotPayload) {
    return http.post<AdSlot>('/ads', payload);
  },
  update(id: string, payload: Partial<AdSlotPayload>) {
    return http.put<AdSlot>(`/ads/${id}`, payload);
  },
  remove(id: string) {
    return http.delete<unknown>(`/ads/${id}`);
  },
};
