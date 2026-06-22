<!--
  src/features/admin/comments/CommentModerationView.vue
  Moderasi komentar: tabel semua komentar + filter status + aksi approve/spam/trash (cursor pagination).
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { MessageSquare } from '@lucide/vue';
import { commentService } from '@/services/comment.service';
import { useToast } from '@/composables/useToast';
import AppCard from '@/components/app/AppCard.vue';
import AppSelect from '@/components/app/AppSelect.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import LoadMore from '@/components/ui/LoadMore.vue';
import CommentRow from './CommentRow.vue';
import { STATUS_FILTER_OPTIONS } from './commentMeta';
import type { Comment } from '@/types/domain';

type CommentStatus = NonNullable<Comment['status']>;

const toast = useToast();
const queryClient = useQueryClient();

const PAGE_SIZE = 20;
const statusFilter = ref<string>('');

const commentsKey = computed(() => ['admin-comments', statusFilter.value] as const);

const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery({
    queryKey: commentsKey,
    queryFn: ({ pageParam }) =>
      commentService.listAll({
        limit: PAGE_SIZE,
        cursor: pageParam,
        status: statusFilter.value || undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.meta?.next_cursor ?? undefined,
  });

const items = computed<Comment[]>(() => data.value?.pages.flatMap((p) => p.data) ?? []);

const updatingId = ref<string | null>(null);

const updateMutation = useMutation({
  mutationFn: ({ id, status }: { id: string; status: CommentStatus }) =>
    commentService.updateStatus(id, status),
  onMutate: ({ id }) => {
    updatingId.value = id;
  },
  onSuccess: () => {
    toast.success('Status komentar diperbarui.');
    void queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
  },
  onError: () => {
    toast.error('Gagal memperbarui status komentar.');
  },
  onSettled: () => {
    updatingId.value = null;
  },
});

function updateStatus(id: string, status: CommentStatus): void {
  updateMutation.mutate({ id, status });
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Moderasi Komentar</h1>
        <p class="mt-1 text-sm text-text-muted">Tinjau dan moderasi komentar pengunjung.</p>
      </div>
      <div class="w-48">
        <AppSelect
          v-model="statusFilter"
          label="Filter status"
          :options="STATUS_FILTER_OPTIONS"
          native
        />
      </div>
    </header>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <AppEmptyState
      v-else-if="isError"
      title="Gagal memuat komentar"
      description="Terjadi kesalahan saat mengambil daftar komentar. Coba muat ulang."
      :icon="MessageSquare"
    />

    <AppEmptyState
      v-else-if="!items.length"
      title="Tidak ada komentar"
      description="Belum ada komentar untuk filter yang dipilih."
      :icon="MessageSquare"
    />

    <template v-else>
      <AppCard padding="none">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-border bg-bg-subtle">
                <th class="px-4 py-3 text-xs font-semibold text-text-muted">Penulis</th>
                <th class="px-4 py-3 text-xs font-semibold text-text-muted">Komentar</th>
                <th class="px-4 py-3 text-xs font-semibold text-text-muted">Status</th>
                <th class="px-4 py-3 text-xs font-semibold text-text-muted">Tanggal</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-text-muted">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <CommentRow
                v-for="comment in items"
                :key="comment.id"
                :comment="comment"
                :pending="updatingId === comment.id"
                @update-status="updateStatus"
              />
            </tbody>
          </table>
        </div>
      </AppCard>

      <LoadMore :has-more="!!hasNextPage" :loading="isFetchingNextPage" @more="fetchNextPage()" />
    </template>
  </section>
</template>
