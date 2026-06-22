# Kajian Lanjutan: Taxonomy & Fondasi Admin → Public (Fase 2)

> Lanjutan dari INTEGRATION-PUBLIC-TO-ADMIN.md (§1–§8 sudah selesai).
> Fokus kajian ini: (A) pemanfaatan **taxonomy** yang belum punya opsi di admin,
> dan (B) **fondasi admin** yang sudah ada service/UI-nya tapi **belum tersambung**
> ke public. Ruang lingkup tetap public ↔ admin.

## Status simbol
- 🔴 fondasi ADA di satu sisi, **putus** ke sisi lain
- 🟠 terhubung sebagian / hanya jalan di mode mock
- 🧱 **terblokir kontrak backend** (butuh perubahan dev-CMSCORE, bukan FE)

---

## BAGIAN A — TAXONOMY (akar masalah yang Anda lihat)

### A1. Widget & Menu belum bisa memilih sumber "taxonomy term" — 🔴
**Temuan:** Saat menyusun **Widget** (`WidgetFormModal`) hanya ada mode `auto`
(by type/sort/limit) dan `manual` (pilih konten satu-satu). **Tidak ada opsi
"tarik konten dari kategori X"**. Padahal:
- `taxonomyService.terms(slug)` sudah tersedia.
- `MenuBuilderView` SUDAH memakai term (`taxonomyService.terms('category')`) untuk
  membuat item menu kategori — jadi polanya sudah terbukti, tinggal dipakai ulang.

**Kenapa belum ada:** mode `auto` widget sengaja dibatasi `type/sort/limit` karena
**backend listing tidak menerima filter `term`** (lihat A4/🧱). Jadi "widget per
kategori" tak bisa difilter di server saat ini.

**Opsi solusi:**
1. **(Direkomendasikan, jalan sekarang)** Tambah mode sumber ketiga di widget:
   `taxonomy` → admin pilih taxonomy + term (pakai `taxonomyService`). Sementara
   backend belum punya filter term, **resolve di klien**: tarik feed `type` lalu
   saring berdasarkan `terms` pada tiap konten. Konsekuensi: butuh field `terms`
   ikut di listing (cek A4) atau ambil detail — kurang efisien tapi fungsional.
2. **(Ideal, setelah backend)** begitu `GET /contents?term=` ada, mode `taxonomy`
   cukup memetakan ke query param. Kode FE siap diubah minimal.

**Aksi FE:** `WidgetSourceMode` + `'taxonomy'`; tambah `taxonomy_slug` & `term_id`
di `WidgetAutoConfig` (atau struktur `taxonomy` terpisah). UI: dua `AppSelect`
(taxonomy → term) memuat via `taxonomyService`. Pemilih term ini **juga** dipakai
ulang untuk SecondaryNav (A2).

### A2. SecondaryNav idealnya bisa "otomatis dari taxonomy" — 🟠
**Temuan:** SecondaryNav kini baca menu lokasi `secondary` (hasil §2). Tapi isinya
harus disusun manual item-per-item. Mock lama justru memperlihatkan maksud asli:
deretan **kategori**. 
**Aksi:** beri opsi di MenuBuilder (lokasi secondary) tombol "Isi otomatis dari
taxonomy" → generate item dari `taxonomyService.terms('category')`. Murni FE,
reuse pola yang sudah ada di MenuBuilder.

### A3. TaxonomyView / InfographicsView / AuthorView / Search — live = TODO — 🟠🧱
**Temuan:** keempat halaman ini **hanya jalan di mode mock**; live mode ditandai
TODO di komentar masing-masing:
- `TaxonomyView.vue` — "Live: TODO (taxonomyService.terms + filter konten per term)"
- `InfographicsView.vue` — "Live: TODO filter konten kategori infografis"
- `AuthorView.vue` — "Live: TODO wiring authorService.list + filter konten per author"
- `search/useSearch.ts` — live: ambil feed lalu filter judul di klien (tanpa `q`)

**Akar yang sama:** listing backend tak punya filter `term`/`author`/`q` (A4).
**Aksi FE sekarang (parsial):** untuk kategori/infografis/author bisa dipakai pola
"tarik feed lalu saring di klien" (seperti search), agar live tidak kosong —
dengan catatan tidak ideal untuk dataset besar.

### A4. 🧱 BLOKER BACKEND — filter listing
`GET /contents` hanya whitelist `type, status, cursor, limit, sort`
(dikonfirmasi di ARCHITECTURE.md & content.service.ts). Yang dibutuhkan public:
- `?term=` / `?taxonomy=&term=` → kategori, infografis, widget taxonomy
- `?author=` → halaman penulis
- `?q=` → pencarian relevan server-side
- `GET /contents/by-slug/:slug` → ArticleView pakai id (slug hiasan)
> Ini bukan pekerjaan FE; dicatat agar saat backend siap, wiring tinggal disambung.

