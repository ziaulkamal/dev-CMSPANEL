<!--
  src/features/admin/contents/SeoPanel.vue
  Panel SEO: preview snippet + counter karakter live; field lanjutan saat "Advanced".
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { Settings2 } from '@lucide/vue';
import AppInput from '@/components/app/AppInput.vue';
import AppTextarea from '@/components/app/AppTextarea.vue';
import AppSelect from '@/components/app/AppSelect.vue';
import AppToggle from '@/components/app/AppToggle.vue';
import { SEO_FIELDS, SEO_ADVANCED_FIELDS } from './editor.config';

const props = defineProps<{
  meta: Record<string, string>;
  disabled?: boolean;
  errors?: Record<string, string>;
  /** Judul konten (fallback bila SEO Title kosong) untuk preview snippet. */
  previewTitle?: string;
  /** URL penuh permalink untuk preview snippet. */
  permalink?: string;
}>();

const emit = defineEmits<{ 'update:meta': [value: Record<string, string>] }>();

const advanced = ref(false);

function update(key: string, value: string): void {
  emit('update:meta', { ...props.meta, [key]: value });
}
function err(key: string): string {
  return props.errors?.[key] ?? '';
}

// ── Counter karakter (ideal range) ────────────────────────────────
const IDEAL: Record<string, { min: number; max: number }> = {
  seo_title: { min: 30, max: 60 },
  seo_description: { min: 70, max: 160 },
};
function counterFor(key: string) {
  const ideal = IDEAL[key];
  if (!ideal) return null;
  const len = (props.meta[key] ?? '').length;
  let state: 'ok' | 'warn' | 'over' = 'ok';
  if (len > ideal.max) state = 'over';
  else if (len < ideal.min) state = 'warn';
  return { len, max: ideal.max, state };
}

// ── Preview snippet (Google-like) ─────────────────────────────────
const snippetTitle = computed<string>(
  () => props.meta.seo_title || props.previewTitle || 'Judul Konten Anda',
);
const snippetUrl = computed<string>(() => props.permalink || 'https://situs.anda/slug');
const snippetDesc = computed<string>(
  () => props.meta.seo_description || 'Tambahkan Meta Description untuk pratinjau hasil pencarian…',
);
</script>

<template>
  <div class="seo">
    <!-- Preview snippet -->
    <div class="seo__snippet">
      <p class="seo__snippet-title">{{ snippetTitle }}</p>
      <p class="seo__snippet-url">{{ snippetUrl }}</p>
      <p class="seo__snippet-desc">{{ snippetDesc }}</p>
    </div>

    <div class="seo__rows">
      <div v-for="field in SEO_FIELDS" :key="field.key" class="seo__field">
        <component
          :is="field.type === 'textarea' ? AppTextarea : field.type === 'select' ? AppSelect : AppInput"
          :label="field.label"
          :rows="field.type === 'textarea' ? 3 : undefined"
          :placeholder="field.placeholder"
          :native="field.type === 'select' ? true : undefined"
          :options="field.type === 'select' ? [...(field.options ?? [])] : undefined"
          :model-value="meta[field.key] ?? ''"
          :disabled="disabled"
          :error="err(field.key)"
          @update:model-value="(v: string) => update(field.key, v)"
        />
        <div v-if="counterFor(field.key)" class="seo__counter" :class="`seo__counter--${counterFor(field.key)!.state}`">
          {{ counterFor(field.key)!.len }} / {{ counterFor(field.key)!.max }} karakter
        </div>
      </div>
    </div>

    <div class="seo__advanced-toggle">
      <AppToggle v-model="advanced" size="sm" :disabled="disabled">
        <span class="seo__advanced-label"><Settings2 :size="13" /> Pengaturan SEO lanjutan</span>
      </AppToggle>
    </div>

    <Transition name="seo-collapse">
      <div v-if="advanced" class="seo__rows seo__rows--advanced">
        <component
          :is="field.type === 'textarea' ? AppTextarea : field.type === 'select' ? AppSelect : AppInput"
          v-for="field in SEO_ADVANCED_FIELDS"
          :key="field.key"
          :label="field.label"
          :rows="field.type === 'textarea' ? 3 : undefined"
          :placeholder="field.placeholder"
          :native="field.type === 'select' ? true : undefined"
          :options="field.type === 'select' ? [...(field.options ?? [])] : undefined"
          :model-value="meta[field.key] ?? ''"
          :disabled="disabled"
          :error="err(field.key)"
          @update:model-value="(v: string) => update(field.key, v)"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.seo { display: flex; flex-direction: column; gap: 16px; }

/* Preview snippet */
.seo__snippet {
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 12px 14px;
  background: var(--color-bg-subtle);
}
.seo__snippet-title {
  font-size: 15px;
  color: #1a0dab;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.seo__snippet-url { font-size: 12px; color: #006621; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.seo__snippet-desc {
  font-size: 12.5px;
  color: var(--color-text-muted);
  margin-top: 3px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
:global(.dark) .seo__snippet-title { color: #8ab4f8; }
:global(.dark) .seo__snippet-url { color: #4ade80; }

.seo__rows { display: flex; flex-direction: column; gap: 14px; }
.seo__field { display: flex; flex-direction: column; gap: 3px; }
.seo__counter { align-self: flex-end; font-size: 11px; font-weight: 600; }
.seo__counter--ok { color: var(--color-success); }
.seo__counter--warn { color: var(--color-text-subtle); }
.seo__counter--over { color: var(--color-danger); }

.seo__rows--advanced {
  padding-top: 14px;
  border-top: 1px dashed var(--color-border);
}
.seo__advanced-toggle { display: flex; }
.seo__advanced-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
}

.seo-collapse-enter-active,
.seo-collapse-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}
.seo-collapse-enter-from,
.seo-collapse-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
