/**
 * src/services/seed.service.ts
 * Generator data dummy — seed & cleanup dari panel admin (manage_settings).
 * Backend: src/modules/seed (NestJS). Tiap record dummy bertanda → cleanup aman.
 *
 *   GET  /seed/dummy/status    → status ada/tidak + jumlah per entitas
 *   POST /seed/dummy/generate  → buat data dummy (tolak bila sudah ada)
 *   POST /seed/dummy/cleanup   → hapus semua data dummy
 */
import { http } from '@/lib/http';

/** Jumlah record dummy per entitas. */
export interface SeedCounts {
  authors: number;
  terms: number;
  contents: number;
  media: number;
  comments: number;
  ads: number;
  popups: number;
  settings: number;
}

export interface DummyStatus {
  exists: boolean;
  counts: SeedCounts;
  generatedAt: string | null;
}

/** Opsi generate (semua opsional → backend pakai default). */
export interface GenerateOptions {
  contents?: number;
  authors?: number;
  categories?: number;
  tags?: number;
  includeComments?: boolean;
  includeMenuWidget?: boolean;
  includeAdsPopup?: boolean;
}

export interface SeedResult {
  counts: SeedCounts;
}

export const seedService = {
  getStatus() {
    return http.get<DummyStatus>('/seed/dummy/status');
  },
  generate(options: GenerateOptions) {
    return http.post<SeedResult>('/seed/dummy/generate', options);
  },
  cleanup() {
    return http.post<SeedResult>('/seed/dummy/cleanup', {});
  },
};
