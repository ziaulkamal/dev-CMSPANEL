/**
 * src/features/public/shared/useBreadcrumbs.ts
 * Breadcrumb publik sebagai band TERPISAH dari kartu konten. Halaman (mis.
 * ArticleView) menetapkan trail-nya; PublicLayout merender band di atas <main>.
 * Singleton agar lintas-komponen; trail di-reset otomatis saat ganti rute.
 */
import { ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

export interface Crumb {
  label: string;
  /** Tujuan navigasi; kosong = item aktif (current, tanpa tautan). */
  to?: RouteLocationRaw;
}

const trail = ref<Crumb[]>([]);

export function useBreadcrumbs() {
  return {
    trail,
    set: (items: Crumb[]) => {
      trail.value = items;
    },
    clear: () => {
      trail.value = [];
    },
  };
}
