/**
 * src/services/auth.service.ts
 * Satu-satunya pintu ke endpoint /auth (login, refresh, logout, me).
 */
import { http } from '@/lib/http';
import type { AuthTokens, Me } from '@/types/domain';

export const authService = {
  login(email: string, password: string) {
    return http.post<AuthTokens>('/auth/login', { email, password });
  },
  logout(refresh_token: string) {
    return http.post<unknown>('/auth/logout', { refresh_token });
  },
  me() {
    return http.get<Me>('/auth/me');
  },
  /** Self-service: ubah profil sendiri (nama tampilan, email, avatar). PATCH /auth/me. */
  updateProfile(payload: {
    display_name?: string | null;
    email?: string;
    avatar_media_id?: string | null;
  }) {
    return http.patch<Me>('/auth/me', payload);
  },
  /**
   * Self-service: ubah password sendiri (butuh password lama).
   * Dependency backend: PUT /auth/me/password.
   */
  changePassword(payload: { current_password: string; new_password: string }) {
    return http.put<unknown>('/auth/me/password', payload);
  },
  /** Self-service: nonaktifkan akun sendiri. POST /auth/me/deactivate. */
  deactivate() {
    return http.post<unknown>('/auth/me/deactivate', {});
  },
};
