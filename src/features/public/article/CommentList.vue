<!-- src/features/public/article/CommentList.vue — daftar komentar modern, thread via parent_id. -->
<script setup lang="ts">
import { computed } from 'vue';
import { buildCommentTree, type UiComment } from './commentTypes';
import CommentItem from './CommentItem.vue';

const props = defineProps<{ comments: ReadonlyArray<UiComment> }>();
const emit = defineEmits<{
  (e: 'reply', payload: { parentId: string; name: string; whatsapp: string; body: string }): void;
}>();

const tree = computed<UiComment[]>(() => buildCommentTree(props.comments));
</script>

<template>
  <div v-if="tree.length" class="flex flex-col gap-6">
    <CommentItem
      v-for="c in tree"
      :key="c.id"
      :comment="c"
      @reply="emit('reply', $event)"
    />
  </div>
  <p v-else class="text-sm" :style="{ color: 'var(--color-pub-muted)' }">
    Belum ada komentar. Jadilah yang pertama!
  </p>
</template>
