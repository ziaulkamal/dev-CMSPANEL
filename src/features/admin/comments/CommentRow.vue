<!--
  src/features/admin/comments/CommentRow.vue
  Satu baris tabel moderasi komentar: penulis, cuplikan, status, tanggal, aksi.
-->
<script setup lang="ts">
import { computed } from 'vue';
import AppBadge from '@/components/app/AppBadge.vue';
import AppButton from '@/components/app/AppButton.vue';
import { STATUS_BADGE, STATUS_LABEL } from './commentMeta';
import type { Comment } from '@/types/domain';

type CommentStatus = NonNullable<Comment['status']>;

const props = defineProps<{ comment: Comment; pending: boolean }>();
const emit = defineEmits<{ updateStatus: [id: string, status: CommentStatus] }>();

const author = computed<string>(() => props.comment.guest_name ?? 'Anonim');

const snippet = computed<string>(() => {
  const body = props.comment.body ?? '';
  return body.length > 120 ? `${body.slice(0, 120)}…` : body;
});

const status = computed<CommentStatus>(() => props.comment.status ?? 'pending');

const createdAt = computed<string>(() =>
  new Date(props.comment.created_at).toLocaleString('id-ID'),
);
</script>

<template>
  <tr class="border-b border-border last:border-b-0">
    <td class="px-4 py-3 align-top text-sm font-medium text-text-primary">{{ author }}</td>
    <td class="px-4 py-3 align-top text-sm text-text-muted">{{ snippet }}</td>
    <td class="px-4 py-3 align-top">
      <AppBadge :color="STATUS_BADGE[status]" size="sm">{{ STATUS_LABEL[status] }}</AppBadge>
    </td>
    <td class="px-4 py-3 align-top whitespace-nowrap text-sm text-text-subtle">{{ createdAt }}</td>
    <td class="px-4 py-3 align-top">
      <div class="flex flex-wrap justify-end gap-2">
        <AppButton
          variant="success"
          size="xs"
          :loading="pending"
          :disabled="status === 'approved'"
          @click="emit('updateStatus', comment.id, 'approved')"
        >
          Setujui
        </AppButton>
        <AppButton
          variant="warning"
          size="xs"
          :loading="pending"
          :disabled="status === 'spam'"
          @click="emit('updateStatus', comment.id, 'spam')"
        >
          Spam
        </AppButton>
        <AppButton
          variant="danger"
          size="xs"
          :loading="pending"
          :disabled="status === 'trash'"
          @click="emit('updateStatus', comment.id, 'trash')"
        >
          Sampah
        </AppButton>
      </div>
    </td>
  </tr>
</template>
