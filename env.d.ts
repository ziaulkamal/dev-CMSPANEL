/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL backend CMS Core, mis. http://localhost:3000/v1 */
  readonly VITE_API_BASE_URL: string;
  /**
   * Base URL publik untuk berkas media (MinIO/S3), mis. http://localhost:9000/media.
   * Dipakai hanya bila backend mengembalikan key/path relatif, bukan URL absolut.
   * Opsional — kosongkan bila file_url sudah absolut.
   */
  readonly VITE_MEDIA_BASE_URL?: string;
  /** "true" → beranda publik memakai dummy data JSON; selain itu ambil dari API. */
  readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
