<!--
  src/features/admin/contents/TypeSettingsPanel.vue
  Field meta spesifik per tipe konten (video/gallery/live_report). Kosong → tidak dirender oleh induk.
-->
<script setup lang="ts">
import { computed } from 'vue';
import AppInput from '@/components/app/AppInput.vue';
import AppSelect from '@/components/app/AppSelect.vue';
import AppTextarea from '@/components/app/AppTextarea.vue';
import type { ContentType } from '@/types/domain';
import { typeMetaFields, type MetaFieldDef } from './editor.config';

const props = defineProps<{
  type: ContentType;
  meta: Record<string, string>;
  disabled?: boolean;
  errors?: Record<string, string>;
}>();

const emit = defineEmits<{ 'update:meta': [value: Record<string, string>] }>();

const fields = computed<MetaFieldDef[]>(() => typeMetaFields(props.type));

function update(key: string, value: string): void {
  emit('update:meta', { ...props.meta, [key]: value });
}
function err(key: string): string {
  return props.errors?.[key] ?? '';
}
</script>

<template>
  <div class="tsp">
    <template v-for="field in fields" :key="field.key">
      <AppTextarea
        v-if="field.type === 'textarea'"
        :label="field.label"
        :rows="3"
        :model-value="meta[field.key] ?? ''"
        :placeholder="field.placeholder"
        :disabled="disabled"
        :error="err(field.key)"
        @update:model-value="(v: string) => update(field.key, v)"
      />
      <AppSelect
        v-else-if="field.type === 'select'"
        native
        :label="field.label"
        :options="[...(field.options ?? [])]"
        placeholder="Pilih…"
        :model-value="meta[field.key] ?? ''"
        :disabled="disabled"
        :error="err(field.key)"
        @update:model-value="(v: string) => update(field.key, v)"
      />
      <AppInput
        v-else
        :label="field.label"
        :type="field.type === 'datetime-local' ? 'datetime-local' : 'text'"
        :placeholder="field.placeholder"
        :model-value="meta[field.key] ?? ''"
        :disabled="disabled"
        :error="err(field.key)"
        @update:model-value="(v: string) => update(field.key, v)"
      />
    </template>
  </div>
</template>

<style scoped>
.tsp { display: flex; flex-direction: column; gap: 14px; }
</style>
