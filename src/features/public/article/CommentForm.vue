<!-- src/features/public/article/CommentForm.vue — form komentar tamu modern: Nama, Email, No. WhatsApp + isi. -->
<script setup lang="ts">
import { ref } from 'vue';
import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { commentService } from '@/services/comment.service';
import { useToast } from '@/composables/useToast';
import { USE_MOCK } from '@/features/public/data/homeSource';
import type { ApiError } from '@/types/api';
import AppInput from '@/components/app/AppInput.vue';
import AppTextarea from '@/components/app/AppTextarea.vue';
import AppButton from '@/components/app/AppButton.vue';

const props = defineProps<{ contentId: string }>();
const emit = defineEmits<{
  (e: 'posted', payload: { name: string; email: string; whatsapp: string; body: string }): void;
}>();

const toast = useToast();
const queryClient = useQueryClient();

const guestName = ref('');
const guestEmail = ref('');
const whatsapp = ref('');
const body = ref('');

function resetForm(): void {
  body.value = '';
  whatsapp.value = '';
}

/**
 * Email & WhatsApp belum disimpan backend → di mode mock kita tampilkan optimistik
 * via emit. Di mode live tetap kirim payload yang didukung (body + guest_name + email).
 */
const { mutate, isPending } = useMutation({
  mutationFn: () =>
    commentService.create(props.contentId, {
      body: body.value,
      guest_name: guestName.value,
      guest_email: guestEmail.value,
    }),
  onSuccess: () => {
    toast.success('Komentar terkirim, menunggu moderasi.');
    resetForm();
    queryClient.invalidateQueries({ queryKey: ['comments', props.contentId] });
  },
  onError: (err) => {
    const code = (err as AxiosError<ApiError>).response?.data?.error?.code;
    toast.error(
      code === 'RATE_LIMITED'
        ? 'Terlalu sering mengirim. Coba lagi sebentar.'
        : 'Gagal mengirim komentar.',
    );
  },
});

function submit(): void {
  if (!body.value.trim() || !guestName.value.trim()) return;
  emit('posted', {
    name: guestName.value.trim(),
    email: guestEmail.value.trim(),
    whatsapp: whatsapp.value.trim(),
    body: body.value.trim(),
  });
  if (USE_MOCK) {
    toast.success('Komentar terkirim.');
    resetForm();
  } else {
    mutate();
  }
}
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="submit">
    <div class="grid gap-3 sm:grid-cols-3">
      <AppInput v-model="guestName" label="Nama" required />
      <AppInput v-model="guestEmail" label="Email" type="email" required />
      <AppInput v-model="whatsapp" label="No. WhatsApp" inputmode="tel" />
    </div>
    <AppTextarea v-model="body" label="Komentar" :rows="3" required />
    <div>
      <AppButton type="submit" variant="primary" :loading="isPending">Kirim komentar</AppButton>
    </div>
  </form>
</template>
