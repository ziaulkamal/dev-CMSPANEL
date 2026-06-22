# Catatan Integrasi: PUBLIC → ADMIN

> Ruang lingkup **hanya** jembatan **public ↔ admin** (belum menyentuh dev-CMSCORE).
> Tujuan: setiap penyesuaian visual di halaman depan yang saat ini **hardcoded di
> mock** atau **belum punya layar pengelola** harus bisa diatur dari `/admin`.
>
> Acuan kode public: `src/features/public/**`. Acuan admin: `src/features/admin/**`,
> menu admin: `src/data/adminNav.ts`. Toggle data: `VITE_USE_MOCK`
> (`src/features/public/data/homeSource.ts`).

## Cara baca status

| Simbol | Arti |
|---|---|
| ✅ | Service + UI admin sudah ada & dipakai public |
| 🟡 | Service ada, **UI admin sudah ada** tapi public masih jatuh ke mock / lokasi belum lengkap |
| 🔴 | **Belum ada UI admin sama sekali** — public hardcoded di `home.mock.json` |

---

## Ringkasan eksekutif

Public sudah dirancang dengan pola "mock now, service later": tiap komponen punya
`useQuery(... enabled: !USE_MOCK)` dan fallback ke `home.mock.json`. Artinya **kontrak
service sudah ada** untuk sebagian besar fitur, tetapi:

1. Banyak konfigurasi masih **hardcoded di mock**, belum ada layar admin untuk
   mengubahnya (footer, headline, secondary nav, theme, layout section, widget rail).
2. Menu admin hanya mengelola **satu** pohon menu (`/menus`), padahal public punya
   **tiga lokasi menu berbeda** (Top, Secondary, Footer) + bottom-nav.
3. Beberapa komponen public **tidak pernah** memanggil service (selalu mock), jadi
   walau backend siap, datanya tak akan tampil.

---

## 1. Iklan / Ad Slot — 🟡 (perlu sinkron posisi)

**Public:** [AdSlotRenderer.vue](src/features/public/shared/AdSlotRenderer.vue) merender per-`position`.
**Admin:** [AdSlotListView.vue](src/features/admin/ads/AdSlotListView.vue) + [AdSlotFormModal.vue](src/features/admin/ads/AdSlotFormModal.vue) sudah ada.
**Service:** [ads.service.ts](src/services/ads.service.ts).

**Status:** Sudah hampir penuh. Yang perlu dipastikan:

- **Daftar posisi harus jadi satu sumber tunggal.** Saat ini `AdPosition` di
  `ads.service.ts` (9 posisi) dan `POSITION_OPTIONS` di `AdSlotFormModal.vue` ditulis
  ganda. Mock di `home.mock.json` memakai posisi yang sama. Risiko: admin menambah
  posisi yang tidak dirender public, atau public punya slot tanpa opsi di admin.
  → **Aksi:** ekspor daftar posisi+label dari `ads.service.ts`, impor di form admin.
- Posisi `floating_bottom_timer` & `flying_carpet` ada di admin tetapi **belum ada
  `AdSlotRenderer` yang memanggilnya** di layout public. → cek pemasangan slot.
- Verifikasi semua posisi yang ada di mock punya titik render di public.

---

## 2. Menu navigasi — 🟡 SATU pohon, public butuh TIGA lokasi

Ini gap terbesar. Public punya **tiga area menu berbeda** + bottom-nav, tapi admin
hanya punya satu builder generik (`/menus`).

| Lokasi public | Komponen | Sumber sekarang |
|---|---|---|
| **Top Menu** (nav utama + dropdown) | [TheMasthead.vue](src/features/public/shared/TheMasthead.vue), [MainMenuSheet.vue](src/features/public/shared/MainMenuSheet.vue) | `menuService.get()` ATAU `mock.nav` |
| **Secondary Menu** (pill scroll horizontal) | [SecondaryNav.vue](src/features/public/shared/SecondaryNav.vue) | **selalu `mock.secondaryNav`** — tak pernah panggil service 🔴 |
| **Footer Menu** (kolom tautan) | [TheFooter.vue](src/features/public/shared/TheFooter.vue) | `FooterConfig` dari mock 🔴 |
| **Bottom Nav** (mobile, 5 aksi) | [BottomNav.vue](src/features/public/shared/BottomNav.vue) | **hardcoded di template** (Beranda/Kategori/Cari/Terbaru/Tema) 🔴 |

