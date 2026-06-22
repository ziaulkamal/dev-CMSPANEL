/**
 * src/features/public/data/useWidgets.ts
 * Resolusi widget rail beranda (live) → konten siap render per placement.
 *
 * Mode mock (USE_MOCK) → kembalikan null (HomeView pakai data mock seperti biasa).
 * Mode live → ambil home.widgets dari settings, pilih widget aktif per placement
 * (sort_order terkecil), lalu resolve:
 *   - auto     : query contentService.list({ type, sort, limit })
 *   - manual   : map item kurasi (judul cadangan) → bentuk MockStory ringkas
 *   - taxonomy : tarik feed lebih besar lalu SARING per term di klien (sementara),
 *                karena backend listing belum punya filter term.
 *
 * Catatan kontrak backend: listing hanya menerima type/status/cursor/limit/sort
 * (tak ada filter term/author/q). Mode taxonomy menyaring di klien dan, bila
 * summary tak menyertakan `terms`, jatuh ke passthrough (lihat TODOS arah CORE).
 */
import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { contentService } from '@/services/content.service';
import { widgetService, type Widget, type WidgetPlacement } from '@/services/widget.service';
import { USE_MOCK } from './homeSource';
import type { MockStory, PopularStory } from './homeSource';
import type { ContentSummary } from '@/types/domain';

/** Pilih widget aktif untuk satu placement (sort_order terkecil). */
function pick(widgets: Widget[], placement: WidgetPlacement): Widget | undefined {
  return widgets
    .filter((w) => w.active && w.placement === placement)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
}

/** Item manual → MockStory ringkas (judul instan; field lain opsional). */
function manualToStories(w: Widget): MockStory[] {
  return w.manual.map((m) => ({ id: m.id, slug: m.slug ?? '', title: m.title } as MockStory));
}

export function useWidgets() {
  const { data } = useQuery({
    queryKey: ['public-widgets'],
    queryFn: () => widgetService.list(),
    retry: false,
    staleTime: 5 * 60_000,
    enabled: !USE_MOCK,
  });

  const widgets = computed<Widget[]>(() => data.value ?? []);

  /** Resolve satu placement → daftar MockStory (atau null bila tak dikelola/mock). */
  function resolve(placement: WidgetPlacement): Ref<MockStory[] | null> {
    return computed(() => {
      if (USE_MOCK) return null;
      const w = pick(widgets.value, placement);
      if (!w) return null;
      if (w.source_mode === 'manual') return manualToStories(w);
      return autoFeeds.value[placement] ?? [];
    });
  }

  // Tiap placement punya query feed sendiri (auto & taxonomy) agar type/limit akurat.
  const autoQueries = {
    popular: useFeed(() => pick(widgets.value, 'popular')),
    editorsPick: useFeed(() => pick(widgets.value, 'editorsPick')),
    video: useFeed(() => pick(widgets.value, 'video')),
    opinion: useFeed(() => pick(widgets.value, 'opinion')),
  };

  const autoFeeds = computed<Record<WidgetPlacement, MockStory[]>>(() => ({
    popular: autoQueries.popular.value,
    editorsPick: autoQueries.editorsPick.value,
    video: autoQueries.video.value,
    opinion: autoQueries.opinion.value,
  }));

  /** Judul rail override (atau null → pakai default HomeView). */
  function titleOf(placement: WidgetPlacement): string | null {
    const w = pick(widgets.value, placement);
    return w?.title?.trim() ? w.title.trim() : null;
  }

  /** Versi PopularStory (hanya butuh id/slug/title/views) untuk PopularList. */
  function resolvePopular(): Ref<PopularStory[] | null> {
    const stories = resolve('popular');
    return computed(() => {
      const s = stories.value;
      if (!s) return null;
      return s.map((x) => ({
        id: x.id,
        slug: x.slug ?? '',
        title: x.title ?? '',
        views: x.stats?.views,
      }));
    });
  }

  return { resolve, resolvePopular, titleOf };
}

/** Konten dengan kemungkinan field terms (summary backend bisa menyertakan/tidak). */
type FeedItem = ContentSummary & { terms?: Array<{ id?: string; slug?: string }> };

/**
 * Query feed untuk satu widget (mode auto & taxonomy).
 * - auto     : ambil persis limit, urut sesuai config.
 * - taxonomy : ambil pool lebih besar lalu saring per term di klien; bila item
 *              tak punya `terms`, passthrough (tak bisa disaring tanpa data term).
 */
function useFeed(getWidget: () => Widget | undefined): Ref<MockStory[]> {
  const params = computed(() => {
    const w = getWidget();
    if (!w) return null;
    if (w.source_mode === 'auto') {
      return { type: w.auto.content_type, sort: w.auto.sort, limit: w.auto.limit };
    }
    if (w.source_mode === 'taxonomy' && w.taxonomy) {
      // Pool lebih besar agar setelah disaring masih cukup item.
      return { type: w.taxonomy.content_type, sort: '-published_at', limit: Math.max(w.taxonomy.limit * 4, 20) };
    }
    return null;
  });

  const { data } = useQuery({
    queryKey: computed(() => ['public-widget-feed', params.value]),
    queryFn: () => {
      const p = params.value!;
      return contentService
        .list({ type: p.type, status: 'published', sort: p.sort, limit: p.limit })
        .then((r) => r.data);
    },
    retry: false,
    staleTime: 60_000,
    enabled: computed(() => !USE_MOCK && params.value !== null),
  });

  return computed<MockStory[]>(() => {
    const w = getWidget();
    const items = (data.value ?? []) as FeedItem[];
    if (w?.source_mode === 'taxonomy' && w.taxonomy) {
      const tid = w.taxonomy.term_id;
      const tslug = w.taxonomy.term_slug;
      const filtered = items.filter((it) =>
        (it.terms ?? []).some((t) => (tid && t.id === tid) || (tslug && t.slug === tslug)),
      );
      // Bila tak ada item ber-terms (summary backend tak menyertakannya), passthrough.
      const pool = filtered.length ? filtered : items;
      return pool.slice(0, w.taxonomy.limit) as unknown as MockStory[];
    }
    return items as unknown as MockStory[];
  });
}
