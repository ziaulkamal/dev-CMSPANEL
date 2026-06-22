/**
 * src/composables/usePublicColorScheme.ts
 * Mode warna segment publik: 'light' | 'dark' | 'system' (default 'system').
 * - Disimpan di localStorage (key `pub-color-scheme`).
 * - 'system' mengikuti prefers-color-scheme OS secara reaktif.
 * - State singleton (module-level) → toggle dari Masthead/BottomNav konsisten,
 *   palet diterapkan sekali di PublicLayout via usePublicTheme.
 *
 * Catatan: warna --color-pub-* dipasang sebagai inline style oleh usePublicTheme
 * (menang atas CSS .dark), maka pemilihan palet dilakukan di JS. Kita TIDAK
 * menyentuh class .dark di <html> agar tidak bocor ke segment admin (yang punya
 * useTheme + key localStorage sendiri); komponen publik memang memakai token
 * --color-pub-* inline, bukan utility `dark:`.
 */
import { ref, computed, watch } from 'vue';

export type ColorSchemePref = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'pub-color-scheme';

function readStored(): ColorSchemePref {
  if (typeof localStorage === 'undefined') return 'system';
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

/** Media query OS (null saat SSR / lingkungan tanpa matchMedia). */
const mql =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

const pref = ref<ColorSchemePref>(readStored());
const systemDark = ref<boolean>(mql?.matches ?? false);

mql?.addEventListener('change', (e) => {
  systemDark.value = e.matches;
});

/** Mode efektif yang terpakai (resolve 'system'). */
const resolved = computed<'light' | 'dark'>(() =>
  pref.value === 'system' ? (systemDark.value ? 'dark' : 'light') : pref.value,
);

const isDark = computed(() => resolved.value === 'dark');

// Persist pilihan. (Palet diterapkan oleh usePublicTheme via inline var.)
watch(
  pref,
  () => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, pref.value);
  },
  { immediate: true },
);

export function usePublicColorScheme() {
  return {
    pref,
    resolved,
    isDark,
    setPref: (p: ColorSchemePref) => {
      pref.value = p;
    },
    /** Toggle cepat light↔dark (mengabaikan 'system' setelah ditekan). */
    toggle: () => {
      pref.value = resolved.value === 'dark' ? 'light' : 'dark';
    },
  };
}
