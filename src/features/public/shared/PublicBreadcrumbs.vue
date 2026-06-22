<!--
  PublicBreadcrumbs.vue — band breadcrumb full-width, TERPISAH dari kartu konten.
  Dirender PublicLayout di atas <main> bila ada trail (lihat useBreadcrumbs).
  Desain elegan: tipografi halus, pemisah chevron, item aktif tegas.
-->
<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { ChevronRight } from '@lucide/vue';
import { useBreadcrumbs } from './useBreadcrumbs';

const { trail } = useBreadcrumbs();
</script>

<template>
  <nav
    v-if="trail.length"
    class="pub-bc-band"
    aria-label="Breadcrumb"
  >
    <ol class="mx-auto flex max-w-[1140px] items-center gap-1.5 px-4 py-2.5 lg:px-8">
      <template v-for="(c, i) in trail" :key="i">
        <li class="flex min-w-0 items-center">
          <RouterLink v-if="c.to" :to="c.to" class="pub-bc-link">{{ c.label }}</RouterLink>
          <span v-else class="pub-bc-current truncate">{{ c.label }}</span>
        </li>
        <ChevronRight
          v-if="i < trail.length - 1"
          :size="13"
          class="flex-none"
          :style="{ color: 'var(--color-pub-muted)' }"
          aria-hidden="true"
        />
      </template>
    </ol>
  </nav>
</template>

<style scoped>
.pub-bc-band {
  background: var(--color-pub-canvas);
}
.pub-bc-link {
  font-family: var(--font-pub-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--color-pub-muted);
  transition: color 140ms var(--ease-default);
}
.pub-bc-link:hover {
  color: var(--color-pub-crimson);
}
.pub-bc-current {
  display: block;
  max-width: 60vw;
  font-family: var(--font-pub-sans);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-pub-ink);
}
</style>
