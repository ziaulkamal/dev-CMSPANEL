/**
 * src/features/public/home/sectionRegistry.ts
 * Registry section beranda: penempatan kolom, varian valid, dan label panel.
 * Dipakai HomeView (render) & SettingsView tab Beranda (opsi varian + label).
 */
import type { SectionKey } from '@/features/public/data/homeSource';

/** Kolom grid 3-asimetris (atau full-width untuk section bawah). */
export type SectionColumn = 'left' | 'center' | 'right' | 'full';

export interface SectionMeta {
  /** Label manusiawi untuk panel admin. */
  label: string;
  /** Kolom default penempatan di grid. */
  column: SectionColumn;
  /** Varian valid (value → label) untuk AppSelect di panel. */
  variants: Array<{ value: string; label: string }>;
}

export const SECTION_REGISTRY: Record<SectionKey, SectionMeta> = {
  hero: {
    label: 'Hero / Breaking',
    column: 'left',
    variants: [
      { value: 'overlay', label: 'Overlay (blok crimson)' },
      { value: 'split', label: 'Split (foto atas, teks bawah)' },
    ],
  },
  live: {
    label: 'Live updates',
    column: 'left',
    variants: [{ value: 'default', label: 'Timeline' }],
  },
  analysis: {
    label: 'Analysis',
    column: 'left',
    variants: [{ value: 'default', label: 'Kartu + dek' }],
  },
  centerFeed: {
    label: 'Kolom tengah (feed)',
    column: 'center',
    variants: [
      { value: 'with-thumb', label: 'Dengan thumbnail' },
      { value: 'text-only', label: 'Teks saja' },
    ],
  },
  videoRail: {
    label: 'Rail: Video',
    column: 'right',
    variants: [{ value: 'default', label: 'Thumbnail + durasi' }],
  },
  opinionRail: {
    label: 'Rail: Opinion',
    column: 'right',
    variants: [{ value: 'default', label: 'Avatar + byline' }],
  },
  popular: {
    label: 'Rail: Popular',
    column: 'right',
    variants: [{ value: 'numbered', label: 'Bernomor' }],
  },
  moreNews: {
    label: 'Berita lainnya',
    column: 'full',
    variants: [{ value: 'grid', label: 'Grid 2 kolom' }],
  },
};

/** Urutan default section (fallback bila config kosong). */
export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'hero',
  'live',
  'analysis',
  'centerFeed',
  'videoRail',
  'opinionRail',
  'popular',
  'moreNews',
];
