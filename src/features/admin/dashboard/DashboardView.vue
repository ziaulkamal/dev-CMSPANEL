<!--
  src/features/admin/dashboard/DashboardView.vue
  Ringkasan redaksi per role (req #4): kartu metrik kondisional + audit terbaru.
  Backend sudah memfilter metrik sesuai capability; FE render apa yang tersedia.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { FileText, MessageSquare, Image, Users, Ban, Clock } from '@lucide/vue';
import { dashboardService } from '@/services/dashboard.service';
import { useAuthStore } from '@/stores/auth';
import { daysAgo } from '@/lib/datetime';
import AppCard from '@/components/app/AppCard.vue';
import AppSpinner from '@/components/app/AppSpinner.vue';
import KpiCard from '@/components/dashboard/KpiCard.vue';

const auth = useAuthStore();

const summaryQuery = useQuery({
  queryKey: ['dashboard-summary'],
  queryFn: () => dashboardService.summary(),
});

const summary = computed(() => summaryQuery.data.value ?? {});

/** Jumlahkan map status (mis. content_by_status) jadi total. */
function totalOf(map?: Record<string, number>): number {
  return map ? Object.values(map).reduce((a, b) => a + b, 0) : 0;
}

const contentMap = computed(() => summary.value.content_by_status ?? summary.value.my_content_by_status);
const contentScopeLabel = computed(() =>
  summary.value.content_by_status ? 'Total konten' : 'Konten saya',
);

import { markRaw, type Component } from 'vue';

interface Kpi {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: Component;
}

/** KpiCard.icon bertipe longgar (vendor) → bungkus agar binding aman. */
function asIcon(icon: Component): null {
  return markRaw(icon) as unknown as null;
}

const kpis = computed<Kpi[]>(() => {
  const s = summary.value;
  const out: Kpi[] = [];
  if (contentMap.value) {
    out.push({
      label: contentScopeLabel.value,
      value: String(totalOf(contentMap.value)),
      sub: `${contentMap.value['published'] ?? 0} terbit · ${contentMap.value['draft'] ?? 0} draft`,
      color: '#6366f1',
      icon: FileText,
    });
    if (contentMap.value['pending_review']) {
      out.push({
        label: 'Menunggu review',
        value: String(contentMap.value['pending_review']),
        color: '#f59e0b',
        icon: Clock,
      });
    }
  }
  if (s.pending_comments !== undefined) {
    out.push({
      label: 'Komentar pending',
      value: String(s.pending_comments),
      color: '#f59e0b',
      icon: MessageSquare,
    });
  }
  if (s.media_count !== undefined) {
    out.push({ label: 'Media', value: String(s.media_count), color: '#10b981', icon: Image });
  }
  if (s.user_count !== undefined) {
    out.push({ label: 'User', value: String(s.user_count), color: '#3b82f6', icon: Users });
  }
  if (s.banned_users) {
    out.push({ label: 'User diban', value: String(s.banned_users), color: '#ef4444', icon: Ban });
  }
  return out;
});

function auditLabel(action: string): string {
  const map: Record<string, string> = {
    'user.ban': 'Ban user',
    'user.unban': 'Cabut ban user',
  };
  return map[action] ?? action;
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-text-primary">Dashboard</h1>
      <p class="mt-1 text-sm text-text-muted">
        Selamat datang, {{ auth.me?.display_name || auth.me?.email }}.
        <span class="text-text-subtle">({{ auth.me?.roles.join(', ') }})</span>
      </p>
    </header>

    <div v-if="summaryQuery.isLoading.value" class="flex justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <template v-else>
      <div v-if="kpis.length" class="kpi-grid">
        <KpiCard
          v-for="kpi in kpis"
          :key="kpi.label"
          :label="kpi.label"
          :value="kpi.value"
          :sub="kpi.sub"
          :color="kpi.color"
          :icon="asIcon(kpi.icon)"
        />
      </div>

      <!-- Audit terbaru (admin) -->
      <AppCard v-if="summary.recent_audit?.length" padding="lg">
        <template #header>
          <span class="text-sm font-semibold text-text-primary">Aktivitas Terbaru</span>
        </template>
        <ul class="flex flex-col divide-y divide-border">
          <li
            v-for="entry in summary.recent_audit"
            :key="entry.id"
            class="flex items-center justify-between py-2.5"
          >
            <span class="text-sm text-text-primary">{{ auditLabel(entry.action) }}</span>
            <span class="text-xs text-text-subtle">{{ daysAgo(entry.created_at) }}</span>
          </li>
        </ul>
      </AppCard>
    </template>
  </section>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
</style>
