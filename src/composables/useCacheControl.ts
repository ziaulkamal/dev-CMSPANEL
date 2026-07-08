/**
 * src/composables/useCacheControl.ts
 * Kontrol cache data klien (TanStack Query) tanpa restart server / reload halaman.
 *
 * - refreshAll(): tandai SEMUA query usang → yang aktif di layar fetch ulang.
 * - clearAll(): hapus total cache dari memori (lebih agresif; query aktif fetch ulang).
 * - refresh(keys): refresh sebagian query saja (mis. config publik).
 */
import { useQueryClient } from '@tanstack/vue-query';
import type { QueryKey } from '@tanstack/vue-query';

/** Query publik yang dipengaruhi perubahan config admin (theme/menu/footer/widget). */
export const PUBLIC_CONFIG_KEYS: QueryKey[] = [
  ['public-home-config'],
  ['public-site-config'],
  ['public-widgets'],
];

export function useCacheControl() {
  const queryClient = useQueryClient();

  /** Tandai semua query usang → refetch otomatis untuk yang sedang aktif. */
  async function refreshAll(): Promise<void> {
    await queryClient.invalidateQueries();
  }

  /** Hapus seluruh cache dari memori; query aktif akan fetch ulang dari nol. */
  function clearAll(): void {
    queryClient.clear();
  }

  /** Refresh sebagian: invalidate tiap queryKey yang diberikan. */
  async function refresh(keys: QueryKey[]): Promise<void> {
    await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  }

  /** Refresh khusus config publik (dipakai setelah ubah pengaturan situs). */
  function refreshPublicConfig(): Promise<void> {
    return refresh(PUBLIC_CONFIG_KEYS);
  }

  return { refreshAll, clearAll, refresh, refreshPublicConfig };
}
