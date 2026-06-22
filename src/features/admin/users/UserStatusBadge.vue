<!-- src/features/admin/users/UserStatusBadge.vue — badge status akun user. -->
<script setup lang="ts">
import { computed } from 'vue';
import AppBadge from '@/components/app/AppBadge.vue';

const props = defineProps<{ status?: string | null }>();

type BadgeColor = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const meta = computed<{ color: BadgeColor; label: string }>(() => {
  const map: Record<string, { color: BadgeColor; label: string }> = {
    active: { color: 'success', label: 'Aktif' },
    inactive: { color: 'default', label: 'Nonaktif' },
    banned: { color: 'danger', label: 'Diban' },
  };
  return map[props.status ?? 'active'] ?? { color: 'default', label: props.status ?? '-' };
});
</script>

<template>
  <AppBadge :color="meta.color" size="sm">{{ meta.label }}</AppBadge>
</template>
