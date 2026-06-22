<!--
  src/features/admin/settings/SettingsView.vue
  Pengaturan situs (req #7): form terstruktur 3 tab (Umum / Sosial Media / Feed).
  Backend tetap key-value (Setting); kita kirim key ber-namespace (site.*, social.links, feed.*).
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { Plus, Trash2, Link2, Globe, AtSign, Hash, Share2, Rss } from '@lucide/vue';
import { settingsService, type SettingsMap } from '@/services/settings.service';
import { useToast } from '@/composables/useToast';
import { useIsMobile } from '@/composables/useIsMobile';
import AppCard from '@/components/app/AppCard.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppSelect from '@/components/app/AppSelect.vue';
import AppToggle from '@/components/app/AppToggle.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppTabs from '@/components/app/AppTabs.vue';
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
    feed.rss_enabled = bool('feed.rss_enabled');
    feed.atom_enabled = bool('feed.atom_enabled');
    feed.sitemap_enabled = bool('feed.sitemap_enabled');
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
  'site.search_engine_visible': general.search_engine_visible,
  'social.links': social.value.filter((l) => l.url.trim()),
  'feed.rss_enabled': feed.rss_enabled,
  'feed.atom_enabled': feed.atom_enabled,
  'feed.sitemap_enabled': feed.sitemap_enabled,
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
