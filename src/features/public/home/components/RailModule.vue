<!--
  RailModule.vue — modul rail kanan: kepala seksi diawali tick AMBER 4px + label
  kapital. Isi diserahkan ke slot agar fleksibel (story, opini, atau video).
-->
<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<template>
  <section>
    <div class="mb-3 flex items-center gap-2">
      <span class="block" :style="{ width: '4px', height: '16px', backgroundColor: 'var(--color-pub-amber)' }"></span>
      <h3 class="text-xs font-bold uppercase tracking-[0.08em]" :style="{ color: 'var(--color-pub-muted)' }">
        {{ label }}
      </h3>
    </div>
    <div class="flex flex-col">
      <slot />
    </div>
  </section>
</template>
