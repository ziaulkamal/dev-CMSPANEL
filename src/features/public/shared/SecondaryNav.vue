<!--
  SecondaryNav.vue — baris menu tambahan di antara Headline News & masthead utama:
  daftar pill topik/kategori yang bisa di-scroll kiri-kanan saat penuh. Tombol
  panah ◀ ▶ (desktop) menggeser halus; mobile mengandalkan scroll native. Sumber:
  secondaryNav dari mock (mode live: menyusul via menuService).
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink } from 'vue-router';
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { menuService, type MenuItem } from '@/services/menu.service';
import { USE_MOCK, getHomeMock } from '@/features/public/data/homeSource';

const { data } = useQuery({
  queryKey: ['public-menu', 'secondary'],
  queryFn: () => menuService.get('secondary'),
  retry: false,
  staleTime: 5 * 60_000,
  enabled: !USE_MOCK,
});

const items = computed<MenuItem[]>(() => {
  if (USE_MOCK) return getHomeMock().secondaryNav ?? [];
  return data.value ?? [];
});

const scroller = ref<HTMLElement | null>(null);
function scrollBy(dir: 1 | -1): void {
  scroller.value?.scrollBy({ left: dir * 260, behavior: 'smooth' });
}
</script>

<template>
  <div
    v-if="items.length"
    class="pub-secnav sticky top-0 z-30"
    :style="{ backgroundColor: 'var(--color-pub-canvas)', borderBottom: '1px solid var(--color-pub-line)' }"
  >
    <div class="mx-auto flex max-w-[1140px] items-center gap-1 px-2 lg:px-4">
      <!-- Panah kiri (desktop) -->
      <button
        type="button"
        class="pub-secnav-arrow hidden md:inline-flex"
        aria-label="Geser kiri"
        @click="scrollBy(-1)"
      >
        <ChevronLeft :size="18" />
      </button>

      <!-- Scroller pill topik -->
      <div
        ref="scroller"
        class="pub-secnav-scroller flex flex-1 items-center gap-1.5 overflow-x-auto py-2"
      >
        <RouterLink
          v-for="it in items"
          :key="it.id"
          :to="it.url || '/'"
          class="pub-secnav-pill"
        >{{ it.label }}</RouterLink>
      </div>

      <!-- Panah kanan (desktop) -->
      <button
        type="button"
        class="pub-secnav-arrow hidden md:inline-flex"
        aria-label="Geser kanan"
        @click="scrollBy(1)"
      >
        <ChevronRight :size="18" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Sticky sub-nav (area menu ke-2) — menempel di atas saat scroll, dengan
   bayangan halus & blur agar terasa seperti app bar mobile. */
.pub-secnav {
  backdrop-filter: saturate(160%) blur(6px);
  box-shadow: 0 2px 10px color-mix(in srgb, var(--color-pub-ink) 7%, transparent);
}

/* Pill topik: kapsul ringkas, hover aksen crimson. */
.pub-secnav-pill {
  flex: none;
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: 9999px;
  font-family: var(--font-pub-sans);
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--color-pub-ink);
  border: 1px solid transparent;
  transition: background-color 180ms var(--ease-default),
              color 180ms var(--ease-default),
              border-color 180ms var(--ease-default);
}
.pub-secnav-pill:hover {
  color: var(--color-pub-crimson);
  background-color: var(--color-pub-paper);
  border-color: color-mix(in srgb, var(--color-pub-crimson) 35%, transparent);
}

/* Tombol panah geser. */
.pub-secnav-arrow {
  flex: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9999px;
  color: var(--color-pub-muted);
  transition: background-color 180ms var(--ease-default), color 180ms var(--ease-default);
}
.pub-secnav-arrow:hover {
  color: var(--color-pub-crimson);
  background-color: var(--color-pub-paper);
}

/* Sembunyikan scrollbar (geser via panah / swipe), tetap dapat di-scroll. */
.pub-secnav-scroller {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.pub-secnav-scroller::-webkit-scrollbar {
  display: none;
}
</style>
