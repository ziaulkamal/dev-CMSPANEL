/**
 * src/stores/auth.ts
 * State sesi admin: token, identitas, capabilities — sumber guard UI & router.
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authService } from '@/services/auth.service';
import { tokenStore } from '@/lib/tokenStore';
import type { Capability, Me } from '@/types/domain';

export const useAuthStore = defineStore('auth', () => {
  const me = ref<Me | null>(null);
  const ready = ref(false);

  const isAuthenticated = computed(() => !!tokenStore.access && !!me.value);

  /** Cek satu capability untuk guard tombol/menu/route. */
  function can(cap: Capability): boolean {
    return me.value?.capabilities.includes(cap) ?? false;
  }

  async function login(email: string, password: string): Promise<void> {
    const tokens = await authService.login(email, password);
    tokenStore.set(tokens);
    // Muat identitas; biarkan error mengalir agar pemanggil tahu login gagal
    // memuat sesi (jangan ditelan seperti saat boot).
    try {
      me.value = await authService.me();
    } catch (err) {
      me.value = null;
      tokenStore.clear();
      throw err;
    } finally {
      ready.value = true;
    }
  }

  /** Muat identitas saat boot bila ada token (mis. setelah refresh halaman). */
  async function fetchMe(): Promise<void> {
    if (!tokenStore.access) {
      ready.value = true;
      return;
    }
    try {
      me.value = await authService.me();
    } catch {
      me.value = null;
      tokenStore.clear();
    } finally {
      ready.value = true;
    }
  }

  /** Perbarui identitas lokal setelah self-service profil berubah. */
  function setMe(next: Me): void {
    me.value = next;
  }

  async function logout(): Promise<void> {
    const rt = tokenStore.refresh;
    if (rt) await authService.logout(rt).catch(() => undefined);
    tokenStore.clear();
    me.value = null;
  }

  return { me, ready, isAuthenticated, can, login, fetchMe, setMe, logout };
});
