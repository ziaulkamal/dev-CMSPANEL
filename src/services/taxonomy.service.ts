/**
 * src/services/taxonomy.service.ts
 * Taxonomy & term: listing publik + tulis (manage_settings).
 */
import { http } from '@/lib/http';
import type { Taxonomy, Term } from '@/types/domain';

export const taxonomyService = {
  list() {
    return http.get<Taxonomy[]>('/taxonomies');
  },
  create(payload: { slug: string; label: string; hierarchical?: boolean }) {
    return http.post<Taxonomy>('/taxonomies', payload);
  },
  update(slug: string, payload: { label?: string; hierarchical?: boolean }) {
    return http.put<Taxonomy>(`/taxonomies/${slug}`, payload);
  },
  remove(slug: string) {
    return http.delete<{ id: string }>(`/taxonomies/${slug}`);
  },
  terms(slug: string) {
    return http.get<Term[]>(`/taxonomies/${slug}/terms`);
  },
  createTerm(slug: string, payload: { name: string; slug?: string; parent_id?: string | null }) {
    return http.post<Term>(`/taxonomies/${slug}/terms`, payload);
  },
  updateTerm(
    slug: string,
    id: string,
    payload: { name?: string; slug?: string; description?: string; parent_id?: string | null },
  ) {
    return http.put<Term>(`/taxonomies/${slug}/terms/${id}`, payload);
  },
  removeTerm(slug: string, id: string) {
    return http.delete<{ id: string }>(`/taxonomies/${slug}/terms/${id}`);
  },
};
