<!--
  src/features/admin/authors/AuthorListView.vue
  Manajer penulis (byline): daftar + tambah/edit via modal. Service authorService
  hanya menyediakan list/create/update (tanpa delete — lihat TODOS arah CORE).
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { UserCircle } from '@lucide/vue';
import { authorService } from '@/services/author.service';
import { resolveMediaUrl } from '@/lib/media';
import { useIsMobile } from '@/composables/useIsMobile';
import type { Author } from '@/types/domain';
import AppCard from '@/components/app/AppCard.vue';
import AppButton from '@/components/app/AppButton.vue';
import AppEmptyState from '@/components/app/AppEmptyState.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import AuthorFormModal from './AuthorFormModal.vue';

const isMobile = useIsMobile();
const queryClient = useQueryClient();
const KEY = ['admin-authors'] as const;

const authorsQuery = useQuery({ queryKey: KEY, queryFn: () => authorService.list() });
const authors = computed<Author[]>(() => authorsQuery.data.value ?? []);

const modalOpen = ref(false);
const editTarget = ref<Author | null>(null);

function openCreate(): void {
  editTarget.value = null;
  modalOpen.value = true;
}
function openEdit(a: Author): void {
  editTarget.value = a;
  modalOpen.value = true;
}
function onSaved(): void {
  void queryClient.invalidateQueries({ queryKey: KEY });
}
function avatarUrl(a: Author): string {
  return a.avatar_media_id ? resolveMediaUrl(a.avatar_media_id) : '';
}
function socialCount(a: Author): number {
  return Object.keys(a.social_links ?? {}).length;
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Penulis</h1>
        <p class="mt-1 text-sm text-text-muted">Kelola profil byline: nama, bio, avatar, sosial.</p>
      </div>
      <Teleport to="#admin-action-bar" :disabled="!isMobile">
        <AppButton variant="primary" @click="openCreate">Tambah Penulis</AppButton>
      </Teleport>
    </header>

    <div v-if="authorsQuery.isLoading.value" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <AppEmptyState
      v-else-if="!authors.length"
      title="Belum ada penulis"
      description="Tambahkan profil penulis pertama melalui tombol di atas."
      :icon="UserCircle"
    >
      <AppButton variant="primary" @click="openCreate">Tambah Penulis</AppButton>
    </AppEmptyState>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AppCard v-for="a in authors" :key="a.id" padding="md">
        <div class="flex items-start gap-3">
          <img
            v-if="avatarUrl(a)"
            :src="avatarUrl(a)"
            :alt="a.display_name"
            class="h-12 w-12 flex-none rounded-full object-cover"
          />
          <span
            v-else
            class="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-bg-subtle text-text-muted"
          >
            <UserCircle :size="24" />
          </span>
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-sm font-semibold text-text-primary">{{ a.display_name }}</h3>
            <p class="mt-0.5 line-clamp-2 text-xs text-text-muted">{{ a.bio || 'Tanpa bio' }}</p>
            <p class="mt-1 text-[11px] text-text-subtle">{{ socialCount(a) }} tautan sosial</p>
          </div>
        </div>
        <div class="mt-3 flex justify-end">
          <AppButton variant="secondary" size="xs" @click="openEdit(a)">Edit</AppButton>
        </div>
      </AppCard>
    </div>

    <AuthorFormModal v-model="modalOpen" :author="editTarget" @saved="onSaved" />
  </section>
</template>
