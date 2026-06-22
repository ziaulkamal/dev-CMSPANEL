<!--
  BottomNav.vue — navigasi bawah ala aplikasi Android (mobile only, < md).
  5 aksi: Beranda, Kategori (buka drawer kategori), Cari (overlay), Terbaru, Tema.
  Fixed di bawah, di atas konten; PublicLayout memberi padding-bottom agar konten
  tak tertutup.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { Home, Menu, Search, Newspaper, Moon, Sun } from '@lucide/vue';
import { useSearchOverlay } from '@/features/public/search/useSearchOverlay';
import { usePublicColorScheme } from '@/composables/usePublicColorScheme';

const emit = defineEmits<{ (e: 'open-menu'): void }>();

const route = useRoute();
const router = useRouter();
const search = useSearchOverlay();
const { isDark, toggle: toggleTheme } = usePublicColorScheme();

const isHome = computed(() => route.name === 'home');
const isLatest = computed(() => route.name === 'latest');
</script>

<template>
  <nav
    class="pub-bottomnav fixed inset-x-0 bottom-0 z-40 flex items-stretch md:hidden"
    :style="{
      backgroundColor: 'var(--color-pub-paper)',
      borderTop: '1px solid var(--color-pub-line)',
    }"
    aria-label="Navigasi bawah"
  >
    <RouterLink :to="{ name: 'home' }" class="pub-bottomnav__item" :class="{ 'is-active': isHome }">
      <Home :size="20" />
      <span>Beranda</span>
    </RouterLink>

    <button type="button" class="pub-bottomnav__item" @click="emit('open-menu')">
      <Menu :size="20" />
      <span>Menu</span>
    </button>

    <button type="button" class="pub-bottomnav__item" @click="search.open()">
      <Search :size="20" />
      <span>Cari</span>
    </button>

    <button
      type="button"
      class="pub-bottomnav__item"
      :class="{ 'is-active': isLatest }"
      @click="router.push({ name: 'latest' })"
    >
      <Newspaper :size="20" />
      <span>Terbaru</span>
    </button>

    <button type="button" class="pub-bottomnav__item" @click="toggleTheme()">
      <Moon v-if="!isDark" :size="20" />
      <Sun v-else :size="20" />
      <span>Tema</span>
    </button>
  </nav>
</template>

<style scoped>
.pub-bottomnav {
  /* Aman dari notch / home indicator iOS. */
  padding-bottom: env(safe-area-inset-bottom, 0);
  box-shadow: 0 -2px 12px color-mix(in srgb, var(--color-pub-ink) 8%, transparent);
}
.pub-bottomnav__item {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 2px;
  font-family: var(--font-pub-sans);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-pub-muted);
  transition: color 160ms var(--ease-default);
}
.pub-bottomnav__item:hover,
.pub-bottomnav__item.is-active {
  color: var(--color-pub-crimson);
}
</style>
