<!--
  src/features/admin/contents/ContentTypeTabs.vue
  Segmented tabs untuk memilih post type aktif di listing konten.
  Pill ber-ikon, scroll-x di layar sempit. Sumber label dari editor.config.
-->
<script setup lang="ts">
import { FileText, File as FileIcon, Film, Images, Radio } from '@lucide/vue';
import { CONTENT_TYPE_OPTIONS } from './editor.config';
import type { ContentType } from '@/types/domain';

defineProps<{ modelValue: ContentType }>();
const emit = defineEmits<{ 'update:modelValue': [value: ContentType] }>();

const ICONS: Record<ContentType, unknown> = {
  post: FileText,
  page: FileIcon,
  video: Film,
  gallery: Images,
  live_report: Radio,
};
</script>

<template>
  <div class="type-tabs" role="tablist" aria-label="Tipe konten">
    <button
      v-for="opt in CONTENT_TYPE_OPTIONS"
      :key="opt.value"
      type="button"
      role="tab"
      class="type-tabs__tab"
      :class="{ 'type-tabs__tab--active': modelValue === opt.value }"
      :aria-selected="modelValue === opt.value"
      @click="emit('update:modelValue', opt.value)"
    >
      <component :is="ICONS[opt.value]" :size="15" />
      <span>{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.type-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
}
.type-tabs::-webkit-scrollbar {
  display: none;
}
.type-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  scroll-snap-align: start;
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: calc(var(--radius-lg) - 3px);
  font-family: var(--font-sans);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-text-muted);
  white-space: nowrap;
  transition:
    color 150ms ease,
    background 150ms ease,
    box-shadow 150ms ease;
}
.type-tabs__tab:hover:not(.type-tabs__tab--active) {
  color: var(--color-text-primary);
}
.type-tabs__tab--active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}
</style>
