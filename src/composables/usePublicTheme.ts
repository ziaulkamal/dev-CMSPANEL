/**
 * src/composables/usePublicTheme.ts
 * Terapkan warna tema publik (home.theme) ke CSS variable --color-pub-* secara
 * runtime, di-scope pada elemen pembungkus .public-theme. TIDAK menyentuh token
 * admin (berbeda dari useTheme.ts yang hanya toggle kelas .dark).
 */
import { watch, type Ref } from 'vue';
import type { PublicThemeColors } from '@/features/public/data/homeSource';

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
 * `colors` reaktif agar perubahan dari panel langsung terlihat (live preview).
 */
export function usePublicTheme(
  el: Ref<HTMLElement | null>,
  colors: Ref<Partial<PublicThemeColors> | undefined>,
): void {
  function apply(): void {
    const node = el.value;
    const c = colors.value;
    if (!node || !c) return;
    (Object.keys(VAR_MAP) as Array<keyof PublicThemeColors>).forEach((k) => {
      const value = c[k];
      if (value) node.style.setProperty(VAR_MAP[k], value);
    });
  }

  watch([el, colors], apply, { immediate: true, deep: true });
}