**Admin sekarang:** [MenuBuilderView.vue](src/features/admin/menus/MenuBuilderView.vue) +
[menu.service.ts](src/services/menu.service.ts) → hanya `GET/PUT /menus` (satu pohon).

**Aksi yang diperlukan:**

1. **Konsep "menu location".** Ubah menu jadi ber-lokasi: `top`, `secondary`, `footer`
   (mis. `GET /menus/:location` atau satu objek `{ top, secondary, footer }`). Tambah
   selector lokasi di `MenuBuilderView` (tab/dropdown).
2. **SecondaryNav** harus baca dari service lokasi `secondary` (sekarang murni mock).
3. **TheFooter** kolom tautan harus berasal dari menu lokasi `footer` (atau modul
   "Footer" tersendiri — lihat §6), bukan `FooterConfig` mock.
4. **BottomNav** — putuskan: tetap statis (paling aman) **atau** jadikan konfigurasi
   admin (label + target + visibilitas per item). Rekomendasi: statis dulu, dokumentasikan.

---

## 3. Sidebar / Widget Rail — 🔴 belum ada UI admin

Public punya modul rail samping & blok beranda yang isinya **murni mock**, tanpa cara
mengelola dari admin:

| Widget | Komponen | Sumber |
|---|---|---|
| Trending / Headline ticker | [HeadlineBar.vue](src/features/public/shared/HeadlineBar.vue) | `mock.trending` (live: ambil 6 konten terbaru — bukan kurasi) |
| Populer (numbered list) | [PopularList.vue](src/features/public/home/components/PopularList.vue) | `mock.popular` 🔴 |
| Editor's Pick | [EditorsPick.vue](src/features/public/home/components/EditorsPick.vue) | `mock.editorsPick` 🔴 |
| Video rail | [VideoThumb.vue](src/features/public/home/components/VideoThumb.vue) | `mock.videos` 🔴 |
| Opini rail | [OpinionItem.vue](src/features/public/home/components/OpinionItem.vue) | `mock.opinions` 🔴 |
| Rail generik | [RailModule.vue](src/features/public/home/components/RailModule.vue) | props dari HomeView |

**Aksi:** definisikan konsep **Widget** (mirip AdSlot tapi konten editorial):
tipe (`trending`/`popular`/`editors_pick`/`manual_list`/`video`/`opinion`), sumber
(otomatis by-query atau kurasi manual pilih konten), penempatan (`sidebar` / `home_*`),
dan urutan. Service `widget.service.ts` + `WidgetListView`/`WidgetFormModal` di admin.
Ini menggantikan banyak field mock sekaligus.

---

## 4. Tema publik (warna) — 🔴 belum ada UI admin

**Public:** `home.theme` (crimson, amber, ink, muted, paper, canvas, line) dipasang
sebagai CSS variable via `usePublicColorScheme` / [useHomeConfig.ts](src/features/public/data/useHomeConfig.ts).
Mode gelap (`PUBLIC_THEME_DARK`) hardcoded di [homeSource.ts](src/features/public/data/homeSource.ts).
**Service:** dibaca dari `settingsService.get()['home.theme']` saat live.
**Admin:** [SettingsView.vue](src/features/admin/settings/SettingsView.vue) **belum** punya
panel untuk mengedit `home.theme`.

**Aksi:** tambah panel "Tema Situs Publik" di Settings — color picker untuk 7 token
(light) + opsi override dark. Simpan ke namespace `home.theme`. Struktur key sudah
disepakati (lihat komentar di `homeSource.ts`), jadi murni pekerjaan UI admin.

---

## 5. Layout & urutan Section beranda — 🔴 belum ada UI admin

