/**
 * src/router/index.ts
 * Dua segment: (public) tanpa auth & (admin) dengan JWT guard + capability.
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { authGuard } from './guards';

const routes: RouteRecordRaw[] = [
  // ── Segment PUBLIC ──────────────────────────────────────────────
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/features/public/home/HomeView.vue') },
      {
        // Lookup detail by id (backend tak punya filter slug); slug = hiasan SEO.
        path: 'artikel/:id/:slug?',
        name: 'article',
        component: () => import('@/features/public/article/ArticleView.vue'),
      },
      {
        path: 'search',
        name: 'search',
        component: () => import('@/features/public/search/SearchView.vue'),
      },
      {
        path: 'terbaru',
        name: 'latest',
        component: () => import('@/features/public/latest/LatestView.vue'),
      },
      {
        path: 'kategori/:slug',
        name: 'taxonomy',
        component: () => import('@/features/public/taxonomy/TaxonomyView.vue'),
      },
      {
        path: 'penulis/:id',
        name: 'author',
        component: () => import('@/features/public/author/AuthorView.vue'),
      },
      {
        path: 'infografis',
        name: 'infographics',
        component: () => import('@/features/public/infographics/InfographicsView.vue'),
      },
    ],
  },

  // ── Auth (LoginView membungkus AuthLayout sendiri) ──────────────
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/admin/auth/LoginView.vue'),
  },

  // ── Segment ADMIN ───────────────────────────────────────────────
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('@/features/admin/dashboard/DashboardView.vue'),
      },
      {
        path: 'contents',
        name: 'admin-contents',
        component: () => import('@/features/admin/contents/ContentListView.vue'),
        meta: { capability: 'edit_post' },
      },
      {
        path: 'contents/new',
        name: 'admin-content-new',
        component: () => import('@/features/admin/contents/ContentEditorView.vue'),
        meta: { capability: 'edit_post' },
      },
      {
        path: 'contents/:id/edit',
        name: 'admin-content-edit',
        component: () => import('@/features/admin/contents/ContentEditorView.vue'),
        meta: { capability: 'edit_post' },
      },
      {
        path: 'media',
        name: 'admin-media',
        component: () => import('@/features/admin/media/MediaLibraryView.vue'),
        meta: { capability: 'manage_media' },
      },
      {
        path: 'taxonomies',
        name: 'admin-taxonomies',
        component: () => import('@/features/admin/taxonomies/TaxonomyView.vue'),
        meta: { capability: 'manage_settings' },
      },
      {
        path: 'comments',
        name: 'admin-comments',
        component: () => import('@/features/admin/comments/CommentModerationView.vue'),
        meta: { capability: 'manage_comments' },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/features/admin/users/UserListView.vue'),
        meta: { capability: 'manage_users' },
      },
      {
        path: 'users/:id',
        name: 'admin-user-detail',
        component: () => import('@/features/admin/users/UserDetailView.vue'),
        meta: { capability: 'manage_users' },
      },
      {
        path: 'menus',
        name: 'admin-menus',
        component: () => import('@/features/admin/menus/MenuBuilderView.vue'),
        meta: { capability: 'manage_settings' },
      },
      {
        path: 'ads',
        name: 'admin-ads',
        component: () => import('@/features/admin/ads/AdSlotListView.vue'),
        meta: { capability: 'manage_settings' },
      },
      {
        path: 'popups',
        name: 'admin-popups',
        component: () => import('@/features/admin/popups/PopupListView.vue'),
        meta: { capability: 'manage_settings' },
      },
      {
        path: 'widgets',
        name: 'admin-widgets',
        component: () => import('@/features/admin/widgets/WidgetListView.vue'),
        meta: { capability: 'manage_settings' },
      },
      {
        path: 'authors',
        name: 'admin-authors',
        component: () => import('@/features/admin/authors/AuthorListView.vue'),
        meta: { capability: 'manage_users' },
      },
      {
        path: 'profile',
        name: 'admin-profile',
        component: () => import('@/features/admin/profile/ProfileView.vue'),
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('@/features/admin/settings/SettingsView.vue'),
        meta: { capability: 'manage_settings' },
      },
      {
        path: 'forbidden',
        name: 'admin-forbidden',
        component: () => import('@/features/admin/auth/ForbiddenView.vue'),
      },
    ],
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/features/public/NotFoundView.vue') },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(authGuard);
