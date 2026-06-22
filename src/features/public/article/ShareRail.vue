<!--
  ShareRail.vue — tombol berbagi FLOATING (mobile only). FAB bulat di pojok
  kanan-bawah (mengambang di atas BottomNav, terpisah jelas dari menu bawah).
  Ditekan → tombol sosial muncul memanjang ke atas (stagger) dengan warna brand,
  + backdrop redup. Memakai navigator.share bila tersedia. Emit `shared` agar
  induk menaikkan counter share (UI-only).
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Link2, Share2, X } from '@lucide/vue';
import { useToast } from '@/composables/useToast';

const props = defineProps<{ title: string; url?: string }>();
const emit = defineEmits<{ (e: 'shared'): void }>();
const toast = useToast();

const open = ref(false);

const shareUrl = computed(() => props.url || (typeof window !== 'undefined' ? window.location.href : ''));
const enc = computed(() => encodeURIComponent(shareUrl.value));
const encTitle = computed(() => encodeURIComponent(props.title));

const canNativeShare = computed(
  () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
);

function close(): void {
  open.value = false;
}
function openPopup(href: string): void {
  emit('shared');
  close();
  window.open(href, '_blank', 'noopener,noreferrer,width=600,height=540');
}
function shareWhatsApp(): void {
  openPopup(`https://wa.me/?text=${encTitle.value}%20${enc.value}`);
}
function shareTwitter(): void {
  openPopup(`https://twitter.com/intent/tweet?text=${encTitle.value}&url=${enc.value}`);
}
function shareFacebook(): void {
  openPopup(`https://www.facebook.com/sharer/sharer.php?u=${enc.value}`);
}
async function copyLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    emit('shared');
    close();
    toast.success('Tautan disalin.');
  } catch {
    toast.error('Gagal menyalin tautan.');
  }
}
async function nativeShare(): Promise<void> {
  close();
  try {
    await navigator.share({ title: props.title, url: shareUrl.value });
    emit('shared');
  } catch {
    /* dibatalkan pengguna — abaikan */
  }
}
</script>

<template>
  <div class="pub-fab-root md:hidden">
    <!-- Backdrop redup saat terbuka (tap untuk tutup) -->
    <Transition name="pub-fab-fade">
      <div v-if="open" class="pub-fab-backdrop" @click="close" />
    </Transition>

    <div class="pub-fab" :class="{ 'is-open': open }">
      <!-- Aksi sosial (muncul saat open) -->
      <Transition name="pub-fab-stagger">
        <div v-if="open" class="pub-fab-actions">
          <button
            type="button"
            class="pub-fab-action"
            style="--c: #25d366"
            aria-label="Bagikan ke WhatsApp"
            @click="shareWhatsApp"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.738-.979zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </button>
          <button
            type="button"
            class="pub-fab-action"
            style="--c: #0f1419"
            aria-label="Bagikan ke X"
            @click="shareTwitter"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>
          <button
            type="button"
            class="pub-fab-action"
            style="--c: #1877f2"
            aria-label="Bagikan ke Facebook"
            @click="shareFacebook"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
          <button
            type="button"
            class="pub-fab-action"
            style="--c: var(--color-pub-ink)"
            aria-label="Salin tautan"
            @click="copyLink"
          >
            <Link2 :size="19" />
          </button>
          <button
            v-if="canNativeShare"
            type="button"
            class="pub-fab-action"
            style="--c: var(--color-pub-crimson)"
            aria-label="Bagikan lainnya"
            @click="nativeShare"
          >
            <Share2 :size="19" />
          </button>
        </div>
      </Transition>

      <!-- Trigger FAB -->
      <button
        type="button"
        class="pub-fab-trigger"
        :aria-expanded="open"
        :aria-label="open ? 'Tutup berbagi' : 'Bagikan'"
        @click="open = !open"
      >
        <Transition name="pub-fab-icon" mode="out-in">
          <X v-if="open" :size="22" />
          <Share2 v-else :size="21" />
        </Transition>
      </button>
    </div>
  </div>
</template>

<style scoped>
.pub-fab-backdrop {
  position: fixed;
  inset: 0;
  z-index: 34;
  background: color-mix(in srgb, var(--color-pub-ink) 40%, transparent);
  backdrop-filter: blur(2px);
}

/* Anchor FAB: kanan-bawah, mengambang jelas di atas BottomNav. */
.pub-fab {
  position: fixed;
  right: 16px;
  bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  z-index: 35;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.pub-fab-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.pub-fab-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 9999px;
  color: #fff;
  background: var(--c);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--color-pub-ink) 28%, transparent);
  transition: transform 160ms var(--ease-default);
}
.pub-fab-action:active {
  transform: scale(0.92);
}

.pub-fab-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 9999px;
  color: #fff;
  background: var(--color-pub-crimson);
  box-shadow: 0 8px 22px color-mix(in srgb, var(--color-pub-crimson) 45%, transparent);
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease;
}
.pub-fab.is-open .pub-fab-trigger {
  transform: rotate(90deg);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--color-pub-ink) 30%, transparent);
}

/* Backdrop fade */
.pub-fab-fade-enter-active,
.pub-fab-fade-leave-active {
  transition: opacity 200ms var(--ease-default);
}
.pub-fab-fade-enter-from,
.pub-fab-fade-leave-to {
  opacity: 0;
}

/* Aksi muncul: melayang naik + memudar (stagger via delay per anak) */
.pub-fab-stagger-enter-active {
  transition: opacity 220ms var(--ease-default), transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.pub-fab-stagger-leave-active {
  transition: opacity 140ms var(--ease-default), transform 160ms var(--ease-default);
}
.pub-fab-stagger-enter-from,
.pub-fab-stagger-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.85);
}
.pub-fab-stagger-enter-active .pub-fab-action {
  animation: pub-fab-pop 280ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
.pub-fab-stagger-enter-active .pub-fab-action:nth-child(1) { animation-delay: 0ms; }
.pub-fab-stagger-enter-active .pub-fab-action:nth-child(2) { animation-delay: 45ms; }
.pub-fab-stagger-enter-active .pub-fab-action:nth-child(3) { animation-delay: 90ms; }
.pub-fab-stagger-enter-active .pub-fab-action:nth-child(4) { animation-delay: 135ms; }
.pub-fab-stagger-enter-active .pub-fab-action:nth-child(5) { animation-delay: 180ms; }
@keyframes pub-fab-pop {
  from { opacity: 0; transform: translateY(16px) scale(0.7); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Pergantian ikon trigger */
.pub-fab-icon-enter-active,
.pub-fab-icon-leave-active {
  transition: opacity 140ms var(--ease-default), transform 140ms var(--ease-default);
}
.pub-fab-icon-enter-from,
.pub-fab-icon-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

@media (prefers-reduced-motion: reduce) {
  .pub-fab-trigger,
  .pub-fab-action,
  .pub-fab-stagger-enter-active .pub-fab-action {
    transition: none;
    animation: none;
  }
}
</style>
