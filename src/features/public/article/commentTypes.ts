/**
 * src/features/public/article/commentTypes.ts
 * Tipe komentar untuk UI publik. Memperluas `Comment` domain dengan field yang
 * BELUM didukung backend (whatsapp, is_admin) + struktur thread `replies`.
 * Field tambahan bersifat mock/lokal — tidak dikirim/diterima dari API.
 */
import type { Comment } from '@/types/domain';

export interface UiComment extends Comment {
  /** Nomor WhatsApp tamu (UI-only; tak disimpan backend). */
  whatsapp?: string;
  /** True bila komentar dari admin/redaksi (mock flag). */
  is_admin?: boolean;
  /** Balasan ter-nest. */
  replies: UiComment[];
}

/** Susun komentar datar (parent_id) menjadi pohon. */
export function buildCommentTree(flat: ReadonlyArray<UiComment>): UiComment[] {
  const byId = new Map<string, UiComment>();
  flat.forEach((c) => byId.set(c.id, { ...c, replies: [] }));
  const roots: UiComment[] = [];
  byId.forEach((c) => {
    const parent = c.parent_id ? byId.get(c.parent_id) : undefined;
    if (parent) parent.replies.push(c);
    else roots.push(c);
  });
  return roots;
}
