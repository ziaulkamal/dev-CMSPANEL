/**
 * src/composables/usePublicTheme.ts
 * Terapkan warna tema publik (home.theme) ke CSS variable --color-pub-* secara
 * runtime, di-scope pada elemen pembungkus .public-theme. TIDAK menyentuh token
 * admin (berbeda dari useTheme.ts yang hanya toggle kelas .dark).
 *
 * Mode gelap: karena token dipasang sebagai INLINE style (menang atas CSS .dark),
 * pemilihan palet dilakukan di sini. Saat dark → pakai PUBLIC_THEME_DARK, namun
 * aksen brand (crimson/amber) dari config tetap dipertahankan bila ada.
 */
import { watch, computed, type Ref } from 'vue';
import {
  PUBLIC_THEME_DARK,
  type PublicThemeColors,
} from '@/features/public/data/homeSource';
import { usePublicColorScheme } from '@/composables/usePublicColorScheme';

/** Peta kunci config → nama CSS variable token publik. */
const VAR_MAP: Record<keyof PublicThemeColors, string> = {
  crimson: '--color-pub-crimson',
  amber: '--color-pub-amber',
  ink: '--color-pub-ink',
  muted: '--color-pub-muted',
  paper: '--color-pub-paper',
  canvas: '--color-pub-canvas',
  line: '--color-pub-line',
};

/**
 * Pasang warna ke elemen root publik. `el` adalah ref ke wrapper .public-theme;
 * `colors` reaktif (config admin/light) agar perubahan panel langsung terlihat.
 * Palet final = light(config) atau dark, dipilih oleh usePublicColorScheme.
 */
export function usePublicTheme(
  el: Ref<HTMLElement | null>,
  colors: Ref<Partial<PublicThemeColors> | undefined>,
): void {
  const { isDark } = usePublicColorScheme();

  /** Palet efektif sesuai mode. Dark memakai aksen yang sudah diterangkan agar
   *  kontras di latar gelap (tidak mewarisi crimson light yang terlalu pekat). */
  const palette = computed<Partial<PublicThemeColors>>(() =>
    isDark.value ? PUBLIC_THEME_DARK : colors.value ?? {},
  );

  function apply(): void {
    const node = el.value;
    const c = palette.value;
    if (!node) return;
    (Object.keys(VAR_MAP) as Array<keyof PublicThemeColors>).forEach((k) => {
      const value = c[k];
      if (value) node.style.setProperty(VAR_MAP[k], value);
    });
  }

  watch([el, palette], apply, { immediate: true, deep: true });
}
