<!--
  src/features/admin/contents/TaxonomyGroup.vue
  Satu blok pemilih untuk satu taxonomy: hierarchical → checkbox; flat → token input.
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { Tag, FolderTree, Plus } from '@lucide/vue';
import AppBadge from '@/components/app/AppBadge.vue';
import AppCheckbox from '@/components/app/AppCheckbox.vue';
import { taxonomyService } from '@/services/taxonomy.service';
import type { Taxonomy, Term } from '@/types/domain';

const props = defineProps<{
  taxonomy: Taxonomy;
  selected: string[];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  toggle: [id: string, checked: boolean];
  set: [ids: string[]];
}>();

const termsQuery = useQuery({
  queryKey: ['taxonomy-terms', props.taxonomy.slug],
  queryFn: () => taxonomyService.terms(props.taxonomy.slug),
});

const terms = computed<Term[]>(() => termsQuery.data.value ?? []);
const termById = computed<Record<string, Term>>(() =>
  Object.fromEntries(terms.value.map((t) => [t.id, t])),
);

const draft = ref('');

function addTag(): void {
  const name = draft.value.trim();
  if (!name) return;
  const match = terms.value.find((t) => t.name.toLowerCase() === name.toLowerCase());
  if (match && !props.selected.includes(match.id)) {
    emit('set', [...props.selected, match.id]);
  }
  draft.value = '';
}
function removeTag(id: string): void {
  emit('set', props.selected.filter((x) => x !== id));
}
</script>

<template>
  <div class="taxg">
    <div class="taxg__head">
      <component :is="taxonomy.hierarchical ? FolderTree : Tag" :size="14" class="taxg__icon" />
      <span class="taxg__label">{{ taxonomy.label }}</span>
      <span v-if="selected.length" class="taxg__count">{{ selected.length }}</span>
    </div>

    <p v-if="termsQuery.isLoading.value" class="taxg__empty">Memuat…</p>
    <p v-else-if="!terms.length" class="taxg__empty">Belum ada term.</p>

    <!-- Hierarchical → checkbox list -->
    <div v-else-if="taxonomy.hierarchical" class="taxg__tree">
      <AppCheckbox
        v-for="term in terms"
        :key="term.id"
        :label="term.name"
        :model-value="selected.includes(term.id)"
        :disabled="disabled"
        :style="term.parent_id ? 'margin-left:18px' : ''"
        @update:model-value="(v: boolean) => emit('toggle', term.id, v)"
      />
    </div>

    <!-- Flat → token input -->
    <div v-else class="taxg__tags">
      <div v-if="selected.length" class="taxg__chips">
        <AppBadge
          v-for="id in selected"
          :key="id"
          color="primary"
          removable
          @remove="removeTag(id)"
        >
          {{ termById[id]?.name ?? '—' }}
        </AppBadge>
      </div>
      <div class="taxg__tag-input">
        <input
          v-model="draft"
          type="text"
          class="taxg__tag-field"
          placeholder="Ketik nama tag lalu Enter…"
          :disabled="disabled"
          :list="`taxg-suggest-${taxonomy.slug}`"
          @keydown.enter.prevent="addTag"
        />
        <datalist :id="`taxg-suggest-${taxonomy.slug}`">
          <option v-for="t in terms" :key="t.id" :value="t.name" />
        </datalist>
        <button
          type="button"
          class="taxg__tag-add"
          :disabled="disabled || !draft.trim()"
          @click="addTag"
        >
          <Plus :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.taxg + .taxg { border-top: 1px solid var(--color-border); padding-top: 16px; }
.taxg__head { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
.taxg__icon { color: var(--color-text-muted); }
.taxg__label { font-size: 12.5px; font-weight: 600; color: var(--color-text-primary); }
.taxg__count {
  margin-left: auto;
  font-size: 10.5px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 99px;
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
}
.taxg__empty { font-size: 12px; color: var(--color-text-subtle); }

.taxg__tree {
  display: flex;
  flex-direction: column;
  gap: 9px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

.taxg__tags { display: flex; flex-direction: column; gap: 10px; }
.taxg__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.taxg__tag-input {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}
.taxg__tag-input:focus-within { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
.taxg__tag-field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}
.taxg__tag-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  align-self: stretch;
  border: none;
  border-left: 1.5px solid var(--color-border);
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 120ms ease, background 120ms ease;
}
.taxg__tag-add:hover:not(:disabled) { background: var(--color-border); color: var(--color-text-primary); }
.taxg__tag-add:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
