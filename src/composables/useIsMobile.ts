// ─────────────────────────────────────────────────────────────────────────────
// useIsMobile — reactive flag apakah viewport < BREAKPOINT_MOBILE (mobile).
// Satu listener resize di-share antar pemakai (ref-counted) agar tidak ada
// listener tersebar di banyak komponen. Sumber breakpoint: @/config/layout.
// ─────────────────────────────────────────────────────────────────────────────
import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { BREAKPOINT_MOBILE } from '@/config/layout';

function read(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINT_MOBILE;
}

// State global, di-share semua pemakai composable.
const isMobile = ref<boolean>(read());
let listeners = 0;

function onResize(): void {
  isMobile.value = read();
}

/** Reactive `isMobile` (true bila viewport < 768px). */
export function useIsMobile(): Ref<boolean> {
  onMounted(() => {
    if (listeners === 0) window.addEventListener('resize', onResize);
    listeners += 1;
    isMobile.value = read();
  });

  onUnmounted(() => {
    listeners -= 1;
    if (listeners === 0) window.removeEventListener('resize', onResize);
  });

  return isMobile;
}
