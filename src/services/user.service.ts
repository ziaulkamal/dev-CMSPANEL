/**
 * src/services/user.service.ts
 * User & RBAC: listing user, buat user + assign role, daftar role.
 */
import { http } from '@/lib/http';
import type { Role, User } from '@/types/domain';

/** Field yang dapat diubah admin pada user lain. */
export interface UserUpdate {
  email?: string;
  roles?: string[];
}

export const userService = {
  list() {
    return http.get<User[]>('/users');
  },
  /** Admin: detail satu user. GET /users/:id. */
  get(id: string) {
    return http.get<User>(`/users/${id}`);
  },
  create(payload: { email: string; password: string; roles: string[] }) {
    return http.post<User>('/users', payload);
  },
  /** Super Admin/Admin: ban user. POST /users/:id/ban. */
  ban(id: string, reason?: string) {
    return http.post<User>(`/users/${id}/ban`, { reason });
  },
  /** Super Admin/Admin: cabut ban. POST /users/:id/unban. */
  unban(id: string) {
    return http.post<User>(`/users/${id}/unban`, {});
  },
  /** Admin: ubah email/role user lain. Dependency backend: PATCH /users/:id. */
  update(id: string, payload: UserUpdate) {
    return http.patch<User>(`/users/${id}`, payload);
  },
  /** Admin: reset password user lain. Dependency backend: PUT /users/:id/password. */
  resetPassword(id: string, password: string) {
    return http.put<unknown>(`/users/${id}/password`, { password });
  },
  roles() {
    return http.get<Role[]>('/roles');
  },
};
