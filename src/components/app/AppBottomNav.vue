<!--
  src/components/app/AppBottomNav.vue
  Bottom navigation bar bergaya aplikasi Android (mobile-only).
  4 tujuan utama (terfilter capability di layout) + tombol "Menu" yang
  membuka bottom-sheet (AppNavSheet). Active state berbasis route.
-->
<template>
  <nav class="bottom-nav" :style="navStyle" aria-label="Navigasi utama">
    <RouterLink
      v-for="item in items"
      :key="item.href"
      :to="item.href"
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active': isActive(item.href) }"
    >
      <component :is="item.icon" :size="22" stroke-width="1.8" class="bottom-nav__icon" />
      <span class="bottom-nav__label">{{ item.label }}</span>
    </RouterLink>

    <!-- Tombol Menu → buka sheet -->
    <button
      type="button"
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active': menuOpen }"
      aria-label="Menu lainnya"
      @click="$emit('open-menu')"
    >
      <Menu :size="22" stroke-width="1.8" class="bottom-nav__icon" />
      <span class="bottom-nav__label">Menu</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { Menu } from '@lucide/vue';

interface BottomNavItem {
  label: string;
  icon: unknown;
  href: string;
}

const props = defineProps<{
  items: BottomNavItem[];
  isDark?: boolean;
  menuOpen?: boolean;
}>();

defineEmits<{ (e: 'open-menu'): void }>();

const route = useRoute();
const currentPath = computed<string>(() => route.fullPath.split('?')[0]);

// Active bila path persis sama atau merupakan child route (mis. /admin/contents/new).
function isActive(href: string): boolean {
  return (
    currentPath.value === href ||
    (href !== '/admin' && currentPath.value.startsWith(href + '/')) ||
    (href !== '/admin' && currentPath.value.startsWith(href))
  );
}

const navStyle = computed(() => ({
  background: props.isDark ? '#0d1117' : '#f0f1f8',
  borderColor: props.isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)',
}));
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  align-items: stretch;
  border-top: 1px solid;
  /* tinggi konten + safe-area gesture bar Android/iOS */
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.08);
}

.bottom-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 56px;
  padding: 6px 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-muted);
  text-decoration: none;
  font-family: var(--font-sans);
  transition: color 130ms ease;
  -webkit-tap-highlight-color: transparent;
}
.bottom-nav__item:active {
  background: color-mix(in srgb, #6366f1 8%, transparent);
}
.bottom-nav__item--active {
  color: #6366f1;
}
.bottom-nav__icon {
  flex-shrink: 0;
}
.bottom-nav__label {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1;
  white-space: nowrap;
}
</style>
