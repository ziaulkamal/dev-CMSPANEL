<!-- src/layouts/AdminLayout.vue — shell admin: sidebar+topbar (desktop) / bottom-nav (mobile). -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { LogOut, UserCircle, Settings } from '@lucide/vue';
import { resolveMediaUrl } from '@/lib/media';
import BaseLayout from './BaseLayout.vue';
import AppBottomNav from '@/components/app/AppBottomNav.vue';
import AppNavSheet from '@/components/app/AppNavSheet.vue';
import AppActionBar from '@/components/app/AppActionBar.vue';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/composables/useTheme';
import { useIsMobile } from '@/composables/useIsMobile';
import { adminNavSource, type AdminNavItem } from '@/data/adminNav';

const auth = useAuthStore();
const router = useRouter();
const isMobile = useIsMobile();
const { isDark, toggleTheme } = useTheme();

async function onLogout(): Promise<void> {
  await auth.logout();
  router.push({ name: 'login' });
}

/** Item yang lolos capability, dengan grupnya, untuk dipakai ulang. */
const visibleGroups = computed(() =>
  adminNavSource
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.capability || auth.can(i.capability)) }))
    .filter((g) => g.items.length),
);

/** Menu sidebar desktop (dengan grup Akun/Keluar disisipkan). */
const navGroups = computed(() => {
  const groups = visibleGroups.value.map((g) => ({ ...g, items: [...g.items] }));
  groups.push({ label: 'Akun', items: [{ label: 'Keluar', icon: LogOut, onClick: onLogout }] });
  return groups;
});

const user = computed(() =>
  auth.me
    ? {
        name: auth.me.display_name || auth.me.email,
        email: auth.me.email,
        avatar: auth.me.avatar_url ? resolveMediaUrl(auth.me.avatar_url) : undefined,
      }
    : null,
);

/** Menu dropdown user di topbar (driven by capability). */
const userMenuItems = computed(() => {
  const items: Array<{ key: string; label: string; icon?: unknown; danger?: boolean }> = [
    { key: 'profile', label: 'Profil Saya', icon: UserCircle },
  ];
  if (auth.can('manage_settings')) {
    items.push({ key: 'settings', label: 'Pengaturan', icon: Settings });
  }
  items.push({ key: 'logout', label: 'Keluar', icon: LogOut, danger: true });
  return items;
});

function onMenuAction(key: string): void {
  if (key === 'profile') router.push({ name: 'admin-profile' });
  else if (key === 'settings') router.push({ name: 'admin-settings' });
  else if (key === 'logout') void onLogout();
}

// ── Bottom-nav (mobile) ───────────────────────────────────────────
/** 4 tujuan utama terfilter: item ber-`primary` yang lolos capability (maks 4). */
const allVisibleItems = computed<AdminNavItem[]>(() => visibleGroups.value.flatMap((g) => g.items));

const primaryItems = computed(() =>
  allVisibleItems.value
    .filter((i) => i.primary && i.href)
    .slice(0, 4)
    .map((i) => ({ label: i.label, icon: i.icon, href: i.href as string })),
);

/** Sisa menu (non-primary atau primary yang tak muat) → masuk sheet "Menu". */
const sheetGroups = computed(() => {
  const primaryHrefs = new Set(primaryItems.value.map((i) => i.href));
  return visibleGroups.value
    .map((g) => ({
      label: g.label,
      color: g.color,
      items: g.items.filter((i) => !i.href || !primaryHrefs.has(i.href)),
    }))
    .filter((g) => g.items.length);
});

const sheetOpen = ref(false);
</script>

<template>
  <BaseLayout
    :nav-groups="navGroups"
    :user="user"
    :user-menu-items="userMenuItems"
    :hide-mobile-nav="isMobile"
    app-name="CMS Admin"
    app-subtitle="Panel Redaksi"
    @menu-action="onMenuAction"
  >
    <div class="admin-content" :class="{ 'admin-content--mobile': isMobile }">
      <RouterView />
    </div>

    <!-- ── Mobile-only: bottom-nav + sheet + action bar ── -->
    <template v-if="isMobile">
      <AppActionBar />
      <AppBottomNav
        :items="primaryItems"
        :is-dark="isDark"
        :menu-open="sheetOpen"
        @open-menu="sheetOpen = true"
      />
      <AppNavSheet
        v-model:open="sheetOpen"
        :groups="sheetGroups"
        :user="user"
        :is-dark="isDark"
        @toggle-theme="toggleTheme"
        @logout="onLogout"
      />
    </template>
  </BaseLayout>
</template>

<style scoped>
.admin-content {
  padding: 24px;
}
/* Mobile: beri ruang bawah utk bottom-nav (+ safe-area). Action bar bila aktif
   menambah ruangnya sendiri lewat scroll; tombol terakhir tetap terlihat. */
.admin-content--mobile {
  padding: 16px 14px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}
</style>
