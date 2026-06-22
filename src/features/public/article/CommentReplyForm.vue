<!--
  CommentReplyForm.vue — form balasan inline ringkas (Nama + WhatsApp + isi).
  Emit `submit` ke CommentItem → ArticleView (mock/lokal). Email tidak diminta di
  balasan agar ringkas; form utama (CommentForm) meminta lengkap.
-->
<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'submit', payload: { name: string; whatsapp: string; body: string }): void;
  (e: 'cancel'): void;
}>();

const name = ref('');
const whatsapp = ref('');
const body = ref('');

function submit(): void {
  if (!body.value.trim() || !name.value.trim()) return;
  emit('submit', { name: name.value.trim(), whatsapp: whatsapp.value.trim(), body: body.value.trim() });
  name.value = '';
  whatsapp.value = '';
  body.value = '';
}
</script>

<template>
  <form class="flex flex-col gap-2" @submit.prevent="submit">
    <div class="grid gap-2 sm:grid-cols-2">
      <input
        v-model="name"
        class="pub-comment-input"
        placeholder="Nama"
        required
        :style="{ borderColor: 'var(--color-pub-line)', color: 'var(--color-pub-ink)' }"
      />
      <input
        v-model="whatsapp"
        class="pub-comment-input"
        placeholder="No. WhatsApp (opsional)"
        inputmode="tel"
        :style="{ borderColor: 'var(--color-pub-line)', color: 'var(--color-pub-ink)' }"
      />
    </div>
    <textarea
      v-model="body"
      class="pub-comment-input"
      rows="2"
      placeholder="Tulis balasan…"
      required
      :style="{ borderColor: 'var(--color-pub-line)', color: 'var(--color-pub-ink)' }"
    />
    <div class="flex gap-2">
      <button
        type="submit"
        class="rounded-full px-4 py-1.5 text-xs font-bold text-white"
        :style="{ backgroundColor: 'var(--color-pub-crimson)' }"
      >Balas</button>
      <button
        type="button"
        class="rounded-full px-4 py-1.5 text-xs font-semibold"
        :style="{ color: 'var(--color-pub-muted)' }"
        @click="emit('cancel')"
      >Batal</button>
    </div>
  </form>
</template>

<style scoped>
.pub-comment-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid;
  background: var(--color-pub-paper);
  padding: 8px 12px;
  font-family: var(--font-pub-sans);
  font-size: 13px;
  outline: none;
}
.pub-comment-input:focus {
  border-color: var(--color-pub-crimson);
}
</style>
