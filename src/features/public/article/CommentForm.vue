<!-- src/features/public/article/CommentForm.vue — form kirim komentar tamu (handle 429). -->
<script setup lang="ts">
import { ref } from 'vue';
import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { commentService } from '@/services/comment.service';
import { useToast } from '@/composables/useToast';
import type { ApiError } from '@/types/api';
import AppInput from '@/components/app/AppInput.vue';
import AppTextarea from '@/components/app/AppTextarea.vue';
import AppButton from '@/components/app/AppButton.vue';

const props = defineProps<{ contentId: string }>();
const toast = useToast();
const queryClient = useQueryClient();

const guestName = ref('');
const guestEmail = ref('');
const body = ref('');

const { mutate, isPending } = useMutation({
  mutationFn: () =>
    commentService.create(props.contentId, {
      body: body.value,
      guest_name: guestName.value,
      guest_email: guestEmail.value,
    }),
  onSuccess: () => {
    toast.success('Komentar terkirim, menunggu moderasi.');
    body.value = '';
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
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="mutate()">
    <div class="grid gap-3 sm:grid-cols-2">
      <AppInput v-model="guestName" label="Nama" required />
      <AppInput v-model="guestEmail" label="Email" type="email" required />
    </div>
    <AppTextarea v-model="body" label="Komentar" :rows="3" required />
    <div>
      <AppButton type="submit" variant="primary" :loading="isPending">Kirim komentar</AppButton>
    </div>
  </form>
</template>
