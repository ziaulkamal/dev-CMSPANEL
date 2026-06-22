<!-- src/features/admin/contents/EditorialActions.vue — tombol transisi editorial legal + gate capability. -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import AppButton from '@/components/app/AppButton.vue';
import AppInput from '@/components/app/AppInput.vue';
import AppModal from '@/components/app/AppModal.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import { useAuthStore } from '@/stores/auth';
import type { ContentStatus } from '@/types/domain';
import { STATUS_TRANSITIONS, TRANSITION_LABEL } from './editor.config';

const props = defineProps<{
  status: ContentStatus;
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{ transition: [to: ContentStatus, publishedAt?: string] }>();

const auth = useAuthStore();

/** Transisi yang butuh publish_post (penerbitan / penjadwalan / arsip). */
const PUBLISH_GATED: ReadonlyArray<ContentStatus> = ['scheduled', 'published', 'archived'];
/** Transisi yang butuh delete_post (buang / pulihkan dari sampah). */
const DELETE_GATED: ReadonlyArray<ContentStatus> = ['trashed'];

function canTransition(to: ContentStatus): boolean {
  if (PUBLISH_GATED.includes(to)) return auth.can('publish_post');
  if (DELETE_GATED.includes(to)) return auth.can('delete_post');
  // Pulihkan dari sampah (trashed → draft) digerbang delete_post.
  if (props.status === 'trashed') return auth.can('delete_post');
  return true;
}

const allowedTransitions = computed<ContentStatus[]>(() =>
  [...STATUS_TRANSITIONS[props.status]].filter(canTransition),
);

function buttonVariant(to: ContentStatus): string {
  if (to === 'published') return 'success';
  if (to === 'trashed') return 'danger';
  if (to === 'scheduled') return 'primary';
  return 'secondary';
}

// Penjadwalan butuh published_at di masa depan via modal.
const showSchedule = ref(false);
const scheduledAt = ref('');
const scheduleError = ref('');

function onClick(to: ContentStatus): void {
  if (to === 'scheduled') {
    scheduledAt.value = '';
    scheduleError.value = '';
    showSchedule.value = true;
    return;
  }
  emit('transition', to);
}

function confirmSchedule(): void {
  if (!scheduledAt.value) {
    scheduleError.value = 'Waktu tayang wajib diisi.';
    return;
  }
  if (new Date(scheduledAt.value).getTime() <= Date.now()) {
    scheduleError.value = 'Waktu tayang harus di masa depan.';
    return;
  }
  emit('transition', 'scheduled', new Date(scheduledAt.value).toISOString());
  showSchedule.value = false;
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-2 text-sm text-text-muted">
      <span>Status:</span>
      <StatusBadge :status="status" />
    </div>

    <div class="ml-auto flex flex-wrap gap-2">
      <p v-if="!allowedTransitions.length" class="text-sm text-text-subtle">
        Tidak ada aksi tersedia.
      </p>
      <AppButton
        v-for="to in allowedTransitions"
        :key="to"
        :variant="buttonVariant(to)"
        size="sm"
        :loading="loading"
        :disabled="disabled"
        @click="onClick(to)"
      >
        {{ TRANSITION_LABEL[to] }}
      </AppButton>
    </div>

    <AppModal v-model="showSchedule" title="Jadwalkan Tayang">
      <AppInput
        v-model="scheduledAt"
        label="Waktu Tayang"
        type="datetime-local"
        required
        :error="scheduleError"
      />
      <template #footer>
        <AppButton variant="ghost" size="sm" @click="showSchedule = false">Batal</AppButton>
        <AppButton variant="primary" size="sm" :loading="loading" @click="confirmSchedule">
          Jadwalkan
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
