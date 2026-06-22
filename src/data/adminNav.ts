/**
 * src/data/adminNav.ts
 * Definisi menu sidebar admin → dipetakan ke route vue-router (href = path).
 * Item difilter capability di layout sebelum dirender.
 */
import { LayoutDashboard, FileText, Image, Tags, Users, MessageSquare, Settings, UserCircle, Menu, Megaphone, GalleryThumbnails } from '@lucide/vue';
import type { Capability } from '@/types/domain';

export interface AdminNavItem {
  label: string;
  icon?: unknown;
  href?: string;
  capability?: Capability;
  onClick?: () => void;
  /** Ditandai sbg tujuan utama → tampil di bottom-nav mobile (maks 4 lolos capability). */
  primary?: boolean;
}

export interface AdminNavGroup {
  label?: string;
  color?: string;
  items: AdminNavItem[];
}

/** Sumber tunggal menu admin; `capability` opsional untuk guard tampilan. */
export const adminNavSource: AdminNavGroup[] = [
  {
    label: '',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, href: '/admin', primary: true }],
  },
  {
    label: 'Konten',
    color: '#6366f1',
    items: [
      { label: 'Konten', icon: FileText, href: '/admin/contents', capability: 'edit_post', primary: true },
      { label: 'Media', icon: Image, href: '/admin/media', capability: 'manage_media', primary: true },
      { label: 'Taxonomy', icon: Tags, href: '/admin/taxonomies', capability: 'manage_settings' },
      { label: 'Menu', icon: Menu, href: '/admin/menus', capability: 'manage_settings' },
      { label: 'Iklan/Widget', icon: Megaphone, href: '/admin/ads', capability: 'manage_settings' },
      { label: 'Popup', icon: GalleryThumbnails, href: '/admin/popups', capability: 'manage_settings' },
      { label: 'Komentar', icon: MessageSquare, href: '/admin/comments', capability: 'manage_comments', primary: true },
    ],
  },
  {
    label: 'Sistem',
    color: '#64748b',
    items: [
      { label: 'Pengguna', icon: Users, href: '/admin/users', capability: 'manage_users' },
      { label: 'Profil Saya', icon: UserCircle, href: '/admin/profile' },
      { label: 'Pengaturan', icon: Settings, href: '/admin/settings', capability: 'manage_settings' },
    ],
  },
];
