/**
 * src/services/menu.service.ts
 * Menu navigasi front-end (hamburger). Struktur pohon 2 tingkat (parent → children).
 *
 * Dependency backend (belum tentu tersedia — UI-only plan):
 *   GET  /menus           → MenuTree
 *   PUT  /menus           → simpan MenuTree
 */
import { http } from '@/lib/http';

/** Sumber item menu: tautan manual, halaman (page), atau kategori (taxonomy term). */
export type MenuItemSource = 'custom' | 'page' | 'category';

export interface MenuItem {
  /** id sementara/klien (uuid) — backend boleh menormalkan. */
  id: string;
  label: string;
  url: string;
  source: MenuItemSource;
  /** Referensi entitas sumber (content id / term id) bila bukan custom. */
  ref_id?: string | null;
  children: MenuItem[];
}

export type MenuTree = MenuItem[];

export const menuService = {
  get() {
    return http.get<MenuTree>('/menus');
  },
  save(tree: MenuTree) {
    return http.put<MenuTree>('/menus', { items: tree });
  },
};
