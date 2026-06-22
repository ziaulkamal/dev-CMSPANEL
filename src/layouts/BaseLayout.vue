<template>
    <!--
        Layout struktur (flex row):
        ┌───────────────┬──────────────────────────────────────┐
        │  Sidebar      │  [Topbar sticky dalam kolom kanan]   │
        │  sticky       ├──────────────────────────────────────┤
        │  full height  │  Page content                        │
        │  (scrollbar)  │                                      │
        └───────────────┴──────────────────────────────────────┘
    -->
    <div :class="{ dark: isDark }" class="layout-root">

        <!-- ── Sidebar: kolom kiri, sticky full height ──
             Disembunyikan saat admin-mobile (navigasi via bottom-nav). -->
        <AppSidebar
            v-if="!hideSidebar"
            v-model:collapsed="sidebarCollapsed"
            v-model:mobile-open="sidebarMobileOpen"
            :nav-groups="resolvedNavGroups"
            :user="user"
            :is-mobile="isMobile"
            :is-dark="isDark"
            :app-name="appName"
            :app-subtitle="appSubtitle"
            @update:collapsed="onCollapsedChange"
        />

        <!-- ── Kolom kanan: topbar + konten ── -->
        <div class="layout-right">
            <AppTopbar
                :sidebar-collapsed="sidebarCollapsed"
                :is-dark="isDark"
                :user="user"
                :notification-count="notificationCount"
                :is-mobile="isMobile"
                :hide-toggle="hideSidebar"
                :user-menu-items="userMenuItems"
                @toggle-sidebar="toggleSidebar"
                @toggle-theme="toggleTheme"
                @open-notifications="$emit('open-notifications')"
                @menu-action="$emit('menu-action', $event)"
            />

            <main class="layout-main">
                <slot />
            </main>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useTheme } from '@/composables/useTheme';
import AppSidebar from '@/components/app/AppSidebar.vue';
import AppTopbar  from '@/components/app/AppTopbar.vue';
import { BREAKPOINT_MOBILE, BREAKPOINT_TABLET } from '@/config/layout';
import {
    LayoutDashboard, Users, Kanban, Mail, MessageSquare,
    Settings, BarChart3, Package, ShoppingCart, FileText, BookOpen,
} from '@lucide/vue';

interface NavItem {
    label: string;
    icon?: unknown;
    href?: string;
    badge?: string | number;
    badgeColor?: string;
    subtitle?: string;
    active?: boolean;
    onClick?: () => void;
    children?: NavItem[];
}

interface NavGroup {
    label?: string;
    subtitle?: string;
    color?: string;
    items: NavItem[];
}

type LayoutUser = { name?: string; email?: string; avatar?: string } | null;
type UserMenuItem = { key: string; label: string; icon?: unknown; danger?: boolean };
// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
    navGroups:         { type: Array as () => NavGroup[] | null, default: null },
    user:              { type: Object as () => LayoutUser,       default: null },
    appName:           { type: String, default: 'E-Gov CRM' },
    appSubtitle:       { type: String, default: 'Laravel + Tailwinds + Vue' },
    notificationCount: { type: Number, default: 0 },
    /** Item menu dropdown user di topbar (driven by parent). */
    userMenuItems:     { type: Array as () => UserMenuItem[], default: () => [] },
    /** Saat true (mode mobile admin): sembunyikan sidebar drawer + toggle; navigasi via bottom-nav. */
    hideMobileNav:     { type: Boolean, default: false },
});

defineEmits(['open-search', 'open-notifications', 'menu-action']);

// ── Theme ──────────────────────────────────────────────────────
const { isDark, toggleTheme } = useTheme();

// ── Responsive breakpoints ─────────────────────────────────────
// Nilai breakpoint diambil dari @/config/layout — edit di sana untuk mengubah
const windowWidth       = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1280);
const isMobile          = computed<boolean>(() => windowWidth.value < BREAKPOINT_MOBILE);
const isTablet          = computed<boolean>(() => windowWidth.value >= BREAKPOINT_MOBILE && windowWidth.value < BREAKPOINT_TABLET);

