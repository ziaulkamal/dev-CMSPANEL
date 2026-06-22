/**
 * src/lib/tokenStore.ts
 * Penyimpanan token tunggal (localStorage) — dipakai http client & auth store.
 */
import type { AuthTokens } from '@/types/domain';

const ACCESS_KEY = 'cms.access_token';
const REFRESH_KEY = 'cms.refresh_token';

export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  /** Simpan pasangan token hasil login/refresh (rotation). */
  set(tokens: Pick<AuthTokens, 'access_token' | 'refresh_token'>): void {
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
