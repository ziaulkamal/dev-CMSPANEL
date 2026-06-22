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
  /** Label kategori (mis. "DUNIA", "EKONOMI") untuk CategoryTag. */
  category?: string;
  /** Slug kategori untuk tautan TaxonomyView (fallback: slugify dari category). */
  category_slug?: string;
  /** Warna kategori (hex) — fallback ke crimson. */
  category_color?: string;
  authors?: Array<{ id?: string; display_name: string; avatar?: string; bio?: string }>;
  /** Tag/topik artikel (ditampilkan di akhir tulisan, sebelum komentar). */
  tags?: Array<{ label: string; slug?: string }>;
  metas?: Record<string, string>;
  /** Statistik keterlibatan: jumlah dilihat, komentar, disukai, dibagikan. */
  stats?: { views?: number; comments?: number; likes?: number; shares?: number };
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

/**
 * Palet gelap segment publik. Karena usePublicTheme memasang token sebagai inline
 * style (menang atas CSS .dark), mode gelap dipilih di JS lalu menimpa token yang
 * sama. ink↔paper/canvas dibalik, crimson sedikit diterangkan agar kontras.
 */
export const PUBLIC_THEME_DARK: PublicThemeColors = {
  crimson: '#ff4d61',
  amber: '#fbbf24',
  ink: '#f4f2ee',
  muted: '#9a958c',
  paper: '#17161a',
  canvas: '#0f0e12',
  line: '#2c2a31',
};

export type SectionKey =
  | 'hero'
  | 'live'
  | 'analysis'
  | 'editorsPick'
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
  /** Galeri infografis (kartu potret 9:16, judul overlay). */
  analysis: MockStory[];
  editorsPick: MockStory[];
  centerFeatured: MockStory;
  centerList: MockStory[];
  /** Pool berita untuk section "Berita per Kategori" (dikelompokkan per kategori). */
  categoryNews: MockStory[];
  /** Pool cadangan "Terbaru" untuk lazy-load (dimunculkan per-5 saat klik). */
  latestMore: MockStory[];
  /** Menu tambahan (baris kedua, scroll horizontal) di bawah Headline News. */
  secondaryNav: MenuItem[];
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

/**
 * Gabungan semua story mock jadi satu pool (dedup by id) untuk pencarian &
 * halaman daftar. Urut terbaru dulu.
 */
export function getMockStoryPool(): MockStory[] {
  const d = data;
  const all: MockStory[] = [
    d.hero,
    d.centerFeatured,
    ...d.liveUpdates,
    ...d.analysis,
    ...d.editorsPick,
    ...d.centerList,
    ...d.categoryNews,
    ...d.latestMore,
    ...d.videos,
    ...d.opinions,
  ].filter(Boolean);

  const seen = new Set<string>();
  const unique = all.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  return unique.sort(
    (a, b) =>
      new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime(),
  );
}

/**
 * Cari story dari pool mock berdasarkan query (judul + kategori).
 * Ranking sederhana: judul cocok > kategori cocok; prefix lebih kuat.
 */
