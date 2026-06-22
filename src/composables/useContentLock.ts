/**
 * src/composables/useContentLock.ts
 * Article lock saat mengedit: acquire → heartbeat berkala → release.
 * Tangani 423 CONTENT_LOCKED (tampilkan pemegang lock, editor read-only).
 */
import { onBeforeUnmount, ref } from 'vue';
import { AxiosError } from 'axios';
import { contentService } from '@/services/content.service';
import type { ApiError } from '@/types/api';
import type { LockHolder } from '@/types/domain';

const HEARTBEAT_MS = 90_000; // < TTL 30 menit; perpanjang tiap 1.5 menit

export function useContentLock(contentId: string) {
  const locked = ref(false);
  const lockedBy = ref<LockHolder | null>(null);
  let timer: number | null = null;

  function stopHeartbeat() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  /** Acquire lock; jika 423 → set lockedBy & locked, kembalikan false. */
  async function acquire(): Promise<boolean> {
    try {
      await contentService.lock(contentId);
      locked.value = false;
      lockedBy.value = null;
      timer = window.setInterval(() => {
        contentService.heartbeat(contentId).catch(() => undefined);
      }, HEARTBEAT_MS);
      return true;
    } catch (err) {
      const ax = err as AxiosError<ApiError>;
      if (ax.response?.data?.error?.code === 'CONTENT_LOCKED') {
        locked.value = true;
        lockedBy.value = (ax.response.data.error.details as LockHolder) ?? {};
      }
      return false;
    }
  }

  async function release(force = false): Promise<void> {
    stopHeartbeat();
    await contentService.unlock(contentId, force).catch(() => undefined);
  }

  onBeforeUnmount(() => {
    stopHeartbeat();
    contentService.unlock(contentId).catch(() => undefined);
  });

  return { locked, lockedBy, acquire, release };
}
