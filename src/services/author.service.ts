/**
 * src/services/author.service.ts
 * Author byline (manage_users untuk tulis).
 */
import { http } from '@/lib/http';
import type { Author } from '@/types/domain';

export interface AuthorPayload {
  display_name: string;
  bio?: string;
  avatar_media_id?: string | null;
  social_links?: Record<string, string>;
}

export const authorService = {
  list() {
    return http.get<Author[]>('/authors');
  },
  create(payload: AuthorPayload) {
    return http.post<Author>('/authors', payload);
  },
  update(id: string, payload: Partial<AuthorPayload>) {
    return http.put<Author>(`/authors/${id}`, payload);
  },
};
