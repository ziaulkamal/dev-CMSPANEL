<!--
  PublicPopups.vue — render satu popup aktif untuk pengunjung publik.
  Hormati display: delay_seconds (tunda tampil), auto_close_seconds (tutup otomatis),
  frequency (always | session | days) via localStorage. Gagal diam bila /popups
  belum live. Hanya popup scope 'root'/'all_public' yang ditampilkan.
-->
<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { popupService, type Popup } from '@/services/popup.service';
import { resolveMediaUrl } from '@/lib/media';
import { USE_MOCK } from '@/features/public/data/homeSource';
import AppModal from '@/components/app/AppModal.vue';

const STORAGE_PREFIX = 'cms.popup.seen.';

// Mock belum menyertakan popup → matikan query agar tak ada panggilan sia-sia.
const { data } = useQuery({
  queryKey: ['public-popups'],
  queryFn: () => popupService.list(),
  retry: false,
  staleTime: 5 * 60_000,
  enabled: !USE_MOCK,
});

/** Popup pertama yang aktif, ber-scope publik, dan belum lewat frekuensinya. */
const active = computed<Popup | null>(() => {
  const list = (data.value ?? [])
    .filter((p) => p.active)
    .filter((p) => {
      const scope = p.display?.scope ?? 'all_public';
      return scope === 'root' || scope === 'all_public';
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return list.find((p) => !suppressed(p)) ?? null;
});

/** Apakah popup harus disembunyikan berdasarkan frequency tersimpan. */
function suppressed(p: Popup): boolean {
  const freq = p.display?.frequency ?? 'session';
  if (freq === 'always') return false;
  try {
    if (freq === 'session') return sessionStorage.getItem(STORAGE_PREFIX + p.id) === '1';
    // 'days'
    const raw = localStorage.getItem(STORAGE_PREFIX + p.id);
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

/** Tandai popup sudah dilihat sesuai frequency. */
function markSeen(p: Popup): void {
  const freq = p.display?.frequency ?? 'session';
  try {
    if (freq === 'session') sessionStorage.setItem(STORAGE_PREFIX + p.id, '1');
    else if (freq === 'days') {
      const days = p.display?.frequency_days ?? 1;
      localStorage.setItem(STORAGE_PREFIX + p.id, String(Date.now() + days * 86_400_000));
    }
  } catch {
    /* storage tak tersedia → abaikan */
  }
}

const open = ref(false);
let showTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

function clearTimers(): void {
  if (showTimer) clearTimeout(showTimer);
  if (closeTimer) clearTimeout(closeTimer);
}

function close(): void {
  open.value = false;
  if (active.value) markSeen(active.value);
  clearTimers();
}

// Jadwalkan tampil saat popup aktif tersedia.
watch(
  active,
  (p) => {
    clearTimers();
    open.value = false;
    if (!p) return;
    const delay = (p.display?.delay_seconds ?? 0) * 1000;
    showTimer = setTimeout(() => {
      open.value = true;
      const autoClose = (p.display?.auto_close_seconds ?? 0) * 1000;
      if (autoClose > 0) closeTimer = setTimeout(close, autoClose);
    }, delay);
  },
  { immediate: true },
);

onBeforeUnmount(clearTimers);

const imageSrc = computed(() => {
  const c = active.value?.content ?? {};
  return resolveMediaUrl((c.image_url as string) ?? (c.image_media_id as string) ?? '');
});
</script>

<template>
  <AppModal v-if="active" v-model="open" :title="active.name" size="md" @update:model-value="(v: boolean) => !v && close()">
    <a
      v-if="active.kind === 'image'"
      :href="(active.content.target_url as string) || '#'"
      target="_blank"
      rel="noopener"
    >
      <img :src="imageSrc" :alt="(active.content.alt as string) || active.name" class="w-full" />
    </a>
    <div v-else v-html="active.content.html as string"></div>
  </AppModal>
</template>
