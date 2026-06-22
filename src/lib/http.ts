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

const baseURL = import.meta.env.VITE_API_BASE_URL;

/** Instance mentah; jangan dipakai langsung di komponen — pakai lewat services. */
const raw: AxiosInstance = axios.create({ baseURL });

raw.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Refresh token sekali pakai (rotation); cegah badai refresh paralel. */
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh_token = tokenStore.refresh;
  if (!refresh_token) return null;
  try {
    const res = await axios.post<ApiSuccess<AuthTokens>>(
      `${baseURL}/auth/refresh`,
      { refresh_token },
    );
    tokenStore.set(res.data.data);
    return res.data.data.access_token;
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
      // refresh gagal → arahkan ke login
      window.location.assign('/login');
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
