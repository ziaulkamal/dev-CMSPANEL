# dev-CMSPANEL — Frontend PANEL CMS

Aplikasi **SPA** (Vue 3 + Vite + TypeScript + Tailwind v4) untuk backend headless
**dev-CMSCORE** (REST API `/v1`). Satu app, dua segment: **PUBLIC** (pembaca) &
**ADMIN** (dashboard redaksi). Arsitektur detail: lihat [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Prasyarat

- **Node 22** + **pnpm** (via `corepack enable`) — untuk run di host.
- **Podman** (`podman machine start` di Windows) — untuk run via container.
- Backend **dev-CMSCORE** berjalan di `http://localhost:3000` (lihat README repo itu).

---

## Konfigurasi environment

Satu variabel, **dibaca saat build/serve** (prefix `VITE_` wajib):

```bash
cp .env.example .env
```

```ini
# .env
VITE_API_BASE_URL=http://localhost:3000/v1
```

> **Penting:** `VITE_API_BASE_URL` di-*bake* ke bundle **saat build** dan dipanggil dari
> **browser**, bukan dari dalam container. Karena itu nilainya selalu URL yang bisa
> dijangkau browser (mis. `http://localhost:3000/v1` saat dev, atau domain API saat prod) —
> **bukan** nama service container seperti `http://api:3000`.

---

## A. Menjalankan di host (tanpa container)

```bash
pnpm install
pnpm run dev          # http://localhost:5173 (hot-reload)
```

Perintah lain:

| Perintah              | Fungsi |
|-----------------------|--------|
| `pnpm run dev`        | Dev server Vite + hot-reload |
| `pnpm run build`      | Type-check (`vue-tsc`) + build produksi ke `dist/` |
| `pnpm run preview`    | Pratinjau hasil `dist/` secara lokal |
| `pnpm run type-check` | Cek TypeScript tanpa emit |
| `pnpm run lint`       | ESLint + autofix |

---

## B. Menjalankan dengan Podman — DEV (hot-reload)

Image dev (`Dockerfile`, default) hanya menyiapkan toolchain + deps; **source di-mount**
sebagai volume sehingga hot-reload aktif (lihat `compose.yaml`).

```powershell
# pastikan mesin Podman hidup
podman machine start

# build & jalankan dev server di container
podman compose up -d --build
```

- Panel: <http://localhost:5173>
- Browser memanggil API di `http://localhost:3000/v1` (port backend yang ter-publish),
  jadi backend dev-CMSCORE cukup berjalan di host/compose-nya sendiri — tidak perlu
  jaringan container bersama untuk dev.
- `CHOKIDAR_USEPOLLING=true` sudah diset agar file-watch andal di volume mount Windows.
- **Setelah menambah dependency** (`pnpm add ...`), rebuild image: `podman compose up -d --build`
  (node_modules ter-bake di image, bukan di mount).

> ⚠️ **podman-compose 1.6.0** mengabaikan key `build.dockerfile`. Karena itu `Dockerfile`
> default sengaja dibuat = image **DEV (Vite)**, agar `podman compose up --build` benar.
> Image **PROD** ada di `Dockerfile.prod` (lihat bawah). Bila container malah menyajikan
> Nginx di 5173 (ERR_EMPTY_RESPONSE), berarti image lama prod — `podman compose down` lalu
> `podman rmi cms-panel-dev` dan `up -d --build` ulang.

Hentikan: `podman compose down`.

---

## C. Menjalankan dengan Podman — PROD (build statis + Nginx)

Build produksi bersifat **multi-stage** (`Dockerfile.prod`): bundle Vite di-compile lalu
disajikan **Nginx** dengan fallback SPA history-mode (lihat `Dockerfile.prod` + `docker/nginx.conf`).

### Cara andal — build & run manual (disarankan untuk podman-compose 1.6.0)

```powershell
podman build -f Dockerfile.prod `
  --build-arg VITE_API_BASE_URL=https://api.domain-anda.com/v1 `
  -t cms-panel .

podman run -d -p 8080:80 --name cms-panel cms-panel
```

Panel produksi: <http://localhost:8080>. Hentikan: `podman rm -f cms-panel`.

### Via compose (hanya bila pakai Docker Compose asli / podman-compose yang sudah fix)

```powershell
$env:VITE_API_BASE_URL = "https://api.domain-anda.com/v1"
podman compose -f compose.prod.yaml up -d --build
```

> ⚠️ podman-compose 1.6.0 mengabaikan `dockerfile`, sehingga compose prod bisa salah
> membangun image DEV. Pakai **build manual `-f Dockerfile.prod`** di atas untuk andal.
> Karena `VITE_API_BASE_URL` di-*bake* saat build, **bangun ulang image** bila URL backend berubah.

---

## Ringkasan port

| Lingkungan        | Panel                  | Backend API            |
|-------------------|------------------------|------------------------|
| Host / Podman dev | `localhost:5173`       | `localhost:3000/v1`    |
| Podman prod       | `localhost:8080`       | sesuai `VITE_API_BASE_URL` |

---

## Struktur singkat

```
src/
├─ types/       kontrak API & domain
├─ lib/         http (axios + refresh), queryClient, tokenStore
├─ services/    pintu tunggal ke API per modul
├─ stores/      pinia (auth + capabilities)
├─ composables/ useTheme, useToast, useSeoMeta
├─ router/      route group public/admin + guards
├─ layouts/     PublicLayout, AuthLayout, AdminLayout
├─ components/ui primitives (Button, Input, Table, Modal, …)
└─ features/    public/* & admin/* (views per domain)
```

Selengkapnya: [`ARCHITECTURE.md`](./ARCHITECTURE.md).
