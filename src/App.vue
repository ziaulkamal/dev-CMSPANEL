<!-- src/App.vue — root: loading bar rute + render route aktif + host toast global. -->
<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppToast from '@/components/app/AppToast.vue';
import RouteProgress from '@/components/app/RouteProgress.vue';
</script>

<template>
  <RouteProgress />
  <RouterView />
  <AppToast />
</template>
