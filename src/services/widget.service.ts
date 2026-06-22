/**
 * src/services/widget.service.ts
 * Widget editorial untuk rail beranda (Populer / Pilihan Editor / Video / Opini).
 * Bukan iklan (lihat ads.service) — ini kurasi konten redaksi.
 *
 * Strategi data: disimpan via settings namespace `home.widgets` (array Widget),
 * sehingga tak butuh endpoint backend baru. Tiap widget menempati satu `placement`
 * rail; bila ada >1 untuk placement sama, dipakai yang `active` & sort_order terkecil.
 *
 *   GET  /settings → { 'home.widgets': Widget[] }
 *   PUT  /settings → simpan map ber-namespace
 */
import { settingsService } from '@/services/settings.service';

/** Penempatan rail yang dikenali public (memetakan section beranda). */
export type WidgetPlacement = 'popular' | 'editorsPick' | 'video' | 'opinion';

/**
 * Mode sumber konten:
 *  - auto     : query feed (type/sort/limit)
 *  - manual   : kurasi manual (pilih konten satu per satu)
 *  - taxonomy : tarik feed lalu saring per term (kategori). Karena backend listing
 *               belum menerima filter term, penyaringan dilakukan di klien
 *               (lihat useWidgets). Begitu backend punya ?term=, tinggal dipetakan.
 */
export type WidgetSourceMode = 'auto' | 'manual' | 'taxonomy';

export const WIDGET_PLACEMENTS: Array<{ value: WidgetPlacement; label: string }> = [
  { value: 'popular', label: 'Rail: Populer' },
  { value: 'editorsPick', label: 'Pilihan Editor' },
  { value: 'video', label: 'Rail: Video' },
  { value: 'opinion', label: 'Rail: Opini' },
];

/** Konfigurasi sumber otomatis (mengikuti whitelist backend: type/sort/limit). */
export interface WidgetAutoConfig {
  /** Tipe konten yang ditarik (post/video/…). */
  content_type: string;
  /** Urutan feed (mis. '-published_at'). */
  sort: string;
  /** Jumlah item. */
  limit: number;
}

/** Item kurasi manual (referensi konten + judul cadangan untuk tampil instan). */
export interface WidgetManualItem {
  id: string;
  title: string;
  slug?: string;
}

/** Konfigurasi sumber dari taxonomy term (disaring di klien sementara). */
export interface WidgetTaxonomyConfig {
  /** Slug taxonomy (mis. 'category'). */
  taxonomy_slug: string;
  /** ID term yang dipilih. */
  term_id: string;
  /** Slug term (cadangan untuk pencocokan & tautan). */
  term_slug?: string;
  /** Tipe konten yang ditarik sebelum disaring. */
  content_type: string;
  /** Jumlah item hasil akhir. */
  limit: number;
}

export interface Widget {
  id: string;
  /** Judul rail yang ditampilkan (override label default placement bila diisi). */
  title: string;
  placement: WidgetPlacement;
  source_mode: WidgetSourceMode;
  auto: WidgetAutoConfig;
  manual: WidgetManualItem[];
  taxonomy: WidgetTaxonomyConfig;
  active: boolean;
  sort_order: number;
}

const SETTINGS_KEY = 'home.widgets';

function normalize(raw: unknown): Widget[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((w): w is Widget => !!w && typeof w === 'object' && 'placement' in w);
}

export function defaultWidget(): Widget {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `w-${Date.now()}`,
    title: '',
    placement: 'popular',
    source_mode: 'auto',
    auto: { content_type: 'post', sort: '-published_at', limit: 5 },
    manual: [],
    taxonomy: { taxonomy_slug: 'category', term_id: '', term_slug: '', content_type: 'post', limit: 5 },
    active: true,
    sort_order: 0,
  };
}

export const widgetService = {
  async list(): Promise<Widget[]> {
    const settings = await settingsService.get();
    return normalize(settings[SETTINGS_KEY]);
  },
  async saveAll(widgets: Widget[]): Promise<Widget[]> {
    await settingsService.update({ [SETTINGS_KEY]: widgets });
    return widgets;
  },
};
