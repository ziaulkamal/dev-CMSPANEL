<!--
  MainMenuSheet.vue — menu utama (mobile) sebagai BOTTOM SHEET yang naik dari bawah
  (bukan off-canvas). Menampilkan nav utama + anaknya dalam grup. Sumber nav sama
  dengan TheMasthead (mock USE_MOCK / menuService).
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink } from 'vue-router';
import { X } from '@lucide/vue';
import { menuService, type MenuItem } from '@/services/menu.service';
import { USE_MOCK, getHomeMock } from '@/features/public/data/homeSource';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const FALLBACK_NAV: MenuItem[] = [
  { id: 'news', label: 'Berita', url: '/', source: 'custom', children: [] },
  { id: 'aceh', label: 'Aceh', url: '/', source: 'custom', children: [] },
  { id: 'opinion', label: 'Opini', url: '/', source: 'custom', children: [] },
  { id: 'video', label: 'Video', url: '/', source: 'custom', children: [] },
];

const { data } = useQuery({
  queryKey: ['public-menu', 'top'],
  queryFn: () => menuService.get('top'),
  retry: false,
  staleTime: 5 * 60_000,
  enabled: !USE_MOCK,
});

const nav = computed<MenuItem[]>(() => (USE_MOCK ? getHomeMock().nav : data.value ?? FALLBACK_NAV));

function close(): void {
  emit('update:modelValue', false);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="pub-sheet-fade">
      <div v-if="props.modelValue" class="pub-sheet-backdrop" @click="close">
        <Transition name="pub-sheet-slide" appear>
          <div
            v-if="props.modelValue"
            class="pub-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Menu utama"
            @click.stop
          >
            <div class="pub-sheet__handle" aria-hidden="true"></div>

            <div class="pub-sheet__head">
              <span class="pub-sheet__title">Menu</span>
              <button type="button" class="pub-sheet__close" aria-label="Tutup" @click="close">
                <X :size="20" />
              </button>
            </div>

            <div class="pub-sheet__body">
              <div v-for="item in nav" :key="item.id" class="pub-sheet__group">
                <RouterLink
                  :to="item.url || '/'"
                  class="pub-sheet__link pub-sheet__link--parent"
                  @click="close"
                >{{ item.label }}</RouterLink>
                <div v-if="item.children?.length" class="pub-sheet__children">
                  <RouterLink
                    v-for="child in item.children"
                    :key="child.id"
                    :to="child.url || '/'"
                    class="pub-sheet__link pub-sheet__link--child"
                    @click="close"
                  >{{ child.label }}</RouterLink>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pub-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: color-mix(in srgb, var(--color-pub-ink) 45%, transparent);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-end;
}
.pub-sheet {
  width: 100%;
  max-height: 78vh;
  display: flex;
  flex-direction: column;
  background: var(--color-pub-paper);
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  padding-bottom: env(safe-area-inset-bottom, 0);
  box-shadow: 0 -10px 40px color-mix(in srgb, var(--color-pub-ink) 35%, transparent);
  overflow: hidden;
}
.pub-sheet__handle {
  width: 40px;
  height: 4px;
  margin: 10px auto 4px;
  border-radius: 9999px;
  background: var(--color-pub-line);
}
.pub-sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px 12px;
  border-bottom: 1px solid var(--color-pub-line);
}
.pub-sheet__title {
  font-family: var(--font-pub-sans);
  font-size: 15px;
  font-weight: 800;
  color: var(--color-pub-ink);
}
.pub-sheet__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  color: var(--color-pub-muted);
  transition: background-color 160ms var(--ease-default), color 160ms var(--ease-default);
}
.pub-sheet__close:hover {
  color: var(--color-pub-crimson);
  background: color-mix(in srgb, var(--color-pub-crimson) 8%, transparent);
}
.pub-sheet__body {
  overflow-y: auto;
  padding: 10px 12px 18px;
}
.pub-sheet__group + .pub-sheet__group {
  border-top: 1px solid var(--color-pub-line);
  margin-top: 6px;
  padding-top: 6px;
}
.pub-sheet__link {
  display: block;
  border-radius: 8px;
  font-family: var(--font-pub-sans);
  transition: background-color 140ms var(--ease-default), color 140ms var(--ease-default);
}
.pub-sheet__link--parent {
  padding: 11px 12px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-pub-ink);
}
.pub-sheet__link--child {
  padding: 9px 12px 9px 24px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-pub-muted);
}
.pub-sheet__link:hover {
  color: var(--color-pub-crimson);
  background: color-mix(in srgb, var(--color-pub-crimson) 6%, transparent);
}

/* Backdrop fade */
.pub-sheet-fade-enter-active,
.pub-sheet-fade-leave-active {
  transition: opacity 200ms var(--ease-default);
}
.pub-sheet-fade-enter-from,
.pub-sheet-fade-leave-to {
  opacity: 0;
}
/* Panel slide-up */
.pub-sheet-slide-enter-active,
.pub-sheet-slide-leave-active {
  transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}
.pub-sheet-slide-enter-from,
.pub-sheet-slide-leave-to {
  transform: translateY(100%);
}
</style>
