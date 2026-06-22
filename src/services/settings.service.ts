/**
 * src/services/settings.service.ts
 * Pengaturan situs (map key-value, manage_settings).
 */
import { http } from '@/lib/http';

/** Nilai setting boleh JSON apa pun (string/number/bool/array/objek ter-namespace). */
export type SettingsMap = Record<string, unknown>;

export const settingsService = {
  get() {
    return http.get<SettingsMap>('/settings');
  },
  update(settings: SettingsMap) {
    return http.put<SettingsMap>('/settings', { settings });
  },
};
