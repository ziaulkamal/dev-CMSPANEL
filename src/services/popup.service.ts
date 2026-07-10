/**
 * src/services/popup.service.ts
 * Popup konten — CRUD admin (manage_settings).
 */
import { http } from '@/lib/http';

export type PopupKind = 'html' | 'image';
export type PopupScope = 'root' | 'all_public';
export type PopupFrequency = 'always' | 'session' | 'days';

export interface PopupDisplay {
  scope?: PopupScope;
  delay_seconds?: number;
  auto_close_seconds?: number;
  frequency?: PopupFrequency;
  frequency_days?: number;
}

export interface Popup {
  id: string;
  name: string;
  kind: PopupKind;
  active: boolean;
  content: Record<string, unknown>;
  display: PopupDisplay;
  // BE mengembalikan field Prisma apa adanya (camelCase, tanpa recasing).
  startAt?: string | null;
  endAt?: string | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PopupPayload {
  name: string;
  kind: PopupKind;
  active?: boolean;
  content?: Record<string, unknown>;
  display?: PopupDisplay;
  start_at?: string | null;
  end_at?: string | null;
  sort_order?: number;
}

export const popupService = {
  /** Semua popup (admin, butuh auth manage_settings). */
  list() {
    return http.get<Popup[]>('/popups');
  },
  /** Popup aktif untuk situs publik (tanpa auth). */
  listActive() {
    return http.get<Popup[]>('/popups/active');
  },
  create(payload: PopupPayload) {
    return http.post<Popup>('/popups', payload);
  },
  update(id: string, payload: Partial<PopupPayload>) {
    return http.put<Popup>(`/popups/${id}`, payload);
  },
  remove(id: string) {
    return http.delete<unknown>(`/popups/${id}`);
  },
};
