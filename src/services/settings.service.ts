/**
 * src/services/settings.service.ts
 * Pengaturan situs (map key-value, manage_settings).
 */
import { http } from '@/lib/http';

/** Nilai setting boleh JSON apa pun (string/number/bool/array/objek ter-namespace). */
export type SettingsMap = Record<string, unknown>;

export const settingsService = {
  /** Semua settings (butuh auth manage_settings) — dipakai admin. */
  get() {
    return http.get<SettingsMap>('/settings');
  },
  /** Subset publik (namespace site./home./social.) tanpa auth — dipakai situs publik. */
  getPublic() {
    return http.get<SettingsMap>('/settings/public');
  },
  update(settings: SettingsMap) {
    return http.put<SettingsMap>('/settings', { settings });
  },
};