export function searchMockStories(query: string, limit = 10): MockStory[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = getMockStoryPool()
    .map((s) => {
      const title = (s.title ?? '').toLowerCase();
      const cat = (s.category ?? '').toLowerCase();
      let score = 0;
      if (title.startsWith(q)) score += 100;
      else if (title.includes(q)) score += 50;
      if (cat === q) score += 30;
      else if (cat.includes(q)) score += 15;
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.s);
}

/** Story difilter per kategori (slug atau label, case-insensitive). */
export function getMockByCategory(slug: string): MockStory[] {
  const key = slug.trim().toLowerCase();
  return getMockStoryPool().filter(
    (s) => (s.category ?? '').toLowerCase() === key,
  );
}

/** Galeri infografis mock (kategori INFOGRAFIS / pool analysis). */
export function getMockInfographics(): MockStory[] {
  return data.analysis ?? [];
}

/** Story milik satu author (cocokkan display_name). */
export function getMockByAuthor(authorId: string): MockStory[] {
  const key = authorId.trim().toLowerCase();
  return getMockStoryPool().filter((s) =>
    (s.authors ?? []).some(
      (a) => a.display_name.toLowerCase().replace(/\s+/g, '-') === key,
    ),
  );
}

/**
 * Bangun isi artikel (HTML) bertema Aceh-Indonesia dari ringkasan story.
 * Minimal 6 paragraf: lead (excerpt) + 5+ paragraf turunan yang menyesuaikan
 * judul/kategori, plus kutipan & poin. Dipakai mode mock agar setiap artikel
 * yang bisa diklik punya badan tulisan utuh tanpa menulis 40× body di JSON.
 */
function buildMockBody(s: MockStory): string {
  const judul = s.title ?? 'Berita ini';
  const lead = s.excerpt ?? `${judul}.`;
  const kategori = (s.category ?? 'Aceh').toLowerCase();
  const penulis = s.authors?.[0]?.display_name ?? 'Redaksi';

  const paragraf = [
    `<p>${lead}</p>`,
    `<p>BANDA ACEH — Kabar ini berkembang cepat sejak pagi dan langsung menjadi sorotan di berbagai daerah di Provinsi Aceh. Sejumlah pihak menilai perkembangan tersebut berdampak langsung pada masyarakat di Banda Aceh, Aceh Besar, hingga kabupaten di pesisir timur dan barat.</p>`,
    `<p>Pemerintah Aceh menyatakan akan terus memantau situasi dan memastikan kebijakan yang diambil berpihak pada kepentingan warga. "Kami ingin memastikan setiap langkah membawa manfaat nyata bagi masyarakat Aceh, bukan sekadar seremoni," ujar seorang pejabat yang ditemui di Kantor Gubernur, Banda Aceh.</p>`,
    `<p>Di tingkat akar rumput, tanggapan warga beragam. Sebagian menyambut baik karena dinilai membuka peluang ekonomi dan lapangan kerja baru, terutama bagi generasi muda Aceh yang selama ini merantau ke luar provinsi. Namun sebagian lain meminta agar pelaksanaan di lapangan benar-benar transparan dan melibatkan tokoh masyarakat setempat.</p>`,
    `<p>Pengamat dari Universitas Syiah Kuala menilai isu seputar ${kategori} ini perlu dibaca dalam konteks pembangunan Aceh yang lebih luas. Menurutnya, momentum saat ini bisa menjadi pijakan penting bila dikelola dengan tata kelola yang baik, koordinasi lintas instansi, dan dukungan data yang memadai.</p>`,
    `<p>Data yang dihimpun di lapangan menunjukkan tren yang patut dicermati dalam beberapa pekan terakhir. Pelaku usaha lokal, kelompok nelayan, serta komunitas warga menyatakan kesiapan untuk berperan, sembari berharap pemerintah daerah memberi kepastian aturan dan akses yang setara bagi semua pihak.</p>`,
    `<p>Sejumlah agenda lanjutan telah disiapkan untuk menindaklanjuti perkembangan ini, mulai dari pertemuan teknis hingga sosialisasi ke kabupaten/kota. Para pemangku kepentingan menargetkan langkah konkret dapat terlihat dalam waktu dekat agar manfaatnya segera dirasakan masyarakat Aceh.</p>`,
    `<p>WARTAKAN MEDIA akan terus memperbarui laporan ini seiring perkembangan terbaru. Laporan disusun oleh ${penulis} dari Banda Aceh.</p>`,
  ];

  return paragraf.join('\n');
}

/** Detail story dari pool mock berdasarkan id (untuk ArticleView mode mock). */
export function getMockStory(id: string): (MockStory & { body?: string }) | undefined {
  const story = getMockStoryPool().find((s) => s.id === id);
  if (!story) return undefined;
  return { ...story, body: buildMockBody(story) };
}

/** Komentar mock berthread untuk demo (mode mock; backend tak dipanggil). */
export interface MockComment {
  id: string;
  body: string;
  guest_name?: string;
  created_at: string;
  parent_id?: string | null;
  is_admin?: boolean;
}
export function getMockComments(): MockComment[] {
  const now = Date.now();
  const min = 60_000;
  return [
    {
      id: 'c1',
      guest_name: 'Rani Pratiwi',
      body: 'Liputan yang sangat berimbang. Terima kasih, redaksi.',
      created_at: new Date(now - 42 * min).toISOString(),
      parent_id: null,
    },
    {
      id: 'c2',
      guest_name: 'Redaksi',
      body: 'Terima kasih atas masukannya. Kami akan terus memantau perkembangan.',
      created_at: new Date(now - 30 * min).toISOString(),
      parent_id: 'c1',
      is_admin: true,
    },
    {
      id: 'c3',
      guest_name: 'Budi Santoso',
      body: 'Apakah ada update terbaru soal ini?',
      created_at: new Date(now - 12 * min).toISOString(),
      parent_id: null,
    },
  ];
}
