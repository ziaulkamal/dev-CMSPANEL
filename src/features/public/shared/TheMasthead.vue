<!--
  TheMasthead.vue — kepala portal: logo + nav primer (dropdown untuk item ber-anak)
  + LIVE pulsing + ikon cari + tombol "Sign up". Sumber nav: mock (USE_MOCK) atau
  menuService. Responsif: < md → hamburger membuka AppDrawer dengan grup.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink } from 'vue-router';
import { Search, ChevronDown, Moon, Sun } from '@lucide/vue';
import { menuService, type MenuItem } from '@/services/menu.service';
import { USE_MOCK, getHomeMock } from '@/features/public/data/homeSource';
import { useSearchOverlay } from '@/features/public/search/useSearchOverlay';
import { usePublicColorScheme } from '@/composables/usePublicColorScheme';
import { useSiteConfig } from '@/features/public/data/useSiteConfig';

const search = useSearchOverlay();
const { isDark, toggle: toggleTheme } = usePublicColorScheme();
const { identity } = useSiteConfig();

/** Nav default bila backend belum punya /menus dan mock mati. */
const FALLBACK_NAV: MenuItem[] = [
  { id: 'news', label: 'Berita', url: '/', source: 'custom', children: [] },
  { id: 'aceh', label: 'Aceh', url: '/', source: 'custom', children: [] },
  { id: 'opinion', label: 'Opini', url: '/', source: 'custom', children: [] },
  { id: 'video', label: 'Video', url: '/', source: 'custom', children: [] },
];

const { data } = useQuery({
  queryKey: ['public-menu', 'top'],
  queryFn: () => menuService.get('top'),
  retry: false,
  staleTime: 5 * 60_000,
  enabled: !USE_MOCK,
});

const nav = computed<MenuItem[]>(() => {
  if (USE_MOCK) return getHomeMock().nav;
  return data.value ?? FALLBACK_NAV;
});
</script>

<template>
  <header :style="{ backgroundColor: 'var(--color-pub-paper)', borderBottom: '1px solid var(--color-pub-line)' }">
    <div class="mx-auto flex h-16 max-w-[1140px] items-center justify-between gap-4 px-4 lg:px-6">
      <!-- Logo — mobile: tengah & sedikit lebih besar; desktop: kiri normal -->
      <RouterLink
        :to="{ name: 'home' }"
        class="mx-auto flex flex-none items-center gap-2.5 md:mx-0"
      >
        <img
          v-if="identity.logoUrl"
          :src="identity.logoUrl"
          :alt="identity.name"
          class="h-9 w-auto max-w-[180px] object-contain md:h-8"
        />
        <template v-else>
          <span
            class="flex h-9 w-9 items-center justify-center md:h-8 md:w-8"
            :style="{ backgroundColor: 'var(--color-pub-crimson)' }"
          >
            <span class="h-4 w-4 rounded-full border-[3px] border-white md:h-3.5 md:w-3.5"></span>
          </span>
          <span class="text-base font-extrabold tracking-[0.14em] md:text-sm" :style="{ color: 'var(--color-pub-ink)' }">
            {{ identity.name }}
          </span>
        </template>
      </RouterLink>

      <!-- Nav primer (desktop) dengan dropdown hover -->
      <nav class="hidden flex-1 items-center gap-1 md:flex">
        <div
          v-for="item in nav"
          :key="item.id"
          class="group relative"
        >
          <a
            :href="item.url || '/'"
            class="flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors hover:opacity-70"
            :style="{ color: 'var(--color-pub-ink)' }"
          >
            {{ item.label }}
            <ChevronDown v-if="item.children?.length" :size="14" class="opacity-60" />
          </a>
          <!-- Dropdown -->
          <div
            v-if="item.children?.length"
            class="invisible absolute left-0 top-full z-30 min-w-[200px] -translate-y-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
            :style="{ backgroundColor: 'var(--color-pub-paper)', border: '1px solid var(--color-pub-line)' }"
          >
            <a
              v-for="child in item.children"
              :key="child.id"
              :href="child.url || '/'"
              class="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5"
              :style="{ color: 'var(--color-pub-ink)' }"
            >{{ child.label }}</a>
          </div>
        </div>
      </nav>

      <!-- Aksi kanan -->
      <div class="flex flex-none items-center gap-3">
        <span class="hidden items-center gap-1.5 sm:flex">
          <span class="pub-live-dot" aria-hidden="true"></span>
          <span class="text-xs font-extrabold tracking-wide" :style="{ color: 'var(--color-pub-crimson)' }">LIVE</span>
        </span>
        <button type="button" class="hidden p-1.5 md:inline-flex" aria-label="Cari" @click="search.open()">
          <Search :size="18" :style="{ color: 'var(--color-pub-ink)' }" />
        </button>
        <button
          type="button"
          class="hidden p-1.5 sm:inline-flex"
          :aria-label="isDark ? 'Mode terang' : 'Mode gelap'"
          @click="toggleTheme()"
        >
          <Moon v-if="!isDark" :size="18" :style="{ color: 'var(--color-pub-ink)' }" />
          <Sun v-else :size="18" :style="{ color: 'var(--color-pub-ink)' }" />
        </button>
        <RouterLink
          :to="{ name: 'login' }"
          class="hidden rounded-full px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 sm:inline-block"
          :style="{ backgroundColor: 'var(--color-pub-ink)' }"
        >Daftar</RouterLink>
      </div>
    </div>

  </header>
</template>
