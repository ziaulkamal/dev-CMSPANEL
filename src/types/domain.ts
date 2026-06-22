/**
 * src/types/domain.ts
 * Tipe entitas domain CMS Core yang dipakai lintas fitur.
 */

export type ContentType = 'post' | 'page' | 'video' | 'gallery' | 'live_report';

export type ContentStatus =
  | 'draft'
  | 'pending_review'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'trashed';

export interface Author {
  id: string;
  display_name: string;
  bio?: string;
  avatar_media_id?: string | null;
  social_links?: Record<string, string>;
  linked_user_id?: string | null;
}

export interface Term {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
}

/** Ringkasan konten untuk feed/listing. */
export interface ContentSummary {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt?: string;
  status?: ContentStatus;
  published_at?: string | null;
}

/** Detail konten lengkap. */
export interface Content extends ContentSummary {
  body?: string;
  authors?: Author[];
  terms?: Term[];
  metas?: Record<string, string>;
}

export interface Comment {
  id: string;
  body: string;
  guest_name?: string;
  status?: 'pending' | 'approved' | 'spam' | 'trash';
  created_at: string;
  parent_id?: string | null;
}

/** Identitas principal + RBAC dari GET /auth/me. */
export interface Me {
  id: string;
  email: string;
  roles: string[];
  capabilities: Capability[];
  /** Nama tampilan (fallback ke email bila kosong). */
  display_name?: string | null;
  /** ID media avatar (untuk picker). */
  avatar_media_id?: string | null;
  /** URL avatar ter-resolve dari media. */
  avatar_url?: string | null;
  /** ISO timestamp aktivitas terakhir (opsional dari backend). */
  last_login_at?: string | null;
}

export type Capability =
  | 'edit_post'
  | 'edit_others_post'
  | 'publish_post'
  | 'delete_post'
  | 'override_lock'
  | 'manage_comments'
  | 'manage_media'
  | 'manage_users'
  | 'ban_users'
  | 'manage_roles'
  | 'manage_settings'
  | 'read';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface Media {
  id: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  alt_text?: string;
  caption?: string;
  width?: number;
  height?: number;
  created_at?: string;
}

export interface Taxonomy {
  id: string;
  slug: string;
  label: string;
  hierarchical: boolean;
}

export interface Role {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  status?: string;
  display_name?: string | null;
  avatar_media_id?: string | null;
  avatar_url?: string | null;
  banned_at?: string | null;
  banned_reason?: string | null;
  created_at?: string;
  /** ISO timestamp aktivitas terakhir (opsional dari backend). */
  last_login_at?: string | null;
}

/** Map setting key-value global (bentuk longgar). */
export type Settings = Record<string, string | number | boolean>;

/** Info lock konten saat 423 CONTENT_LOCKED. */
export interface LockHolder {
  locked_by?: string;
  locked_until?: string;
}
