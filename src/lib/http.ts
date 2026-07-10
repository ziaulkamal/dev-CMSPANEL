/**
 * src/lib/http.ts
 * Axios client tunggal: inject Bearer, bongkar envelope, auto refresh-token pada 401.
 */
import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError, ApiSuccess } from '@/types/api';
import type { AuthTokens } from '@/types/domain';
import { tokenStore } from './tokenStore';
import { keysToSnake } from './caseConvert';

const baseURL = import.meta.env.VITE_API_BASE_URL;

/** Instance mentah; jangan dipakai langsung di komponen — pakai lewat services.
 *  timeout: cegah request menggantung tanpa batas bila backend tak terjangkau
 *  (gejala "halaman tak kunjung terbuka"); gagal cepat lalu tampilkan error. */
const raw: AxiosInstance = axios.create({ baseURL, timeout: 15_000 });

raw.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // CATATAN: body TIDAK dikonversi ke camelCase. Kontrak INPUT backend
  // dev-CMSCORE memakai snake_case (DTO: refresh_token, featured_media_id,
  // co_author_ids, alt_text, …) dengan forbidNonWhitelisted → camelCase DITOLAK
  // 422. Payload frontend sudah snake_case, jadi dikirim apa adanya. (Output
  // backend camelCase tetap dikonversi ke snake_case di interceptor response.)
  return config;
});

// Response camelCase→snake_case agar seluruh frontend (tipe domain snake_case)
// tak perlu diubah. `meta.next_cursor` yang sudah snake_case tetap aman (idempoten).
// Hanya envelope JSON biasa yang dikonversi; blob/arraybuffer dilewati.
raw.interceptors.response.use((res) => {
  const ct = String(res.headers?.['content-type'] ?? '');
  const isJson = ct.includes('application/json');
  if (isJson && res.data && typeof res.data === 'object') {
    res.data = keysToSnake(res.data);
  }
  return res;
});

/** Refresh token sekali pakai (rotation); cegah badai refresh paralel. */
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh_token = tokenStore.refresh;
  if (!refresh_token) return null;
  try {
    // Panggilan mentah (bukan `raw`) agar tak memicu rekursi refresh. Kirim
    // body snake_case apa adanya (kontrak input backend), baca balik snake_case.
    const res = await axios.post<ApiSuccess<unknown>>(
      `${baseURL}/auth/refresh`,
      { refresh_token },
    );
    const tokens = keysToSnake<ApiSuccess<AuthTokens>>(res.data).data;
    tokenStore.set(tokens);
    return tokens.access_token;
  } catch {
    tokenStore.clear();
    return null;
  }
}

raw.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };
    const code = error.response?.data?.error?.code;
    const isAuthCall = original.url?.includes('/auth/');

    if (code === 'UNAUTHORIZED' && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return raw(original);
      }
      // Refresh gagal → hanya paksa ke /login bila sedang di area admin.
      // Di halaman publik, 401 dari suatu call dibiarkan gagal diam-diam agar
      // pengunjung anonim TIDAK ikut ter-redirect ke login (mis. saat membuka '/').
      if (window.location.pathname.startsWith('/admin')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

/** Helper terketik: kembalikan `data` dari envelope sukses. */
export const http = {
  async get<T>(url: string, params?: object): Promise<T> {
    const res = await raw.get<ApiSuccess<T>>(url, { params });
    return res.data.data;
  },
  /** Versi yang mempertahankan `meta` (untuk listing cursor). */
  async getList<T>(url: string, params?: object): Promise<ApiSuccess<T>> {
    const res = await raw.get<ApiSuccess<T>>(url, { params });
    return res.data;
  },
  async post<T>(url: string, body?: unknown): Promise<T> {
    const res = await raw.post<ApiSuccess<T>>(url, body);
    return res.data.data;
  },
  async put<T>(url: string, body?: unknown): Promise<T> {
    const res = await raw.put<ApiSuccess<T>>(url, body);
    return res.data.data;
  },
  async patch<T>(url: string, body?: unknown): Promise<T> {
    const res = await raw.patch<ApiSuccess<T>>(url, body);
    return res.data.data;
  },
  async delete<T>(url: string, params?: object): Promise<T> {
    const res = await raw.delete<ApiSuccess<T>>(url, { params });
    return res.data.data;
  },
  /** Upload multipart (mis. media). */
  async upload<T>(url: string, form: FormData): Promise<T> {
    const res = await raw.post<ApiSuccess<T>>(url, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
