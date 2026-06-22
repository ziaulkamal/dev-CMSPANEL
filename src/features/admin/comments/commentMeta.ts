/**
 * src/features/admin/comments/commentMeta.ts
 * Pemetaan status komentar → warna badge & label; opsi filter status.
 */
import type { Comment } from '@/types/domain';

type CommentStatus = NonNullable<Comment['status']>;
type BadgeColor = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export const STATUS_BADGE: Record<CommentStatus, BadgeColor> = {
  pending: 'warning',
  approved: 'success',
  spam: 'danger',
  trash: 'default',
};

export const STATUS_LABEL: Record<CommentStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  spam: 'Spam',
  trash: 'Sampah',
};

/** Opsi filter status untuk AppSelect ('' = semua). */
export const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Semua status' },
  { value: 'pending', label: STATUS_LABEL.pending },
  { value: 'approved', label: STATUS_LABEL.approved },
  { value: 'spam', label: STATUS_LABEL.spam },
  { value: 'trash', label: STATUS_LABEL.trash },
];
