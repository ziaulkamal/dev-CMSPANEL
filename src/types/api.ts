/**
 * src/types/api.ts
 * Kontrak dasar respons API CMS Core (envelope, error, pagination).
 */

/** Envelope sukses standar: payload di `data`, `meta` opsional (mis. pagination). */
export interface ApiSuccess<T> {
  data: T;
  meta?: ApiMeta;
}

/** Meta listing cursor-based. `next_cursor = null` artinya halaman habis. */
export interface ApiMeta {
  next_cursor?: string | null;
  limit?: number;
  [key: string]: unknown;
}

/** Envelope error standar. Pakai `code` untuk menentukan UX, bukan status HTTP. */
export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Kode error backend (lihat FRONTEND-API.md). Kode umum diberi literal untuk
 * autocomplete; `(string & {})` mengizinkan kode domain lain (mis. INVALID_PARENT).
 */
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_STATUS_TRANSITION'
  | 'VALIDATION_ERROR'
  | 'CONTENT_LOCKED'
  | 'RATE_LIMITED'
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

/** Parameter listing umum (filter + cursor pagination + sort). */
export interface ListParams {
  limit?: number;
  cursor?: string | null;
  sort?: string; // awalan '-' = descending, mis. '-published_at'
  [key: string]: unknown;
}
