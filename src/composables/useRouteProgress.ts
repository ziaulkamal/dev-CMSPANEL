/**
 * src/composables/useRouteProgress.ts
 * State tunggal untuk loading bar navigasi rute. start() saat pindah menu,
 * done() saat selesai. Progress "palsu" merangkak naik agar terasa hidup
 * meski durasi unduh chunk tak diketahui; done() melompat ke 100% lalu fade.
 */
import { readonly, ref } from 'vue';

const active = ref(false);
const progress = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

/** Mulai bar: reset ke awal, tampil, lalu merangkak menuju ~90%. */
function start() {
  clearTimers();
  active.value = true;
  progress.value = 8;
  timer = setInterval(() => {
    // Melambat mendekati 90% (asymptotic) — jangan pernah sampai 100 sebelum done.
    const remaining = 90 - progress.value;
    if (remaining <= 0) return;
    progress.value += Math.max(0.5, remaining * 0.12);
  }, 180);
}

/** Selesai: lompat ke 100%, lalu sembunyikan & reset setelah transisi. */
function done() {
  clearTimers();
  if (!active.value) return;
  progress.value = 100;
  hideTimer = setTimeout(() => {
    active.value = false;
    progress.value = 0;
  }, 260);
}

export function useRouteProgress() {
  return {
    active: readonly(active),
    progress: readonly(progress),
    start,
    done,
  };
}
