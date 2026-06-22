<!--
  src/components/ui/InlineEditText.vue
  Teks yang dapat diedit di tempat (in-place). Klik teks → input;
  Enter/blur simpan, Esc batal. Dipakai untuk rename media, alt text, caption.
-->
<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    /** Tampilkan sebagai textarea multi-baris (mis. caption). */
    multiline?: boolean;
    disabled?: boolean;
    /** Teks yang ditampilkan saat nilai kosong. */
    emptyLabel?: string;
  }>(),
  { placeholder: '', multiline: false, disabled: false, emptyLabel: '—' },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const editing = ref(false);
const draft = ref('');
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);

async function startEdit(): Promise<void> {
  if (props.disabled) return;
  draft.value = props.modelValue;
  editing.value = true;
  await nextTick();
  inputRef.value?.focus();
  if (inputRef.value && 'select' in inputRef.value) inputRef.value.select();
}

function commit(): void {
  if (!editing.value) return;
  editing.value = false;
  const next = draft.value.trim();
  if (next !== props.modelValue) emit('update:modelValue', next);
}

function cancel(): void {
  editing.value = false;
  draft.value = props.modelValue;
}

// Sinkron jika nilai berubah dari luar saat tidak sedang mengedit.
watch(
  () => props.modelValue,
  (v) => {
    if (!editing.value) draft.value = v;
  },
);
</script>

<template>
  <component
    :is="multiline ? 'textarea' : 'input'"
    v-if="editing"
    ref="inputRef"
    v-model="draft"
    class="inline-edit__field"
    :class="{ 'inline-edit__field--area': multiline }"
    :rows="multiline ? 2 : undefined"
    :placeholder="placeholder"
    @keydown.enter.prevent="!multiline && commit()"
    @keydown.esc.prevent="cancel"
    @blur="commit"
  />
  <button
    v-else
    type="button"
    class="inline-edit__display"
    :class="{ 'inline-edit__display--empty': !modelValue, 'inline-edit__display--disabled': disabled }"
    :title="disabled ? '' : 'Klik untuk mengubah'"
    @click="startEdit"
  >
    {{ modelValue || emptyLabel }}
  </button>
</template>

<style scoped>
.inline-edit__display {
  display: block;
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 2px 4px;
  margin: -2px -4px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    background 120ms ease,
    border-color 120ms ease;
}
.inline-edit__display:hover:not(.inline-edit__display--disabled) {
  background: var(--color-bg-subtle);
  border-color: var(--color-border);
}
.inline-edit__display--empty {
  color: var(--color-text-subtle);
  font-style: italic;
}
.inline-edit__display--disabled {
  cursor: default;
}

.inline-edit__field {
  display: block;
  width: 100%;
  border: 1.5px solid var(--color-primary);
  border-radius: var(--radius-sm);
  padding: 3px 6px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font: inherit;
  outline: none;
}
.inline-edit__field--area {
  resize: vertical;
  min-height: 44px;
}
</style>