**Public:** `home.sections` (array `{key, enabled, variant}`) mengatur section mana
yang tampil, urutannya, dan varian tata letak. Dibaca [useHomeConfig.ts](src/features/public/data/useHomeConfig.ts);
registry varian di [sectionRegistry.ts](src/features/public/home/sectionRegistry.ts).
**Service:** `settingsService...['home.sections']`.
**Admin:** belum ada.

**Aksi:** layar "Tata Letak Beranda" di admin — daftar section (drag/reorder), toggle
enable, pilih varian dari `SECTION_REGISTRY`. Simpan ke `home.sections`. Pola identik
dengan MenuBuilder (reorder tanpa lib). Registry varian sudah jadi sumber pilihan.

---

## 6. Footer (brand, kolom, sosial, copyright) — 🔴 belum ada UI admin

**Public:** [TheFooter.vue](src/features/public/shared/TheFooter.vue) memakai `FooterConfig`
(`columns[]`, `social[]`, `copyright`) dari mock. Teks brand & deskripsi **hardcoded di
template**.
**Aksi:** modul/panel "Footer" di admin → kelola kolom tautan (atau pakai menu lokasi
`footer` dari §2), tautan sosial (platform+url), teks copyright, dan deskripsi brand.
Simpan ke `home.footer` (namespace settings) agar konsisten.

---

## 7. Popup — ✅ (verifikasi mock)

**Public:** [PublicPopups.vue](src/features/public/shared/PublicPopups.vue) sudah pakai
`popupService.list()` (live). **Admin:** [PopupListView.vue](src/features/admin/popups/PopupListView.vue)
+ [PopupFormModal.vue](src/features/admin/popups/PopupFormModal.vue) ada. Service
[popup.service.ts](src/services/popup.service.ts) ada. Mock `popups: []` (kosong) —
artinya di mode mock popup tak diuji. **Aksi:** cukup pastikan field admin (scope,
frequency, delay, auto_close) cocok dengan yang dibaca `PublicPopups`.

---

## 8. Identitas situs (logo, nama, tagline) — 🔴 belum ada UI admin

Nama "WARTAKAN MEDIA", logo (kotak crimson + lingkaran), dan tagline **hardcoded** di
`TheMasthead.vue` dan `TheFooter.vue`. **Aksi:** pindahkan ke Settings (`site.name`,
`site.logo`, `site.tagline`) dan baca dari sana di kedua komponen.

---

## Prioritas yang disarankan (public → admin saja)

| # | Item | Dampak | Usaha | Catatan |
|---|---|---|---|---|
| 1 | §2 Menu multi-lokasi (Top/Secondary/Footer) | Tinggi | Sedang | Gap fungsional terbesar |
| 2 | §4 Tema publik di Settings | Tinggi | Kecil | Service & key sudah ada |
| 3 | §8 Identitas situs di Settings | Sedang | Kecil | Cepat, sering diminta |
| 4 | §5 Tata letak section beranda | Sedang | Sedang | Registry sudah ada |
| 5 | §3 Widget rail (Populer/Editor's Pick/Video/Opini) | Tinggi | Besar | Butuh konsep Widget baru |
| 6 | §6 Footer terstruktur | Sedang | Kecil | Bisa digabung ke §2 |
| 7 | §1 Sinkron posisi Ads (dedup) | Rendah | Kecil | Kebersihan kode |
| 8 | §7 Verifikasi popup | Rendah | Kecil | Hampir selesai |

## Catatan teknis lintas-item

- **Sumber tunggal:** banyak daftar (posisi ads, varian section, lokasi menu) sebaiknya
  diekspor dari satu modul dan dipakai bersama public+admin agar tak drift.
- **Namespace settings** sudah jadi konvensi (`home.theme`, `home.sections`, dan usulan
  `home.footer`, `site.*`). Pakai itu untuk semua config non-CRUD agar admin Settings
  jadi titik kelola tunggal.
- **Mode mock:** setelah UI admin jadi, pastikan komponen public yang masih "selalu
  mock" (SecondaryNav, Popular, EditorsPick, Video, Opini) diberi cabang
  `useQuery(... enabled: !USE_MOCK)` seperti komponen lain, agar data live benar-benar
  mengalir.