// Sidebar state — persisted to localStorage
const SIDEBAR_KEY = 'crm_sidebar_collapsed';

function readSidebarCollapsed(): boolean {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem(SIDEBAR_KEY) === 'true'; } catch { return false; }
}

const sidebarCollapsed  = ref<boolean>(readSidebarCollapsed());
const sidebarMobileOpen = ref<boolean>(false);

watch(sidebarCollapsed, (val) => {
    try { localStorage.setItem(SIDEBAR_KEY, String(val)); } catch { /* ignore */ }
});

// Auto-collapse on tablet (but don't override user preference on desktop)
watch(isTablet, (tablet) => { if (tablet) sidebarCollapsed.value = true; }, { immediate: true });
watch(isMobile, (mobile) => { if (mobile) { sidebarMobileOpen.value = false; } });

// Sidebar disembunyikan saat admin-mobile memakai bottom-nav.
const hideSidebar = computed<boolean>(() => props.hideMobileNav && isMobile.value);

function toggleSidebar(): void {
    if (isMobile.value) {
        sidebarMobileOpen.value = !sidebarMobileOpen.value;
    } else {
        sidebarCollapsed.value = !sidebarCollapsed.value;
    }
}

function onCollapsedChange(val: boolean): void {
    sidebarCollapsed.value = val;
}


function handleResize(): void {
    windowWidth.value = window.innerWidth;
}

onMounted(() => window.addEventListener('resize', handleResize));
onUnmounted(() => window.removeEventListener('resize', handleResize));

// ── Nav ────────────────────────────────────────────────────────
const resolvedNavGroups = computed<NavGroup[]>(() => props.navGroups ?? defaultNavGroups);

const defaultNavGroups: NavGroup[] = [
    {
        label: '',
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, href: '/', active: false },
            { label: 'Reports',   icon: BarChart3,       href: '/reports', active: false },
        ],
    },
    {
        label: 'Applications',
        subtitle: 'Custom made application designs',
        color: '#6366f1',
        items: [
            {
                label: 'Contacts',
                icon: Users,
                href: '/contacts',
                active: false,
            },
            {
                label: 'Kanban',
                icon: Kanban,
                href: '/kanban',
                active: false,
                badge: 'NEW',
                badgeColor: '#6366f1',
            },
            {
                // Dropdown example
                label: 'E-Commerce',
                icon: ShoppingCart,
                children: [
                    { label: 'Products', icon: Package, href: '/products', active: false },
                    { label: 'Orders',   icon: Kanban,  href: '/orders',   active: false },
                ],
            },
            {
                // Multi-dropdown example
                label: 'Pages',
                icon: FileText,
                children: [
                    {
                        label: 'Blog',
                        icon: BookOpen,
                        children: [
                            { label: 'All Posts', href: '/blog',        active: false },
                            { label: 'Create',    href: '/blog/create', active: false },
                        ],
                    },
                    { label: 'Landing', icon: FileText, href: '/landing', active: false },
                ],
            },
            {
                label: 'Inbox',
                icon: Mail,
                href: '/mail',
                active: false,
                badge: '3',
                badgeColor: '#ef4444',
            },
            {
                label: 'Chat',
                icon: MessageSquare,
                href: '/chat',
                active: false,
                subtitle: '3 unread messages',
            },
        ],
    },
    {
        label: 'System',
        color: '#64748b',
        items: [
            { label: 'Settings', icon: Settings, href: '/settings', active: false },
        ],
    },
];
</script>

<style scoped>
/* Root: flex ROW — sidebar kiri, konten kanan */
.layout-root {
    display: flex;
    min-height: 100vh;
    background-color: var(--color-bg);
    /* Tinggi bottom-nav mobile (konten 56px); dibaca AppActionBar utk posisinya. */
    --bottom-nav-h: 56px;
}

/* Kolom kanan: topbar sticky + page content */
.layout-right {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: var(--color-bg);
}

/* Page content: fills remaining height */
.layout-main {
    flex: 1;
}
</style>
