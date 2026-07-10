/**
 * src/lib/caseConvert.ts
 * Konversi key objek antara camelCase (kontrak JSON backend dev-CMSCORE saat ini)
 * dan snake_case (konvensi seluruh frontend/tipe domain). Dipakai interceptor
 * axios: response camelCase→snake_case, request snake_case→camelCase.
 *
 * Hanya key yang dikonversi; nilai (string tanggal, dsb) tidak disentuh.
 * Rekursif untuk objek & array bersarang. Aman untuk key yang sudah sesuai
 * (konversi idempoten: `next_cursor`→`next_cursor`, `id`→`id`).
 */

/** `displayName` → `display_name`. */
function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** `display_name` → `displayName`. */
function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** Nilai yang TIDAK boleh ditelusuri sebagai objek biasa. */
function isPlainCollection(val: unknown): boolean {
  if (Array.isArray(val)) return true;
  if (val === null || typeof val !== 'object') return false;
  // Lewati tipe khusus yang tak boleh diubah bentuknya.
  if (val instanceof Date) return false;
  if (typeof FormData !== 'undefined' && val instanceof FormData) return false;
  if (typeof Blob !== 'undefined' && val instanceof Blob) return false;
  return true;
}

/** Transformasi key rekursif dengan fungsi konversi tertentu. */
function convertKeys(input: unknown, fn: (k: string) => string): unknown {
  if (Array.isArray(input)) return input.map((item) => convertKeys(item, fn));
  if (!isPlainCollection(input)) return input;

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
    out[fn(key)] = convertKeys(val, fn);
  }
  return out;
}

/** Response backend (camelCase) → snake_case untuk konsumsi frontend. */
export function keysToSnake<T = unknown>(data: unknown): T {
  return convertKeys(data, camelToSnake) as T;
}

/** Payload frontend (snake_case) → camelCase untuk dikirim ke backend. */
export function keysToCamel<T = unknown>(data: unknown): T {
  return convertKeys(data, snakeToCamel) as T;
}
