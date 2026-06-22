# dev-CMSPANEL — Arsitektur Frontend

Frontend **PANEL** untuk backend headless **dev-CMSCORE** (NestJS REST `/v1`).
Satu aplikasi SPA, dua segment: **PUBLIC** (pembaca) dan **ADMIN** (dashboard redaksi).

> Acuan kontrak API: `dev-CMSCORE/FRONTEND-API.md`. Sumber komponen UI:
> repo `Laravel-Vue-Starter-E-GOV` (Vue 3 + TS + Tailwind v4) — diadopsi tanpa Inertia.

## Keputusan kunci

| Area | Keputusan |
|---|---|
| Framework | Vue 3 (Composition API) + Vite |
| Bahasa | TypeScript strict |
| Styling | Tailwind v4 (CSS-first), token di `src/assets/app.css` |
| Routing | vue-router (menggantikan Inertia di repo asal) |
| State lokal/global | Pinia (`stores/auth`) |
| Server state | TanStack Query (`@tanstack/vue-query`) |
| HTTP | axios single client + interceptor refresh-token |
| Struktur app | Satu app, dua segment via route group `(public)` & `/admin` |
| Rendering | SPA (CSR) dulu; SEO/SSG menyusul |

## Pattern: Layered SPA, feature-based

```
presentation (layouts, features/*/views, components/ui)
        │  depends on ↓
application (stores, composables)
        │  depends on ↓
data (services/*, lib/http)
        │  depends on ↓
types (api, domain)
```

Dependency **menunjuk ke dalam**. Aturan keras:
- Komponen **tidak pernah** memanggil `axios`/`fetch` langsung — selalu via `services/`.
- `components/ui` & `lib` bersifat shared, **tidak boleh** depend balik ke `features/`.
- Tidak ada business logic di template — hitung dulu (computed/composable), render kemudian.

## Peta folder

```
src/
├─ types/        api.ts (envelope, error, pagination) · domain.ts (Content, Me, Capability…)
├─ lib/          http.ts (axios+refresh) · tokenStore.ts · queryClient.ts
├─ services/     auth.service.ts · content.service.ts · (media, taxonomy, … menyusul)
├─ stores/       auth.ts (token + me + can())
├─ composables/  useToast.ts · useTheme.ts · (useCapability menyusul)
├─ router/       index.ts (route group) · guards.ts (requireAuth + capability)
├─ layouts/      PublicLayout · AuthLayout · AdminLayout
├─ components/ui/ BaseButton · ToastHost · (Input, Card, Modal, Table… adopsi repo)
└─ features/
   ├─ public/    home · article · (category, author, comments menyusul)
   └─ admin/     auth · dashboard · contents · (media, taxonomy, authors,
                 comments, users, settings, redirects, webhooks, audit menyusul)
```

## Kontrak data ke API

- **Envelope**: sukses `{data, meta?}`, error `{error:{code,message,details?}}`.
  `lib/http.ts` otomatis membongkar `data`; `getList` mempertahankan `meta` untuk cursor.
- **Auth flow**: login → simpan access+refresh. Pada `401 UNAUTHORIZED`, interceptor
  memanggil `POST /auth/refresh` (rotation, sekali pakai) lalu retry; gagal → `/login`.
- **Guard UI**: capabilities dari `GET /auth/me` → `authStore.can(cap)` menyembunyikan
  menu/tombol; `router/guards.ts` menegakkan per-route via `meta.capability`.
- **Pagination**: cursor (`meta.next_cursor`), bukan page-number.

## Adopsi komponen dari repo Laravel-Vue-Starter-E-GOV

| Dari repo | Aksi | Status |
|---|---|---|
| `Components/App/*` (45 komponen) | Disalin ke `src/components/app/` apa adanya | ✅ |
| `Components/Dashboard/*` (6 widget chart.js) | Disalin ke `src/components/dashboard/` | ✅ |
| `Composables/useTheme,useToast` | Diadopsi ke `src/composables/` | ✅ |
| `Layouts/BaseLayout` | Disalin ke `src/layouts/`; jadi shell `AdminLayout` | ✅ |
| `css/app.css` (token, dark mode, fonts) | Diadopsi ke `src/assets/app.css` (buang `@source` Laravel) | ✅ |
| `data/navGroups`, `config/layout` | Disalin; menu admin kustom di `src/data/adminNav.ts` | ✅ |
| `Pages/*` (Inertia) | TIDAK disalin — diganti `features/*/views` + TanStack Query | ✅ |

**Adaptasi Inertia → vue-router:** `AppSidebar` (`usePage`→`useRoute`), `AppBreadcrumb` &
`NavItem` (`<Link>`/`<a href>`→`<RouterLink>`/`:to`). Ikon dari `@lucide/vue`.

**Catatan type-check:** komponen vendor ditandai `// @ts-nocheck` (punya isu type di
aturan strict kita) sehingga `vue-tsc` ketat tetap berlaku untuk kode kita, tanpa
diblokir noise vendor. Build memakai `vue-tsc --noEmit && vite build` (tidak emit JS).

## Gap backend yang ditemukan (perlu follow-up di dev-CMSCORE)

Listing `GET /contents` mem-whitelist param **hanya** `type, status, cursor, limit, sort`
(`list-content.query.ts`). Konsekuensi di FE:
- **Tidak ada lookup by-slug** → ArticleView pakai route `/artikel/:id/:slug?` (by id; slug hiasan SEO).
  Rekomendasi backend: tambah `GET /contents/by-slug/:slug` atau param `?slug=`.
- **Tidak ada filter `term`/`author`** → halaman kategori/penulis belum bisa filter di server.
  Rekomendasi backend: tambah param `?term=` & `?author=` di listing.

## Rencana implementasi (urut)

1. ✅ Fondasi: config, http+refresh, auth store, router+guards, layouts, token.
2. Adopsi UI primitives dari repo (Input, Select, Card, Modal, Table, Badge, Pagination).
3. PUBLIC: ArticleView (detail+meta SEO+komentar), listing kategori, infinite scroll cursor.
4. ADMIN konten: editor CRUD + transition (state machine) + article lock (heartbeat).
5. ADMIN media: library + uploader multipart.
6. ADMIN sisanya: taxonomy, authors, comments (moderasi), users/RBAC, settings, redirects, webhooks, audit.
7. SEO: meta dinamis per route; prerender/SSG bila perlu.
```
