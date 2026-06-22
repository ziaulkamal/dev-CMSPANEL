<!--
  CommentItem.vue — satu kartu komentar modern: avatar inisial, nama, waktu relatif,
  badge Admin (opsional), tombol Reply (inline form), balasan ter-nest rekursif.
  Threading via prop `comment.replies`. Reply/balasan bersifat mock/lokal (di-emit
  ke ArticleView yang memegang state).
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { relativeTime } from '@/lib/datetime';
import type { UiComment } from './commentTypes';
import CommentReplyForm from './CommentReplyForm.vue';

const props = defineProps<{ comment: UiComment; depth?: number }>();
const emit = defineEmits<{
  (e: 'reply', payload: { parentId: string; name: string; whatsapp: string; body: string }): void;
}>();

const replying = ref(false);
const name = computed(() => props.comment.guest_name?.trim() || 'Anonim');
const initial = computed(() => name.value.charAt(0).toUpperCase());
const depth = computed(() => props.depth ?? 0);

function onReplySubmit(payload: { name: string; whatsapp: string; body: string }): void {
  emit('reply', { parentId: props.comment.id, ...payload });
  replying.value = false;
}
</script>

<template>
  <article>
    <div class="flex gap-3">
      <span
        class="flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold"
        :style="{
          backgroundColor: comment.is_admin
            ? 'var(--color-pub-crimson)'
            : 'var(--color-pub-canvas)',
          color: comment.is_admin ? '#fff' : 'var(--color-pub-crimson)',
        }"
        aria-hidden="true"
      >{{ initial }}</span>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span class="text-sm font-semibold" :style="{ color: 'var(--color-pub-ink)' }">{{ name }}</span>
          <span
            v-if="comment.is_admin"
            class="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
            :style="{ backgroundColor: 'var(--color-pub-crimson)' }"
          >Admin</span>
          <span class="text-xs" :style="{ color: 'var(--color-pub-muted)' }">
            {{ relativeTime(comment.created_at) }}
          </span>
        </div>

        <p class="mt-1 text-sm leading-relaxed" :style="{ color: 'var(--color-pub-ink)' }">
          {{ comment.body }}
        </p>

        <button
          v-if="depth < 3"
          type="button"
          class="mt-1.5 text-xs font-semibold transition-colors"
          :style="{ color: replying ? 'var(--color-pub-crimson)' : 'var(--color-pub-muted)' }"
          @click="replying = !replying"
        >
          {{ replying ? 'Batal' : 'Balas' }}
        </button>

        <CommentReplyForm
          v-if="replying"
          class="mt-3"
          @submit="onReplySubmit"
          @cancel="replying = false"
        />

        <!-- Balasan ter-nest -->
        <div
          v-if="comment.replies.length"
          class="mt-4 flex flex-col gap-4 border-l pl-4"
          :style="{ borderColor: 'var(--color-pub-line)' }"
        >
          <CommentItem
            v-for="child in comment.replies"
            :key="child.id"
            :comment="child"
            :depth="depth + 1"
            @reply="emit('reply', $event)"
          />
        </div>
      </div>
    </div>
  </article>
</template>
