<!--
  src/features/admin/contents/TaxonomyPicker.vue
  Pemilih taxonomy: hierarchical (categories → checkbox tree) & flat (tags → token input).
  v-model: Record<taxonomySlug, termId[]> — dikirim ke backend sebagai term_ids gabungan.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import TaxonomyGroup from './TaxonomyGroup.vue';
import { taxonomyService } from '@/services/taxonomy.service';
import type { Taxonomy } from '@/types/domain';

const props = defineProps<{
  modelValue: Record<string, string[]>;
  disabled?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: Record<string, string[]>] }>();

const taxonomiesQuery = useQuery({
  queryKey: ['taxonomies'],
  queryFn: () => taxonomyService.list(),
});

const taxonomies = computed<Taxonomy[]>(() => taxonomiesQuery.data.value ?? []);

function selected(slug: string): string[] {
  return props.modelValue[slug] ?? [];
}
function setSelection(slug: string, ids: string[]): void {
  emit('update:modelValue', { ...props.modelValue, [slug]: ids });
}
function toggleTerm(slug: string, id: string, checked: boolean): void {
  const cur = selected(slug);
  setSelection(slug, checked ? [...cur, id] : cur.filter((x) => x !== id));
}
</script>

<template>
  <div class="tax">
    <p v-if="taxonomiesQuery.isLoading.value" class="tax__note">Memuat taxonomy…</p>
    <p v-else-if="taxonomiesQuery.isError.value" class="tax__note tax__note--error">
      Gagal memuat taxonomy.
    </p>
    <p v-else-if="!taxonomies.length" class="tax__note">
      Belum ada taxonomy. Buat dulu di menu Taxonomies.
    </p>

    <TaxonomyGroup
      v-for="tax in taxonomies"
      :key="tax.slug"
      :taxonomy="tax"
      :selected="selected(tax.slug)"
      :disabled="disabled"
      @toggle="(id, checked) => toggleTerm(tax.slug, id, checked)"
      @set="(ids) => setSelection(tax.slug, ids)"
    />
  </div>
</template>

<style scoped>
.tax { display: flex; flex-direction: column; gap: 18px; }
.tax__note { font-size: 12.5px; color: var(--color-text-muted); line-height: 1.5; }
.tax__note--error { color: var(--color-danger); }
</style>
