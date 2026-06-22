<!-- src/features/public/article/CommentList.vue — daftar komentar approved, thread via parent_id. -->
<script setup lang="ts">
import { computed } from 'vue';
import type { Comment } from '@/types/domain';

const props = defineProps<{ comments: ReadonlyArray<Comment> }>();

interface ThreadedComment extends Comment {
  replies: ThreadedComment[];
}

/** Susun komentar datar menjadi pohon berdasarkan parent_id. */
const tree = computed<ThreadedComment[]>(() => {
  const byId = new Map<string, ThreadedComment>();
  props.comments.forEach((c) => byId.set(c.id, { ...c, replies: [] }));
  const roots: ThreadedComment[] = [];
  byId.forEach((c) => {
    const parent = c.parent_id ? byId.get(c.parent_id) : undefined;
    if (parent) parent.replies.push(c);
    else roots.push(c);
  });
  return roots;
});
</script>

<template>
  <ul class="flex flex-col gap-4">
    <li v-for="c in tree" :key="c.id">
      <article class="rounded-lg border border-border bg-surface p-4">
        <p class="text-sm font-medium">{{ c.guest_name ?? 'Anonim' }}</p>
        <p class="mt-1 text-sm text-text-muted">{{ c.body }}</p>
      </article>
      <CommentList v-if="c.replies.length" :comments="c.replies" class="ml-6 mt-3" />
    </li>
  </ul>
</template>
