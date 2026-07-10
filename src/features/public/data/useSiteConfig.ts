/**
 * src/features/public/data/useSiteConfig.ts
 * Sumber identitas situs (site.*) & footer (home.footer) reaktif, dengan toggle
 * mock/settings. Dipakai TheMasthead (logo/nama), TheFooter (kolom/sosial/brand).
 *
 * Mode mock (USE_MOCK) → ambil dari home.mock.json + default brand.
 * Mode live → baca /settings key-value ber-namespace.
 */
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { settingsService } from '@/services/settings.service';
import { resolveMediaUrl } from '@/lib/media';
import {
  USE_MOCK,
  getHomeMock,
  type FooterConfig,
} from './homeSource';

/** Identitas situs untuk masthead & footer. */
export interface SiteIdentity {
  name: string;
  tagline: string;
  /** URL logo (kosong → komponen pakai logo default kotak crimson). */
  logoUrl: string;
  /** Deskripsi khusus footer (fallback ke tagline bila kosong). */
  footerDesc: string;
}

const DEFAULT_IDENTITY: SiteIdentity = {
  name: 'WARTAKAN MEDIA',
  tagline: 'Portal berita digital dari Aceh untuk Indonesia. Tegas, jurnalistik, terpercaya.',
  logoUrl: '',
  footerDesc: 'Portal berita digital dari Aceh untuk Indonesia. Tegas, jurnalistik, terpercaya.',
};

export function useSiteConfig() {
  const { data } = useQuery({
    queryKey: ['public-site-config'],
    queryFn: () => settingsService.getPublic(),
    retry: false,
    staleTime: 5 * 60_000,
    enabled: !USE_MOCK,
  });

  const identity = computed<SiteIdentity>(() => {
    if (USE_MOCK) return DEFAULT_IDENTITY;
    const s = data.value ?? {};
    const str = (k: string, d: string) => (typeof s[k] === 'string' && s[k] ? (s[k] as string) : d);
    // Picker menyimpan URL nyata (bukan id) di key `site.logo_media_id`.
    const logo = typeof s['site.logo_media_id'] === 'string' ? (s['site.logo_media_id'] as string) : '';
    const tagline = str('site.tagline', DEFAULT_IDENTITY.tagline);
    return {
      name: str('site.title', DEFAULT_IDENTITY.name),
      tagline,
      logoUrl: logo ? resolveMediaUrl(logo) : '',
      footerDesc: str('site.footer_desc', tagline),
    };
  });

  const footer = computed<FooterConfig>(() => {
    if (USE_MOCK) return getHomeMock().footer;
    const s = data.value ?? {};
    const saved = (s['home.footer'] as Partial<FooterConfig> | undefined) ?? {};
    // Sosial diambil dari namespace bersama `social.links` (tab Sosial Media).
    const social = Array.isArray(s['social.links'])
      ? (s['social.links'] as FooterConfig['social'])
      : [];
    return {
      columns: Array.isArray(saved.columns) ? saved.columns : [],
      social,
      copyright:
        typeof saved.copyright === 'string' && saved.copyright
          ? saved.copyright
          : `© ${new Date().getFullYear()} ${identity.value.name}`,
    };
  });

  return { identity, footer };
}
