<!--
  RouteProgress.vue — loading bar tipis di paling atas viewport saat navigasi
  rute (menutupi jeda unduh chunk lazy-loaded per menu). Digerakkan oleh
  useRouteProgress (start di beforeEach, done di afterEach/onError).
-->
<script setup lang="ts">
import { useRouteProgress } from '@/composables/useRouteProgress';

const { active, progress } = useRouteProgress();
</script>

<template>
  <div class="route-progress" :class="{ 'route-progress--active': active }" aria-hidden="true">
    <div
      class="route-progress__bar"
      :style="{ width: `${progress}%`, opacity: active ? 1 : 0 }"
    />
  </div>
</template>

<style scoped>
.route-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 9999;
  pointer-events: none;
}

.route-progress__bar {
  height: 100%;
  width: 0;
  background: var(--color-primary);
  box-shadow: 0 0 8px var(--color-primary);
  /* Lebar animasi halus; opacity fade saat selesai. */
  transition:
    width 200ms ease,
    opacity 260ms ease;
}
</style>
