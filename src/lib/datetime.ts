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
