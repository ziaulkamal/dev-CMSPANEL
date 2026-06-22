/**
 * src/services/dashboard.service.ts
 * Ringkasan dashboard (metrik difilter capability oleh backend).
 */
import { http } from '@/lib/http';

export interface AuditEntry {
  id: string;
  action: string;
  target_type?: string | null;
  created_at: string;
}

/** Bentuk longgar: field hadir sesuai capability pemanggil. */
export interface DashboardSummary {
  content_by_status?: Record<string, number>;
  my_content_by_status?: Record<string, number>;
  pending_comments?: number;
  media_count?: number;
  user_count?: number;
  banned_users?: number;
  recent_audit?: AuditEntry[];
}

export const dashboardService = {
  summary() {
    return http.get<DashboardSummary>('/dashboard/summary');
  },
};
