<!-- src/App.vue — root: render route aktif + host toast global (AppToast). -->
<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppToast from '@/components/app/AppToast.vue';
</script>

<template>
  <RouterView />
  <AppToast />
</template>
