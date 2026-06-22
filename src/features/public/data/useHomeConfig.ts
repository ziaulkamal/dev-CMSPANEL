/**
 * src/features/public/data/useHomeConfig.ts
 * Sumber config beranda (home.theme + home.sections) reaktif, dengan toggle
 * mock/settings. Dipakai PublicLayout (tema) & HomeView (registry section).
 */
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { settingsService } from '@/services/settings.service';
import {
  USE_MOCK,
  getMockHomeConfig,
  type HomeConfig,
  type PublicThemeColors,
  type SectionConfig,
} from './homeSource';
import { DEFAULT_SECTION_ORDER, SECTION_REGISTRY } from '@/features/public/home/sectionRegistry';

const DEFAULTS = getMockHomeConfig();

/** Section default dari registry (semua aktif, varian pertama). */
function defaultSections(): SectionConfig[] {
  return DEFAULT_SECTION_ORDER.map((key) => ({
    key,
    enabled: true,
    variant: SECTION_REGISTRY[key].variants[0]?.value ?? 'default',
  }));
}

export function useHomeConfig() {
  // Mode live: baca dari /settings (key-value ber-namespace). Mock: query mati.
  const { data } = useQuery({
    queryKey: ['public-home-config'],
    queryFn: () => settingsService.get(),
    retry: false,
    staleTime: 5 * 60_000,
    enabled: !USE_MOCK,
  });

  const config = computed<HomeConfig>(() => {
    if (USE_MOCK) return DEFAULTS;
    const s = data.value ?? {};
    const theme =
      (s['home.theme'] as PublicThemeColors | undefined) ?? DEFAULTS['home.theme'];
    const sections =
      (s['home.sections'] as SectionConfig[] | undefined) ?? defaultSections();
    return { 'home.theme': theme, 'home.sections': sections };
  });

  const theme = computed<PublicThemeColors>(() => config.value['home.theme']);
  /** Section yang aktif, sesuai urutan config. */
  const sections = computed<SectionConfig[]>(() =>
    config.value['home.sections'].filter((x) => x.enabled),
  );

  /** Varian untuk satu key (fallback ke default registry). */
  function variantOf(key: string): string {
    const found = config.value['home.sections'].find((x) => x.key === key);
    return found?.variant ?? 'default';
  }

  return { config, theme, sections, variantOf };
}
