<!--
  src/components/app/AppNavSheet.vue
  Bottom-sheet "Menu" (off-canvas dari bawah) untuk tujuan sekunder yang tidak
  muat di bottom-nav. Reuse pola overlay + transform dari AppSidebar.
  Item sudah terfilter capability di layout. Menutup saat pilih item / overlay.
-->
<template>
  <Teleport to="body">
    <!-- Overlay -->
    <Transition name="sheet-overlay">
      <div
        v-if="open"
        class="nav-sheet__overlay"
        @click="$emit('update:open', false)"
      />
    </Transition>

    <!-- Sheet -->
    <Transition name="sheet-panel">
      <div v-if="open" class="nav-sheet" :style="sheetStyle" role="dialog" aria-label="Menu">
        <div class="nav-sheet__grabber" />

        <!-- Header user -->
        <div class="nav-sheet__user">
          <UserAvatar :user="user" size="md" :border-bg="isDark ? '#0d1117' : '#f0f1f8'" />
          <div class="nav-sheet__user-info">
            <p class="nav-sheet__user-name">{{ user?.name ?? 'Admin User' }}</p>
            <p class="nav-sheet__user-email">{{ user?.email ?? '' }}</p>
          </div>
          <button
            type="button"
            class="nav-sheet__theme"
            :aria-label="isDark ? 'Mode terang' : 'Mode gelap'"
            @click="$emit('toggle-theme')"
          >
            <component :is="isDark ? Sun : Moon" :size="18" stroke-width="1.7" />
          </button>
        </div>

        <!-- Grup menu sekunder -->
        <nav class="nav-sheet__nav">
          <template v-for="(group, gi) in groups" :key="gi">
            <p v-if="group.label" class="nav-sheet__group-label" :style="{ color: group.color }">
              {{ group.label }}
            </p>
            <RouterLink
              v-for="item in group.items"
              :key="item.label"
              :to="item.href ?? ''"
              class="nav-sheet__item"
              :class="{ 'nav-sheet__item--active': item.href && isActive(item.href) }"
              @click="onNavigate(item)"
            >
              <component :is="item.icon" :size="19" stroke-width="1.7" class="nav-sheet__item-icon" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </template>

          <!-- Keluar -->
          <button type="button" class="nav-sheet__item nav-sheet__item--danger" @click="onLogout">
            <LogOut :size="19" stroke-width="1.7" class="nav-sheet__item-icon" />
            <span>Keluar</span>
          </button>
        </nav>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { Moon, Sun, LogOut } from '@lucide/vue';
import UserAvatar from './UserAvatar.vue';

interface SheetItem {
  label: string;
  icon?: unknown;
  href?: string;
  onClick?: () => void;
}
interface SheetGroup {
  label?: string;
  color?: string;
  items: SheetItem[];
}
type SheetUser = { name?: string; email?: string; avatar?: string } | null;

const props = defineProps<{
  open: boolean;
  groups: SheetGroup[];
  user?: SheetUser;
  isDark?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'toggle-theme'): void;
  (e: 'logout'): void;
}>();

const route = useRoute();
const currentPath = computed<string>(() => route.fullPath.split('?')[0]);

function isActive(href: string): boolean {
  return currentPath.value === href || currentPath.value.startsWith(href + '/');
}

function close(): void {
  emit('update:open', false);
}

function onNavigate(item: SheetItem): void {
  if (item.onClick) item.onClick();
  close();
}

function onLogout(): void {
  emit('logout');
  close();
}

const sheetStyle = computed(() => ({
  background: props.isDark ? '#0d1117' : '#ffffff',
}));
</script>

<style scoped>
.nav-sheet__overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.nav-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 51;
  max-height: 80vh;
  overflow-y: auto;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 8px 16px calc(16px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.25);
}

.nav-sheet__grabber {
  width: 40px;
  height: 4px;
  border-radius: 99px;
  background: var(--color-border);
  margin: 6px auto 12px;
}

/* Header user */
.nav-sheet__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}
.nav-sheet__user-info {
  flex: 1;
  min-width: 0;
}
.nav-sheet__user-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nav-sheet__user-email {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nav-sheet__theme {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
  cursor: pointer;
}

/* Nav */
.nav-sheet__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-sheet__group-label {
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 12px 8px 4px;
}
.nav-sheet__item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 8px 10px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}
.nav-sheet__item:active {
  background: var(--color-bg-subtle);
}
.nav-sheet__item--active {
  background: color-mix(in srgb, #6366f1 12%, transparent);
  color: #6366f1;
}
.nav-sheet__item-icon {
  flex-shrink: 0;
  color: var(--color-text-muted);
}
.nav-sheet__item--active .nav-sheet__item-icon {
  color: #6366f1;
}
.nav-sheet__item--danger {
  color: #ef4444;
}
.nav-sheet__item--danger .nav-sheet__item-icon {
  color: #ef4444;
}

/* Transitions */
.sheet-overlay-enter-active,
.sheet-overlay-leave-active {
  transition: opacity 220ms ease;
}
.sheet-overlay-enter-from,
.sheet-overlay-leave-to {
  opacity: 0;
}
.sheet-panel-enter-active {
  transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet-panel-leave-active {
  transition: transform 220ms ease-in;
}
.sheet-panel-enter-from,
.sheet-panel-leave-to {
  transform: translateY(100%);
}
</style>
