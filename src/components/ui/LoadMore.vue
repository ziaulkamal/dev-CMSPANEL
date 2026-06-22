<!-- src/components/ui/LoadMore.vue — tombol pagination cursor ("muat lebih banyak"). -->
<script setup lang="ts">
import AppButton from '@/components/app/AppButton.vue';

defineProps<{ hasMore: boolean; loading?: boolean }>();
const emit = defineEmits<{ more: [] }>();
</script>

<template>
  <div v-if="hasMore" class="mt-6 flex justify-center">
    <AppButton variant="secondary" :loading="loading" @click="emit('more')">
      Muat lebih banyak
    </AppButton>
  </div>
</template>
