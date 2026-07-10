/**
 * src/services/menu.service.ts
 * Menu navigasi front-end multi-lokasi. Struktur pohon 2 tingkat (parent → children).
 *
 * Tiga lokasi public: `top` (nav utama masthead), `secondary` (pill scroll),
 * `footer` (kolom tautan). Disimpan via settings namespace `home.menu` agar tak
 * butuh endpoint backend baru (key-value SettingsMap).
 *
 *   GET  /settings → { 'home.menu': { top, secondary, footer } }
 *   PUT  /settings → simpan map ber-namespace
 */
import { settingsService } from '@/services/settings.service';

/** Sumber item menu: tautan manual, halaman (page), atau kategori (taxonomy term). */
export type MenuItemSource = 'custom' | 'page' | 'category';

/** Lokasi penempatan menu di halaman publik. */
export type MenuLocation = 'top' | 'secondary' | 'footer';

export const MENU_LOCATIONS: Array<{ value: MenuLocation; label: string }> = [
  { value: 'top', label: 'Menu Atas (Top)' },
  { value: 'secondary', label: 'Menu Kedua (Secondary)' },
  { value: 'footer', label: 'Menu Footer' },
];

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

/** Peta menu seluruh lokasi (disimpan sebagai satu objek setting). */
export type MenuSet = Record<MenuLocation, MenuTree>;

const SETTINGS_KEY = 'home.menu';

function emptySet(): MenuSet {
  return { top: [], secondary: [], footer: [] };
}

/** Normalisasi nilai setting menjadi MenuSet lengkap (isi lokasi yang hilang). */
function normalize(raw: unknown): MenuSet {
  const base = emptySet();
  if (raw && typeof raw === 'object') {
    const r = raw as Partial<MenuSet>;
    if (Array.isArray(r.top)) base.top = r.top;
    if (Array.isArray(r.secondary)) base.secondary = r.secondary;
    if (Array.isArray(r.footer)) base.footer = r.footer;
  }
  return base;
}

export const menuService = {
  /** Ambil seluruh set menu (semua lokasi). Baca dari settings PUBLIK (home.menu
   *  masuk whitelist) agar situs publik anonim juga bisa memuat menu. */
  async getAll(): Promise<MenuSet> {
    const settings = await settingsService.getPublic();
    return normalize(settings[SETTINGS_KEY]);
  },

  /** Ambil satu lokasi (top default — kompatibel pemanggil lama). */
  async get(location: MenuLocation = 'top'): Promise<MenuTree> {
    const set = await menuService.getAll();
    return set[location] ?? [];
  },

  /** Simpan seluruh set menu (semua lokasi) via settings. */
  async saveAll(set: MenuSet): Promise<MenuSet> {
    await settingsService.update({ [SETTINGS_KEY]: set });
    return set;
  },

  /** Simpan satu lokasi tanpa menimpa lokasi lain. */
  async save(tree: MenuTree, location: MenuLocation = 'top'): Promise<MenuTree> {
    const set = await menuService.getAll();
    set[location] = tree;
    await menuService.saveAll(set);
    return tree;
  },
};

export { emptySet as emptyMenuSet };
