/**
 * src/features/public/search/useSearchOverlay.ts
 * State singleton untuk membuka/menutup overlay pencarian publik, agar bisa
 * dipicu dari mana saja (TheMasthead desktop, BottomNav mobile) dan dirender
 * sekali di PublicLayout.
 */
import { ref } from 'vue';

const isOpen = ref(false);

export function useSearchOverlay() {
  return {
    isOpen,
    open: () => {
      isOpen.value = true;
    },
    close: () => {
      isOpen.value = false;
    },
    toggle: () => {
      isOpen.value = !isOpen.value;
    },
  };
}
