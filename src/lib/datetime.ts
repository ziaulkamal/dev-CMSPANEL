/**
 * src/lib/datetime.ts
 * Helper format waktu yang dipakai lintas fitur admin.
 */

/**
 * Selisih hari dari `iso` hingga sekarang, dalam Bahasa Indonesia.
 * "Hari ini" / "Kemarin" / "N hari lalu". Mengembalikan "—" bila kosong.
 */
export function daysAgo(iso?: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';

  const MS_PER_DAY = 86_400_000;
  // Bandingkan pada batas hari kalender (abaikan jam) agar "kemarin" akurat.
  const startOf = (t: number): number => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const diffDays = Math.round((startOf(Date.now()) - startOf(then)) / MS_PER_DAY);

  if (diffDays <= 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  return `${diffDays} hari lalu`;
}

/**
 * Waktu relatif berbutir halus (detik→menit→jam→hari) dalam Bahasa Indonesia,
 * untuk timeline LIVE/feed. Mis. "baru saja", "6 mnt lalu", "3 jam lalu".
 * Mengembalikan "" bila kosong/invalid (agar pemanggil bisa sembunyikan).
 */
export function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 45) return 'baru saja';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return new Date(then).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