---

## BAGIAN B — FONDASI ADMIN YANG BELUM TERSAMBUNG

### B1. Authors — service ADA, **UI admin TIDAK ADA** — 🔴
**Temuan:**
- `author.service.ts` punya `list/create/update`.
- Dipakai di `ContentEditorView` (pilih byline) & `AuthorView` (public).
- **Tidak ada** `features/admin/authors/` dan **tidak ada** route/nav admin.
**Dampak:** redaksi tak bisa membuat/menyunting profil penulis (nama, bio, avatar,
social_links) dari panel. Halaman penulis publik (`/penulis/:id`) tak punya sumber
data identitas penulis selain yang menempel di konten.
**Aksi:** buat modul admin Authors (List + Form: display_name, bio, avatar via
FeaturedImagePicker, social_links) + route `/admin/authors` + entri nav. Service
sudah siap; murni UI. AuthorView lalu baca `authorService` untuk header penulis.

### B2. Halaman penulis publik tak menampilkan profil penulis — 🔴
**Temuan:** `AuthorView` hanya menyaring story per author (mock), tak menampilkan
bio/avatar/sosial. Setelah B1, header penulis (avatar + bio + tautan sosial) bisa
diisi dari `authorService`.
**Aksi:** tambah header profil di AuthorView (sumber: authorService.list lalu cari
by id/slug). Selaras dengan ArticleAuthor.vue yang sudah menampilkan byline.

### B3. ArticleView memakai kategori "menempel di konten", bukan terms asli — 🟠🧱
**Temuan:** `ArticleView` membaca `story.category`/`category_slug`/`category_color`
(field mock), bukan `content.terms[]` (tipe domain `Content.terms: Term[]` ADA).
Breadcrumb & tautan kategori artikel mengandalkan field mock tsb.
**Aksi (setelah detail live):** petakan `content.terms` → kategori utama; warna
kategori bisa disimpan sebagai meta term (butuh field warna di Term — opsional).
Sebagian terblokir karena butuh detail konten live + struktur term.

### B4. Footer brand description masih sebagian generik — 🟠
**Temuan:** Setelah §6/§8, footer brand/tagline sudah dari `useSiteConfig`. Namun
deskripsi panjang di footer (paragraf) memakai `identity.tagline`. Bila ingin
deskripsi footer terpisah dari tagline masthead, perlu key `site.footer_desc`.
**Aksi (kecil/opsional):** tambah field "Deskripsi footer" di Settings → key baru;
TheFooter pakai itu bila ada, fallback ke tagline.

### B5. RBAC capability untuk modul baru — 🟠
**Temuan:** modul baru (widget) memakai `manage_settings`. Authors (B1) idealnya
`manage_users` (sesuai komentar service) atau capability khusus. Pastikan
konsisten saat menambah route guard & nav `capability`.
**Aksi:** saat buat Authors, set `meta.capability: 'manage_users'`.

---

## Rekomendasi prioritas Fase 2 (public → admin)

| # | Item | Jenis | Blokir BE? | Usaha |
|---|------|-------|-----------|-------|
| 1 | A1 Widget mode "taxonomy" (resolve klien) | Fitur | sebagian | Sedang |
| 2 | B1 Modul admin Authors (service siap) | Fitur | tidak | Sedang |
| 3 | A2 SecondaryNav auto-dari-taxonomy | Fitur | tidak | Kecil |
| 4 | B2 Header profil penulis di AuthorView | Fitur | tidak* | Kecil |
| 5 | A3 Live parsial (kategori/infografis/author via saring klien) | Wiring | sebagian | Sedang |
| 6 | B4 Deskripsi footer terpisah | Kecil | tidak | Kecil |
| 7 | B3 ArticleView pakai terms asli | Wiring | ya | Sedang |
| 8 | A4 (catatan) Filter listing BE | Backend | — | — (luar FE) |

\* B2 butuh B1 lebih dulu.

## Catatan arah backend (ringkas, untuk TODOS)
- `GET /contents?term=&author=&q=` + `GET /contents/by-slug/:slug` → membuka A1(ideal),
  A3, B3, dan pencarian server-side.
- Field warna pada Term (opsional) → kategori berwarna konsisten tanpa hardcode.
- Endpoint `/authors` sudah ada (list/create/update); cukup tambah UI (B1).
