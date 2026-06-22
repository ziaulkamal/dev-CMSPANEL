/**
 * src/router/guards.ts
 * Guard navigasi: pastikan sesi siap, wajib login, dan cek capability per route.
 */
import type { NavigationGuardWithThis } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { Capability } from '@/types/domain';

/** Pasang sekali di router.beforeEach: tegakkan auth + capability dari meta route. */
export const authGuard: NavigationGuardWithThis<undefined> = async (to) => {
  const auth = useAuthStore();
  if (!auth.ready) await auth.fetchMe();

  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  if (!requiresAuth) return true;

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  const cap = to.meta.capability as Capability | undefined;
  if (cap && !auth.can(cap)) {
    return { name: 'admin-forbidden' };
  }
  return true;
};
