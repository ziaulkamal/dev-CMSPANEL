<!-- src/components/ui/StatusBadge.vue — badge status editorial (mapping ke AppBadge). -->
<script setup lang="ts">
import { computed } from 'vue';
import AppBadge from '@/components/app/AppBadge.vue';
import type { ContentStatus } from '@/types/domain';

const props = defineProps<{ status: ContentStatus }>();

type BadgeColor = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const meta = computed(() => {
  const map: Record<ContentStatus, { color: BadgeColor; label: string }> = {
    draft: { color: 'default', label: 'Draft' },
    pending_review: { color: 'warning', label: 'Menunggu Review' },
    scheduled: { color: 'info', label: 'Terjadwal' },
    published: { color: 'success', label: 'Terbit' },
    archived: { color: 'default', label: 'Arsip' },
    trashed: { color: 'danger', label: 'Sampah' },
  };
  return map[props.status];
});
</script>

<template>
  <AppBadge :color="meta.color">{{ meta.label }}</AppBadge>
</template>
