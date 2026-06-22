<!--
  src/features/admin/settings/SettingsView.vue
  Pengaturan situs (req #7): form terstruktur 3 tab (Umum / Sosial Media / Feed).
  Backend tetap key-value (Setting); kita kirim key ber-namespace (site.*, social.links, feed.*).
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { Plus, Trash2, Link2, Globe, AtSign, Hash, Share2, Rss, ChevronUp, ChevronDown } from '@lucide/vue';
import { settingsService, type SettingsMap } from '@/services/settings.service';
import {
  SECTION_REGISTRY,
  DEFAULT_SECTION_ORDER,
} from '@/features/public/home/sectionRegistry';
import type { PublicThemeColors, SectionConfig } from '@/features/public/data/homeSource';
import { useToast } from '@/composables/useToast';
import { useIsMobile } from '@/composables/useIsMobile';
import AppCard from '@/components/app/AppCard.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppSelect from '@/components/app/AppSelect.vue';
import AppToggle from '@/components/app/AppToggle.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppTabs from '@/components/app/AppTabs.vue';
import AppTextarea from '@/components/app/AppTextarea.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import FeaturedImagePicker from '@/features/admin/contents/FeaturedImagePicker.vue';

const toast = useToast();
const isMobile = useIsMobile();
const queryClient = useQueryClient();
const SETTINGS_KEY = ['admin-settings'] as const;

const settingsQuery = useQuery({ queryKey: SETTINGS_KEY, queryFn: () => settingsService.get() });

// ── Form state ber-namespace ──────────────────────────────────────
interface SocialLink {
  platform: string;
  url: string;
}

const general = reactive({
  title: '',
  tagline: '',
  url: '',
  permalink_style: '/%postname%',
  timezone: '',
  logo: '',
  favicon: '',
  search_engine_visible: true,
});

const social = ref<SocialLink[]>([]);

const feed = reactive({ rss_enabled: false, atom_enabled: false, sitemap_enabled: false });

// ── Footer: kolom tautan + copyright (home.footer) ────────────────
interface FooterLink {
  label: string;
  url: string;
}
interface FooterColumn {
  title: string;
  links: FooterLink[];
}
const footerColumns = ref<FooterColumn[]>([]);
const footerCopyright = ref('');
const footerDesc = ref('');

function addFooterColumn(): void {
  footerColumns.value.push({ title: '', links: [] });
}
function removeFooterColumn(i: number): void {
  footerColumns.value.splice(i, 1);
}
function addFooterLink(ci: number): void {
  footerColumns.value[ci].links.push({ label: '', url: '' });
}
function removeFooterLink(ci: number, li: number): void {
  footerColumns.value[ci].links.splice(li, 1);
}

// ── Beranda: tema warna + section (aktif/varian/urutan) ───────────
const DEFAULT_THEME: PublicThemeColors = {
  crimson: '#e11a33',
  amber: '#f59e00',
  ink: '#15130f',
  muted: '#6b6b6b',
  paper: '#ffffff',
  canvas: '#eceae4',
  line: '#e5e2dc',
};

const homeTheme = reactive<PublicThemeColors>({ ...DEFAULT_THEME });

const THEME_FIELDS: Array<{ key: keyof PublicThemeColors; label: string }> = [
  { key: 'crimson', label: 'Crimson (breaking/live)' },
  { key: 'amber', label: 'Amber (penanda seksi)' },
  { key: 'ink', label: 'Ink (teks/CTA)' },
  { key: 'muted', label: 'Muted (meta)' },
  { key: 'paper', label: 'Paper (latar konten)' },
  { key: 'canvas', label: 'Canvas (latar halaman)' },
  { key: 'line', label: 'Line (divider)' },
];

/** Urutan default semua section (semua aktif, varian pertama dari registry). */
function defaultSections(): SectionConfig[] {
  return DEFAULT_SECTION_ORDER.map((key) => ({
    key,
    enabled: true,
    variant: SECTION_REGISTRY[key].variants[0]?.value ?? 'default',
  }));
}

const homeSections = ref<SectionConfig[]>(defaultSections());

function sectionLabel(key: SectionConfig['key']): string {
  return SECTION_REGISTRY[key].label;
}
function variantOptions(key: SectionConfig['key']) {
  return SECTION_REGISTRY[key].variants;
}
function moveSectionUp(i: number): void {
  if (i <= 0) return;
  const arr = homeSections.value;
  [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
}
function moveSectionDown(i: number): void {
  const arr = homeSections.value;
  if (i >= arr.length - 1) return;
  [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
}

const permalinkOptions = [
  { value: '/%postname%', label: '/nama-artikel' },
  { value: '/%year%/%month%/%postname%', label: '/tahun/bulan/nama-artikel' },
  { value: '/?p=id', label: '/?p=id (sederhana)' },
];

const PLATFORM_OPTIONS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'github', label: 'GitHub' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'other', label: 'Lainnya' },
];

// Lucide tak lagi menyediakan ikon brand; pakai ikon generik per platform.
const PLATFORM_ICON: Record<string, unknown> = {
  facebook: Globe,
  twitter: AtSign,
  instagram: Hash,
  youtube: Share2,
  linkedin: Globe,
  github: Hash,
  tiktok: Share2,
};
function iconFor(platform: string): unknown {
  return PLATFORM_ICON[platform] ?? Link2;
}

// Hidrasi form dari setting yang dimuat.
watch(
  () => settingsQuery.data.value,
  (s) => {
    if (!s) return;
    const str = (k: string, d = '') => (typeof s[k] === 'string' ? (s[k] as string) : d);
    const bool = (k: string, d = false) => (typeof s[k] === 'boolean' ? (s[k] as boolean) : d);
    general.title = str('site.title');
    general.tagline = str('site.tagline');
    general.url = str('site.url');
    general.permalink_style = str('site.permalink_style', '/%postname%');
    general.timezone = str('site.timezone');
    general.logo = str('site.logo_media_id');
    general.favicon = str('site.favicon_media_id');
    general.search_engine_visible = bool('site.search_engine_visible', true);
    social.value = Array.isArray(s['social.links']) ? (s['social.links'] as SocialLink[]) : [];

    // Footer
    const savedFooter = s['home.footer'] as { columns?: FooterColumn[]; copyright?: string } | undefined;
    footerColumns.value = Array.isArray(savedFooter?.columns) ? savedFooter!.columns : [];
    footerCopyright.value = typeof savedFooter?.copyright === 'string' ? savedFooter!.copyright : '';
    footerDesc.value = str('site.footer_desc');

    feed.rss_enabled = bool('feed.rss_enabled');
    feed.atom_enabled = bool('feed.atom_enabled');
    feed.sitemap_enabled = bool('feed.sitemap_enabled');

    // Beranda
    const savedTheme = s['home.theme'] as Partial<PublicThemeColors> | undefined;
    Object.assign(homeTheme, DEFAULT_THEME, savedTheme ?? {});
    const savedSections = s['home.sections'] as SectionConfig[] | undefined;
    homeSections.value =
      Array.isArray(savedSections) && savedSections.length ? savedSections : defaultSections();
  },
  { immediate: true },
);

function addSocial(): void {
  social.value.push({ platform: 'facebook', url: '' });
}
function removeSocial(i: number): void {
  social.value.splice(i, 1);
}

// ── Feed URL (untuk ditampilkan) ──────────────────────────────────
const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
function feedUrl(path: string): string {
  return `${apiBase}/feed/${path}`;
}

const tabs = [
  { value: 'general', label: 'Umum' },
  { value: 'social', label: 'Sosial Media' },
  { value: 'feed', label: 'Feed' },
  { value: 'home', label: 'Beranda' },
  { value: 'footer', label: 'Footer' },
];
const activeTab = ref('general');

const payload = computed<SettingsMap>(() => ({
  'site.title': general.title,
  'site.tagline': general.tagline,
  'site.url': general.url,
  'site.permalink_style': general.permalink_style,
  'site.timezone': general.timezone,
  'site.logo_media_id': general.logo,
  'site.favicon_media_id': general.favicon,
  'site.footer_desc': footerDesc.value,
  'site.search_engine_visible': general.search_engine_visible,
  'social.links': social.value.filter((l) => l.url.trim()),
  'feed.rss_enabled': feed.rss_enabled,
  'feed.atom_enabled': feed.atom_enabled,
  'feed.sitemap_enabled': feed.sitemap_enabled,
  'home.theme': { ...homeTheme },
  'home.sections': homeSections.value,
  'home.footer': {
    columns: footerColumns.value
      .map((c) => ({ title: c.title.trim(), links: c.links.filter((l) => l.label.trim() && l.url.trim()) }))
      .filter((c) => c.title || c.links.length),
    copyright: footerCopyright.value.trim(),
  },
}));

const saveMutation = useMutation({
  mutationFn: () => settingsService.update(payload.value),
  onSuccess: () => {
    toast.success('Pengaturan disimpan.');
    void queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
  },
  onError: () => toast.error('Gagal menyimpan pengaturan.'),
});
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Pengaturan Situs</h1>
        <p class="mt-1 text-sm text-text-muted">Identitas situs, sosial media, dan feed.</p>
      </div>
      <Teleport to="#admin-action-bar" :disabled="!isMobile">
        <AppButton variant="primary" :loading="saveMutation.isPending.value" @click="saveMutation.mutate()">
          Simpan
        </AppButton>
      </Teleport>
    </header>

    <div v-if="settingsQuery.isLoading.value" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <AppCard v-else padding="lg">
      <AppTabs v-model="activeTab" :tabs="tabs">
        <!-- ── Tab Umum ── -->
        <template #general>
          <div class="flex flex-col gap-4 pt-4">
            <AppInput v-model="general.title" label="Judul situs" placeholder="Nama situs" />
            <AppInput v-model="general.tagline" label="Tagline" placeholder="Deskripsi singkat" />
            <AppInput v-model="general.url" label="URL situs" placeholder="https://contoh.com" />
            <AppSelect
              v-model="general.permalink_style"
              label="Struktur permalink"
              :options="permalinkOptions"
            />
            <AppInput v-model="general.timezone" label="Zona waktu" placeholder="Asia/Jakarta" />
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span class="mb-1.5 block text-xs font-semibold text-text-primary">Logo</span>
                <FeaturedImagePicker v-model="general.logo" />
              </div>
              <div>
                <span class="mb-1.5 block text-xs font-semibold text-text-primary">Favicon</span>
                <FeaturedImagePicker v-model="general.favicon" />
              </div>
            </div>
            <AppToggle v-model="general.search_engine_visible" label="Izinkan mesin pencari mengindeks situs" />
          </div>
        </template>

        <!-- ── Tab Sosial Media ── -->
        <template #social>
          <div class="flex flex-col gap-3 pt-4">
            <p v-if="!social.length" class="text-sm text-text-muted">
              Belum ada tautan sosial. Tambahkan di bawah.
            </p>
            <div
              v-for="(link, i) in social"
              :key="i"
              class="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <div class="flex items-center gap-2 sm:w-1/3">
                <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-bg-subtle text-text-muted">
                  <component :is="iconFor(link.platform)" :size="16" />
                </span>
                <AppSelect v-model="link.platform" :options="PLATFORM_OPTIONS" class="flex-1" />
              </div>
              <AppInput v-model="link.url" label="URL" placeholder="https://…" class="flex-1" />
              <AppButton variant="ghost" size="md" icon-only aria-label="Hapus" @click="removeSocial(i)">
                <template #icon><Trash2 :size="16" /></template>
              </AppButton>
            </div>
            <div>
              <AppButton variant="secondary" size="sm" @click="addSocial">
                <template #icon><Plus :size="14" /></template>
                Tambah tautan
              </AppButton>
            </div>
          </div>
        </template>

        <!-- ── Tab Feed ── -->
        <template #feed>
          <div class="flex flex-col gap-4 pt-4">
            <div class="feed-row">
              <div>
                <AppToggle v-model="feed.rss_enabled" label="RSS 2.0" />
                <a v-if="feed.rss_enabled" :href="feedUrl('rss.xml')" target="_blank" class="feed-url">
                  <Rss :size="12" /> {{ feedUrl('rss.xml') }}
                </a>
              </div>
            </div>
            <div class="feed-row">
              <div>
                <AppToggle v-model="feed.atom_enabled" label="Atom 1.0" />
                <a v-if="feed.atom_enabled" :href="feedUrl('atom.xml')" target="_blank" class="feed-url">
                  <Rss :size="12" /> {{ feedUrl('atom.xml') }}
                </a>
              </div>
            </div>
            <div class="feed-row">
              <div>
                <AppToggle v-model="feed.sitemap_enabled" label="Sitemap XML" />
                <a v-if="feed.sitemap_enabled" :href="feedUrl('sitemap.xml')" target="_blank" class="feed-url">
                  <Link2 :size="12" /> {{ feedUrl('sitemap.xml') }}
                </a>
              </div>
            </div>
          </div>
        </template>

        <!-- ── Tab Beranda ── -->
        <template #home>
          <div class="flex flex-col gap-8 pt-4">
            <!-- Warna tema publik -->
            <div>
              <h3 class="mb-1 text-sm font-bold text-text-primary">Warna tema beranda</h3>
              <p class="mb-3 text-xs text-text-muted">
                Mengatur tampilan halaman publik (tidak memengaruhi panel admin).
              </p>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div v-for="f in THEME_FIELDS" :key="f.key" class="flex items-center gap-3">
                  <input
                    type="color"
                    :value="homeTheme[f.key]"
                    class="h-9 w-12 flex-none cursor-pointer rounded border border-border bg-surface"
                    @input="homeTheme[f.key] = ($event.target as HTMLInputElement).value"
                  />
                  <div class="min-w-0 flex-1">
                    <span class="block text-xs font-medium text-text-primary">{{ f.label }}</span>
                    <AppInput v-model="homeTheme[f.key]" placeholder="#000000" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Section: aktif / varian / urutan -->
            <div>
              <h3 class="mb-1 text-sm font-bold text-text-primary">Section beranda</h3>
              <p class="mb-3 text-xs text-text-muted">
                Aktifkan/nonaktifkan, pilih varian, dan atur urutan tampil tiap bagian.
              </p>
              <div class="flex flex-col gap-2">
                <div
                  v-for="(sec, i) in homeSections"
                  :key="sec.key"
                  class="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <div class="flex flex-none flex-col">
                    <AppButton
                      variant="ghost"
                      size="xs"
                      icon-only
                      aria-label="Naik"
                      :disabled="i === 0"
                      @click="moveSectionUp(i)"
                    >
                      <template #icon><ChevronUp :size="14" /></template>
                    </AppButton>
                    <AppButton
                      variant="ghost"
                      size="xs"
                      icon-only
                      aria-label="Turun"
                      :disabled="i === homeSections.length - 1"
                      @click="moveSectionDown(i)"
                    >
                      <template #icon><ChevronDown :size="14" /></template>
                    </AppButton>
                  </div>
                  <span class="min-w-[140px] flex-1 text-sm font-semibold text-text-primary">
                    {{ sectionLabel(sec.key) }}
                  </span>
                  <AppSelect
                    v-model="sec.variant"
                    :options="variantOptions(sec.key)"
                    class="w-full sm:w-56"
                  />
                  <AppToggle v-model="sec.enabled" label="Aktif" />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ── Tab Footer ── -->
        <template #footer>
          <div class="flex flex-col gap-6 pt-4">
            <p class="text-xs text-text-muted">
              Kolom tautan, copyright, dan menu footer. Ikon sosial diambil dari tab
              <strong>Sosial Media</strong>. Brand &amp; logo dari tab <strong>Umum</strong>.
            </p>

            <AppTextarea
              v-model="footerDesc"
              label="Deskripsi footer"
              :rows="2"
              placeholder="Kosongkan untuk memakai tagline situs"
            />

            <!-- Kolom tautan -->
            <div class="flex flex-col gap-4">
              <div
                v-for="(col, ci) in footerColumns"
                :key="ci"
                class="rounded-lg border border-border bg-surface p-3"
              >
                <div class="flex items-center gap-2">
                  <AppInput v-model="col.title" label="Judul kolom" placeholder="Berita" class="flex-1" />
                  <AppButton variant="ghost" size="md" icon-only aria-label="Hapus kolom" @click="removeFooterColumn(ci)">
                    <template #icon><Trash2 :size="16" /></template>
                  </AppButton>
                </div>
                <div class="mt-3 flex flex-col gap-2">
                  <div v-for="(link, li) in col.links" :key="li" class="flex items-end gap-2">
                    <AppInput v-model="link.label" label="Label" placeholder="Aceh" class="flex-1" />
                    <AppInput v-model="link.url" label="URL" placeholder="/kategori/aceh" class="flex-1" />
                    <AppButton variant="ghost" size="md" icon-only aria-label="Hapus tautan" @click="removeFooterLink(ci, li)">
                      <template #icon><Trash2 :size="14" /></template>
                    </AppButton>
                  </div>
                  <div>
                    <AppButton variant="secondary" size="sm" @click="addFooterLink(ci)">
                      <template #icon><Plus :size="14" /></template>
                      Tambah tautan
                    </AppButton>
                  </div>
                </div>
              </div>
              <div>
                <AppButton variant="secondary" size="sm" @click="addFooterColumn">
                  <template #icon><Plus :size="14" /></template>
                  Tambah kolom
                </AppButton>
              </div>
            </div>

            <!-- Copyright -->
            <AppInput
              v-model="footerCopyright"
              label="Teks copyright"
              placeholder="© 2026 Nama Media · Semua hak dilindungi"
            />
          </div>
        </template>
      </AppTabs>
    </AppCard>
  </section>
</template>

<style scoped>
.feed-row {
  padding: 12px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
}
.feed-url {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--color-primary);
  word-break: break-all;
}
.feed-url:hover {
  text-decoration: underline;
}
</style>
