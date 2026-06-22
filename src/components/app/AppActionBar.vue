<!--
  src/components/app/AppActionBar.vue
  Action bar bawah kontekstual (mobile-only). Tiap halaman admin menyuntik
  tombol aksinya ke target #admin-action-bar via <Teleport>. Bar ini duduk
  tepat DI ATAS bottom-nav. Tombol di dalamnya dibuat full-width (flex-1).

  Dipakai sekali di AdminLayout; isi-nya berasal dari Teleport tiap view.
-->
<template>
  <div class="action-bar" :class="{ 'action-bar--empty': empty }">
    <!-- Target teleport: view admin meng-inject tombol ke sini -->
    <div id="admin-action-bar" ref="slotRef" class="action-bar__inner" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

// Bar menyembunyikan dirinya saat tak ada aksi yang di-teleport (empty).
// Diamati via MutationObserver pada container target.
const slotRef = ref<HTMLElement | null>(null);
const empty = ref(true);

let observer: MutationObserver | null = null;

function sync(): void {
  empty.value = (slotRef.value?.childElementCount ?? 0) === 0;
}

onMounted(() => {
  sync();
  if (slotRef.value) {
    observer = new MutationObserver(sync);
    observer.observe(slotRef.value, { childList: true });
  }
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<style scoped>
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  /* duduk tepat di atas bottom-nav (var disetel di layout) */
  bottom: var(--bottom-nav-h, 64px);
  z-index: 35;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
}
.action-bar--empty {
  display: none;
}
.action-bar__inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
}
/* Tombol di dalam action bar → full-width, tinggi sentuh ≥ 44px */
.action-bar__inner :deep(.app-btn) {
  flex: 1;
  min-height: 44px;
}
</style>
