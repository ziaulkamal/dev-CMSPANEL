<!--
  AdSlotRenderer.vue — render AdSlot aktif untuk satu `position`. Ambil daftar ad
  dari adsService (admin), saring active + position, urut sort_order. Mendukung
  kind: image | javascript | adsense. Gagal diam bila endpoint /ads belum live.

  Catatan keamanan: kind 'javascript' menyuntik markup dari admin tepercaya
  (manage_settings). Kami render via v-html secara sadar — bukan input publik.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { adsService, type AdSlot, type AdPosition } from '@/services/ads.service';
import { resolveMediaUrl } from '@/lib/media';

const props = defineProps<{ position: AdPosition }>();

const { data } = useQuery({
  queryKey: ['public-ads'],
  queryFn: () => adsService.list(),
  retry: false,
  staleTime: 5 * 60_000,
});

const slots = computed<AdSlot[]>(() =>
  (data.value ?? [])
    .filter((a) => a.active && a.position === props.position)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
);

function imageSrc(cfg: Record<string, unknown>): string {
  // Backend boleh kirim image_url langsung; jika hanya id, biarkan kosong (perlu resolve BE).
  return resolveMediaUrl((cfg.image_url as string) ?? (cfg.image_media_id as string) ?? '');
}
</script>

<template>
  <div v-if="slots.length" class="flex flex-col gap-4">
    <template v-for="ad in slots" :key="ad.id">
      <!-- Image -->
      <a
        v-if="ad.kind === 'image'"
        :href="(ad.config.target_url as string) || '#'"
        target="_blank"
        rel="noopener sponsored"
        class="block overflow-hidden"
      >
        <img
          :src="imageSrc(ad.config)"
          :alt="(ad.config.alt as string) || ad.name"
          class="w-full"
          loading="lazy"
        />
      </a>

      <!-- AdSense -->
      <ins
        v-else-if="ad.kind === 'adsense'"
        class="adsbygoogle block"
        :data-ad-client="ad.config.client_id"
        :data-ad-slot="ad.config.slot_id"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>

      <!-- JavaScript / HTML snippet (admin tepercaya) -->
      <div v-else-if="ad.kind === 'javascript'" v-html="ad.config.script as string"></div>
    </template>
  </div>
</template>
