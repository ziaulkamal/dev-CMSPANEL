/**
 * src/lib/media.ts
 * Util URL media: ambil URL dari objek media (toleran variasi field backend)
 * & jadikan absolut bila backend mengembalikan key/path relatif (kasus MinIO/S3).
 */

/** Ambil string URL/key dari objek media, toleran terhadap nama field berbeda. */
export function pickMediaUrl(media: unknown): string {
  const m = media as Record<string, unknown> | null;
  if (!m) return '';
  const candidate =
    m.file_url ??
    m.url ??
    m.fileUrl ??
    m.public_url ??
    m.publicUrl ??
    m.location ??
    m.path ??
    m.object_key ??
    m.key ??
    '';
  return typeof candidate === 'string' ? candidate : '';
}

/** Base URL publik media (opsional) — origin API sebagai cadangan. */
function mediaBase(): string {
  const explicit = import.meta.env.VITE_MEDIA_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  // Cadangan: origin dari VITE_API_BASE_URL (buang path /v1).
  try {
    return new URL(import.meta.env.VITE_API_BASE_URL).origin;
  } catch {
    return '';
  }
}

/**
 * Jadikan URL media absolut & dapat dimuat `<img src>`:
 *  - data:/blob:/http(s): → apa adanya.
 *  - path/key relatif → gabung dengan VITE_MEDIA_BASE_URL (atau origin API).
 */
export function resolveMediaUrl(raw: string | undefined | null): string {
  const url = (raw ?? '').trim();
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const base = mediaBase();
  if (!base) return url;
  return `${base}/${url.replace(/^\/+/, '')}`;
}
