<!-- src/components/ui/LoadMore.vue — tombol pagination cursor ("muat lebih banyak"), gaya editorial public. -->
<script setup lang="ts">
defineProps<{ hasMore: boolean; loading?: boolean }>();
const emit = defineEmits<{ more: [] }>();
</script>

<template>
  <div v-if="hasMore" class="mt-8 flex justify-center">
    <button
      type="button"
      class="pub-loadmore"
      :class="{ 'pub-loadmore--loading': loading }"
      :disabled="loading"
      :aria-busy="loading"
      @click="emit('more')"
    >
      <svg
        v-if="loading"
        class="pub-loadmore__spinner"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-dashoffset="10" />
      </svg>
      <span>{{ loading ? 'Memuat…' : 'Muat lebih banyak' }}</span>
    </button>
  </div>
</template>

<style scoped>
.pub-loadmore {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  border-radius: 9999px;
  font-family: var(--font-pub-sans);
  font-size: 12.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  color: var(--color-pub-ink);
  background-color: var(--color-pub-paper);
  border: 1.5px solid var(--color-pub-line);
  transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}
.pub-loadmore:hover:not(:disabled) {
  color: #fff;
  background-color: var(--color-pub-crimson);
  border-color: var(--color-pub-crimson);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--color-pub-crimson) 28%, transparent);
}
.pub-loadmore:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-pub-crimson) 30%, transparent);
}
.pub-loadmore--loading,
.pub-loadmore:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.pub-loadmore__spinner {
  animation: pub-loadmore-spin 0.7s linear infinite;
}
@keyframes pub-loadmore-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
