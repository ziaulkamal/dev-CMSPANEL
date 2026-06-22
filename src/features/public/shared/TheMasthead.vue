<!--
  TheMasthead.vue — kepala portal: logo + nav primer (dropdown untuk item ber-anak)
  + LIVE pulsing + ikon cari + tombol "Sign up". Sumber nav: mock (USE_MOCK) atau
  menuService. Responsif: < md → hamburger membuka AppDrawer dengan grup.
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink } from 'vue-router';
import { Search, Menu, ChevronDown } from '@lucide/vue';
import { menuService, type MenuItem } from '@/services/menu.service';
import { USE_MOCK, getHomeMock } from '@/features/public/data/homeSource';
import AppDrawer from '@/components/app/AppDrawer.vue';

/** Nav default bila backend belum punya /menus dan mock mati. */
const FALLBACK_NAV: MenuItem[] = [
  { id: 'news', label: 'News', url: '/', source: 'custom', children: [] },
  { id: 'world', label: 'World', url: '/', source: 'custom', children: [] },
  { id: 'opinion', label: 'Opinion', url: '/', source: 'custom', children: [] },
  { id: 'video', label: 'Video', url: '/', source: 'custom', children: [] },
];

const { data } = useQuery({
  queryKey: ['public-menu'],
  queryFn: () => menuService.get(),
  retry: false,
  staleTime: 5 * 60_000,
  enabled: !USE_MOCK,
});

const nav = computed<MenuItem[]>(() => {
  if (USE_MOCK) return getHomeMock().nav;
  return data.value ?? FALLBACK_NAV;
});

const mobileOpen = ref(false);
</script>

<template>
  <header :style="{ backgroundColor: 'var(--color-pub-paper)', borderBottom: '1px solid var(--color-pub-line)' }">
    <div class="mx-auto flex h-16 max-w-[1300px] items-center justify-between gap-4 px-4 lg:px-6">
      <!-- Logo -->
      <RouterLink :to="{ name: 'home' }" class="flex flex-none items-center gap-2.5">
        <span class="flex h-8 w-8 items-center justify-center" :style="{ backgroundColor: 'var(--color-pub-crimson)' }">
          <span class="h-3.5 w-3.5 rounded-full border-[3px] border-white"></span>
        </span>
        <span class="text-sm font-extrabold tracking-[0.14em]" :style="{ color: 'var(--color-pub-ink)' }">
          NEWS<span :style="{ color: 'var(--color-pub-crimson)' }">ROOM</span>
        </span>
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
        <button type="button" class="p-1.5" aria-label="Cari">
          <Search :size="18" :style="{ color: 'var(--color-pub-ink)' }" />
        </button>
        <RouterLink
          :to="{ name: 'login' }"
          class="hidden rounded-full px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 sm:inline-block"
          :style="{ backgroundColor: 'var(--color-pub-ink)' }"
        >Sign up</RouterLink>
        <button type="button" class="p-1.5 md:hidden" aria-label="Menu" @click="mobileOpen = true">
          <Menu :size="20" :style="{ color: 'var(--color-pub-ink)' }" />
        </button>
      </div>
    </div>

    <!-- Drawer nav (mobile) dengan grup -->
    <AppDrawer v-model="mobileOpen" side="right" size="sm" title="Menu">
      <nav class="flex flex-col gap-1 p-2">
        <template v-for="item in nav" :key="item.id">
          <a
            :href="item.url || '/'"
            class="rounded px-3 py-2.5 text-sm font-bold hover:bg-black/5"
            :style="{ color: 'var(--color-pub-ink)' }"
            @click="mobileOpen = false"
          >{{ item.label }}</a>
          <a
            v-for="child in (item.children ?? [])"
            :key="child.id"
            :href="child.url || '/'"
            class="rounded px-6 py-2 text-sm font-medium hover:bg-black/5"
            :style="{ color: 'var(--color-pub-muted)' }"
            @click="mobileOpen = false"
          >{{ child.label }}</a>
        </template>
        <RouterLink
          :to="{ name: 'login' }"
          class="mt-2 rounded-full px-4 py-2 text-center text-xs font-bold text-white"
          :style="{ backgroundColor: 'var(--color-pub-ink)' }"
          @click="mobileOpen = false"
        >Sign up</RouterLink>
      </nav>
    </AppDrawer>
  </header>
</template>
