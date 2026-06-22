/**
 * src/features/public/data/homeSource.ts
 * Sumber data beranda publik dengan toggle mock/API.
 *
 * Mode mock (VITE_USE_MOCK=true) → baca home.mock.json agar visual langsung penuh
 * tanpa backend. Mode live → komponen tetap memakai service (contentService dll).
 * Config beranda (home.theme / home.sections) berstruktur SAMA dengan namespace
 * settings, sehingga transisi ke /settings mulus.
 */
import mock from './home.mock.json';
import type { ContentSummary } from '@/types/domain';
import type { AdSlot } from '@/services/ads.service';
import type { MenuItem } from '@/services/menu.service';

/** Story longgar: superset ContentSummary + field opsional yang dipakai komponen. */
export interface MockStory extends ContentSummary {
  featured_image?: string;
  eyebrow?: string;
  label?: string;
  authors?: Array<{ display_name: string; avatar?: string }>;
  metas?: Record<string, string>;
}

export interface PopularStory {
  id: string;
  slug: string;
  title: string;
  views?: number;
}

export interface FooterLink {
  label: string;
  url: string;
}
export interface FooterColumn {
  title: string;
  links: FooterLink[];
}
export interface FooterConfig {
  columns: FooterColumn[];
  social: Array<{ platform: string; url: string }>;
  copyright: string;
}

/** Warna tema publik (override --color-pub-*). */
export interface PublicThemeColors {
  crimson: string;
  amber: string;
  ink: string;
  muted: string;
  paper: string;
  canvas: string;
  line: string;
}

export type SectionKey =
  | 'hero'
  | 'live'
  | 'analysis'
  | 'centerFeed'
  | 'videoRail'
  | 'opinionRail'
  | 'popular'
  | 'moreNews';

export interface SectionConfig {
  key: SectionKey;
  enabled: boolean;
  variant: string;
}

export interface HomeConfig {
  'home.theme': PublicThemeColors;
  'home.sections': SectionConfig[];
}

export interface HomeData {
  nav: MenuItem[];
  trending: string[];
  hero: MockStory;
  liveUpdates: MockStory[];
  analysis: MockStory;
  centerFeatured: MockStory;
  centerList: MockStory[];
  popular: PopularStory[];
  videos: MockStory[];
  opinions: MockStory[];
  ads: AdSlot[];
  footer: FooterConfig;
  config: HomeConfig;
}

/**
 * Flag global: pakai dummy data beranda. Default TRUE (mode demo) kecuali
 * di-set eksplisit "false" lewat VITE_USE_MOCK — agar visual selalu terisi
 * tanpa bergantung pada backend atau pemuatan env yang rapuh saat restart.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const data = mock as unknown as HomeData;

/** Seluruh dummy data beranda (sinkron — tak perlu await di mode mock). */
export function getHomeMock(): HomeData {
  return data;
}

/** Config beranda dari mock (mode live: gabung dengan settingsService di pemanggil). */
export function getMockHomeConfig(): HomeConfig {
  return data.config;
}

/** Ads mock tersaring per position (mode mock). */
export function getMockAdsByPosition(position: string): AdSlot[] {
  return data.ads
    .filter((a) => a.active && a.position === position)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}
