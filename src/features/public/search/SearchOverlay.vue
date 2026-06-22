<!--
  SearchOverlay.vue — panel pencarian cepat. Dibuka dari TheMasthead (desktop) &
  BottomNav (mobile) via useSearchOverlay. Mulai cari saat ≥4 karakter, tampilkan
  ≤10 hasil relevan; "Lihat semua hasil" → /search?q=. Mobile: full-screen sheet;
  desktop: panel melayang di atas.
-->
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { Search, X } from '@lucide/vue';
import { useSearchOverlay } from './useSearchOverlay';
import { useSearch, MIN_CHARS } from './useSearch';
import { formatDate } from '@/lib/datetime';

const { isOpen, close } = useSearchOverlay();
const router = useRouter();
const { query, results, loading, active, reset } = useSearch(10);

const inputEl = ref<HTMLInputElement | null>(null);

watch(isOpen, async (open) => {
  if (open) {
    await nextTick();
    inputEl.value?.focus();
  } else {
    reset();
  }
});

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') close();
}

function go(to: { id: string; slug?: string }): void {
  close();
  router.push({ name: 'article', params: { id: to.id, slug: to.slug || undefined } });
}

function seeAll(): void {
  const q = query.value.trim();
  if (!q) return;
  close();
  router.push({ name: 'search', query: { q } });
}
</script>

<template>
  <Teleport to="body">
    <Transition name="pub-search-fade">
      <div
        v-if="isOpen"
        class="pub-search-backdrop"
        @click="close"
        @keydown="onKeydown"
      >
        <!-- Panel: top-sheet di mobile (slide-down), melayang atas-tengah desktop -->
        <Transition name="pub-search-slide" appear>
        <div v-if="isOpen" class="pub-search-panel" @click.stop>
          <div class="pub-search-bar">
            <Search :size="20" class="flex-none" :style="{ color: 'var(--color-pub-muted)' }" />
            <input
              ref="inputEl"
              v-model="query"
              type="search"
              class="pub-search-input"
              placeholder="Cari berita, kategori…"
              :aria-label="'Cari'"
              @keydown="onKeydown"
              @keydown.enter="seeAll"
            />
            <button type="button" class="pub-search-close" aria-label="Tutup" @click="close">
              <X :size="20" />
            </button>
          </div>

          <div class="pub-search-body">
            <p
              v-if="query.trim().length > 0 && query.trim().length < MIN_CHARS"
              class="pub-search-hint"
            >
              Ketik minimal {{ MIN_CHARS }} karakter untuk mencari.
            </p>

            <p v-else-if="loading" class="pub-search-hint">Mencari…</p>

            <p v-else-if="active && results.length === 0" class="pub-search-hint">
              Tidak ada hasil untuk “{{ query.trim() }}”.
            </p>

            <ul v-else-if="results.length" class="pub-search-results">
              <li v-for="r in results" :key="r.id">
                <button type="button" class="pub-search-result" @click="go(r)">
                  <img
                    v-if="r.featured_image"
                    :src="r.featured_image"
                    alt=""
                    class="pub-search-thumb"
                    loading="lazy"
                  />
                  <span class="min-w-0 flex-1">
                    <span v-if="r.category" class="pub-search-cat">{{ r.category }}</span>
                    <span class="pub-search-title">{{ r.title }}</span>
                    <span v-if="r.published_at" class="pub-search-date">{{ formatDate(r.published_at) }}</span>
                  </span>
                </button>
              </li>
            </ul>

            <button
              v-if="active && results.length"
              type="button"
              class="pub-search-seeall"
              @click="seeAll"
            >
              Lihat semua hasil →
            </button>
          </div>
        </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pub-search-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: color-mix(in srgb, var(--color-pub-ink) 45%, transparent);
  backdrop-filter: blur(3px);
  display: flex;
  flex-direction: column;
}
.pub-search-panel {
  /* Mobile: sheet menempel di atas dengan sudut bawah membulat & sisa ruang di
     bawahnya (backdrop) untuk tap-to-close — terasa seperti app bar pencarian. */
  width: 100%;
  background: var(--color-pub-paper);
  display: flex;
  flex-direction: column;
  max-height: calc(100% - 24px);
  padding-top: env(safe-area-inset-top, 0);
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 18px;
  box-shadow: 0 12px 32px color-mix(in srgb, var(--color-pub-ink) 28%, transparent);
  overflow: hidden;
}
@media (min-width: 768px) {
  .pub-search-panel {
    width: min(680px, 92vw);
    margin: 7vh auto 0;
    border-radius: 16px;
    max-height: 80vh;
    padding-top: 0;
    box-shadow: 0 24px 60px color-mix(in srgb, var(--color-pub-ink) 35%, transparent);
  }
}
/* Bar pencarian: di mobile dibungkus kapsul agar lebih ramah sentuh. */
.pub-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 12px 0;
  padding: 10px 14px;
  border-radius: 9999px;
  background: var(--color-pub-canvas);
}
@media (min-width: 768px) {
  .pub-search-bar {
    margin: 0;
    padding: 14px 16px;
    border-radius: 0;
    background: transparent;
    border-bottom: 1px solid var(--color-pub-line);
  }
}
.pub-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-pub-sans);
  font-size: 16px;
  color: var(--color-pub-ink);
}
.pub-search-input::placeholder {
  color: var(--color-pub-muted);
}
.pub-search-close {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  color: var(--color-pub-muted);
  transition: background-color 160ms var(--ease-default), color 160ms var(--ease-default);
}
.pub-search-close:hover {
  color: var(--color-pub-crimson);
  background: color-mix(in srgb, var(--color-pub-crimson) 8%, transparent);
}
.pub-search-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px 16px;
}
.pub-search-hint {
  padding: 24px 12px;
  text-align: center;
  font-family: var(--font-pub-sans);
  font-size: 13px;
  color: var(--color-pub-muted);
}
.pub-search-results {
  display: flex;
  flex-direction: column;
}
.pub-search-result {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  text-align: left;
  transition: background-color 140ms var(--ease-default);
}
.pub-search-result:hover {
  background: color-mix(in srgb, var(--color-pub-crimson) 6%, transparent);
}
.pub-search-thumb {
  flex: none;
  width: 56px;
  height: 42px;
  object-fit: cover;
  border-radius: 6px;
}
.pub-search-cat {
  display: block;
  font-family: var(--font-pub-sans);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-pub-crimson);
}
.pub-search-title {
  display: block;
  font-family: var(--font-pub-sans);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-pub-ink);
}
.pub-search-date {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--color-pub-muted);
}
.pub-search-seeall {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 12px;
  border-top: 1px solid var(--color-pub-line);
  font-family: var(--font-pub-sans);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-pub-crimson);
  text-align: center;
}

.pub-search-fade-enter-active,
.pub-search-fade-leave-active {
  transition: opacity 180ms var(--ease-default);
}
.pub-search-fade-enter-from,
.pub-search-fade-leave-to {
  opacity: 0;
}

/* Panel turun dari atas (mobile/desktop). */
.pub-search-slide-enter-active,
.pub-search-slide-leave-active {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms var(--ease-default);
}
.pub-search-slide-enter-from,
.pub-search-slide-leave-to {
  transform: translateY(-16px);
  opacity: 0;
}
</style>
