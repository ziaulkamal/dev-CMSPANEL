/**
 * src/features/public/search/useSearch.ts
 * Logika pencarian publik: debounce input, mulai cari saat ≥ MIN_CHARS karakter,
 * cakup judul + kategori. Mode mock: filter pool story lokal. Mode live: feed
 * konten + filter judul di klien (backend belum punya param `q`).
 */
import { ref, computed, watch } from 'vue';
import { contentService } from '@/services/content.service';
import {
  USE_MOCK,
  searchMockStories,
  type MockStory,
} from '@/features/public/data/homeSource';

export const MIN_CHARS = 4;

export function useSearch(limit = 10) {
  const query = ref('');
  const results = ref<MockStory[]>([]);
  const loading = ref(false);
  /** True bila input cukup panjang untuk memicu pencarian. */
  const active = computed(() => query.value.trim().length >= MIN_CHARS);

  let timer: ReturnType<typeof setTimeout> | null = null;

  async function run(): Promise<void> {
    const q = query.value.trim();
    if (q.length < MIN_CHARS) {
      results.value = [];
      loading.value = false;
      return;
    }

    if (USE_MOCK) {
      results.value = searchMockStories(q, limit);
      loading.value = false;
      return;
    }

    // Mode live: ambil feed published lalu filter judul di klien.
    // TODO(backend): tambahkan param `q` pada GET /contents untuk relevansi server-side.
    loading.value = true;
    try {
      const r = await contentService.list({
        type: 'post',
        status: 'published',
        sort: '-published_at',
        limit: 50,
      });
      const lc = q.toLowerCase();
      results.value = (r.data ?? [])
        .filter((c) => c.title.toLowerCase().includes(lc))
        .slice(0, limit) as MockStory[];
    } catch {
      results.value = [];
    } finally {
      loading.value = false;
    }
  }

  watch(query, () => {
    if (timer) clearTimeout(timer);
    loading.value = active.value;
    timer = setTimeout(run, 220);
  });

  function reset(): void {
    query.value = '';
    results.value = [];
    loading.value = false;
  }

  return { query, results, loading, active, reset, MIN_CHARS };
}
