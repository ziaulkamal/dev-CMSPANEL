<!--
  TheFooter.vue — footer ink multi-kolom: brand + kolom tautan + menu lokasi footer
  + baris sosial + copyright. Identitas & footer dari useSiteConfig (mock / settings).
  Menu lokasi 'footer' (MenuBuilder) ditambahkan sebagai kolom ekstra. Token publik.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { Globe } from '@lucide/vue';
import { useSiteConfig } from '@/features/public/data/useSiteConfig';
import { menuService, type MenuItem } from '@/services/menu.service';
import { USE_MOCK } from '@/features/public/data/homeSource';

const { identity, footer } = useSiteConfig();

// Kolom ekstra dari menu lokasi 'footer' (bila admin mengisinya).
const { data: footerMenu } = useQuery({
  queryKey: ['public-menu', 'footer'],
  queryFn: () => menuService.get('footer'),
  retry: false,
  staleTime: 5 * 60_000,
  enabled: !USE_MOCK,
});

/** Kolom tautan gabungan: kolom footer config + (opsional) kolom "Menu" dari menu footer. */
const columns = computed(() => {
  const cols = [...(footer.value.columns ?? [])];
  const menu = (footerMenu.value ?? []) as MenuItem[];
  if (menu.length) {
    cols.push({ title: 'Menu', links: menu.map((m) => ({ label: m.label, url: m.url || '/' })) });
  }
  return cols;
});
</script>

<template>
  <!-- Footer selalu band gelap (ink tetap), tak ikut flip saat dark mode. -->
  <footer :style="{ backgroundColor: 'var(--color-pub-footer, #15130f)' }">
    <div class="mx-auto max-w-[1140px] px-4 py-12 lg:px-6">
      <!-- Brand + kolom tautan -->
      <div class="grid grid-cols-2 gap-8 md:grid-cols-5">
        <div class="col-span-2 md:col-span-1">
          <div class="flex items-center gap-2.5">
            <img
              v-if="identity.logoUrl"
              :src="identity.logoUrl"
              :alt="identity.name"
              class="h-8 w-auto max-w-[160px] object-contain"
            />
            <template v-else>
              <span class="flex h-8 w-8 items-center justify-center" :style="{ backgroundColor: 'var(--color-pub-crimson)' }">
                <span class="h-3.5 w-3.5 rounded-full border-[3px] border-white"></span>
              </span>
              <span class="text-sm font-extrabold tracking-[0.14em] text-white">{{ identity.name }}</span>
            </template>
          </div>
          <p class="mt-3 text-xs leading-relaxed" :style="{ color: '#8a857c' }">
            {{ identity.footerDesc }}
          </p>
        </div>

        <div v-for="col in columns" :key="col.title">
          <h3 class="mb-3 text-xs font-bold uppercase tracking-[0.1em]" :style="{ color: '#8a857c' }">
            {{ col.title }}
          </h3>
          <ul class="flex flex-col gap-2">
            <li v-for="link in col.links" :key="link.label">
              <a :href="link.url" class="text-sm text-white/85 transition-colors hover:text-white">{{ link.label }}</a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Garis pemisah -->
      <div class="my-8 h-px w-full" :style="{ backgroundColor: 'rgba(255,255,255,0.12)' }"></div>

      <!-- Sosial + copyright -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <span class="text-[11px] tracking-[0.1em]" :style="{ fontFamily: 'var(--font-pub-mono)', color: '#8a857c' }">
          {{ footer.copyright }}
        </span>
        <div class="flex items-center gap-2">
          <a
            v-for="s in footer.social"
            :key="s.platform"
            :href="s.url"
            :aria-label="s.platform"
            class="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            :style="{ border: '1px solid rgba(255,255,255,0.18)' }"
          >
            <Globe :size="15" class="text-white/80" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
