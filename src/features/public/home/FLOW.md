# FLOW — Beranda: Section "Infografis" (pengganti Analysis)

> Dokumen perencanaan desain. Generated dari analisis visual screenshot beranda +
> arahan: section ANALYSIS diganti galeri **berita infografis** dengan **judul di dalam
> gambar**, rasio **9:16**, lebar menyesuaikan jumlah konten, tanpa ruang kosong.

## 1. Overview

Section `analysis` di **kolom kiri (48%)** beranda saat ini berupa kartu horizontal
(judul + dek kiri, thumbnail 104×70 kanan). Diganti menjadi **InfographicGallery**:
deretan **kartu potret 9:16** berjajar horizontal, **judul putih overlay di dalam
gambar** dengan **gradient gelap dari bawah**. Galeri mengisi **lebar penuh kolom kiri**
sehingga tidak ada celah kosong. Jumlah kartu menyesuaikan data (galeri).

Keputusan terkonfirmasi user:
- **Galeri (banyak kartu)** — bukan satu kartu tunggal.
- **Tetap di kolom kiri 48%** — grid 3 kolom tidak berubah.
- **Overlay gradient gelap bawah** — judul putih di dalam gambar.

## 2. Design Tokens

Memakai token publik yang sudah ada (`--color-pub-*`, `--font-pub-*`). Tidak ada
primitive baru; hanya menambah **token semantik turunan** untuk overlay infografis.

### 2.1 Color

| Token | Mapping | Peran |
|-------|---------|-------|
| `--color-pub-ink` | (eksisting) | Fallback bidang gambar kosong |
| `--color-pub-line` | (eksisting) | Placeholder bg gambar saat loading |
| `--color-pub-crimson` | (eksisting) | Aksen header section |
| `--color-pub-amber` | (eksisting) | Warna kategori "INFOGRAFIS" default |
| `--ig-scrim` | `linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.35) 45%, transparent 75%)` | [INFER] Gradient overlay judul |
| `--ig-title` | `#ffffff` | Judul di atas gambar |

> Scrim cukup pekat di bawah agar judul putih selalu lolos kontras WCAG AA (≥4.5:1)
> di atas foto apa pun. Ini diterapkan sebagai utility/inline style, bukan primitive baru.

### 2.2 Typography

| Token | Role | Size | Weight | Line-height |
|-------|------|------|--------|-------------|
| (eyebrow) `pub-eyebrow` | Label kategori kecil | ~11px | 800 | 1.2 |
| `--text-ig-title` | Judul kartu infografis | ~16–18px [INFER] | 800 | 1.2 (snug) |

Judul memakai `var(--font-pub-sans)` (heading) — konsisten dengan HeroBreaking overlay.

### 2.3 Spacing

Memakai skala spacing Tailwind eksisting proyek. Kunci:
- Padding overlay judul: `p-3` (12px) → `sm:p-4` (16px)
- Gap antar kartu galeri: `gap-3` (12px)
- Padding container section: `p-4` (16px) — sama dgn kartu lain di kolom kiri

### 2.4 Radius & Shadow

- Radius kartu: `rounded-lg` (≈8px) — konsisten kartu beranda.
- Tanpa shadow berat (desain "flat wire-service"); kedalaman dari border 1px + gambar.

### 2.5 CSS Variables (siap pakai)

```css
/* Ditaruh inline/scoped pada komponen InfographicCard — bukan global primitive. */
.ig-card {
  --ig-scrim: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(0, 0, 0, 0.35) 45%,
    transparent 75%
  );
}
```

## 3. Layout & Grid

Kartu 9:16 yang ramping → beberapa berjajar mengisi lebar kolom kiri (48%).

```
Kolom kiri (48%) — blok InfographicGallery
┌────────────────────────────────────────────────┐
│ ▌INFOGRAFIS                       Lihat semua → │  ← SectionHeader (reuse)
├──────────┬──────────┬──────────┬────────────────┤
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐       │
│ │      │ │ │      │ │ │      │ │ │      │  9:16  │
│ │ foto │ │ │ foto │ │ │ foto │ │ │ foto │       │
│ │      │ │ │      │ │ │      │ │ │      │       │
│ │░judul│ │ │░judul│ │ │░judul│ │ │░judul│  ← scrim
│ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘       │
└──────────┴──────────┴──────────┴────────────────┘
```

### Grid spec galeri
- Desktop (lg, dalam kolom 48%): `grid-cols-3` atau `grid-cols-4` — **auto-fit** agar
  "lebar menyesuaikan jumlah konten". Pakai
  `grid-template-columns: repeat(auto-fill, minmax(0, 1fr))` lewat util `grid-cols-N`,
  atau **flex + overflow-x-auto** bila item banyak (carousel). → Pilih **grid-cols-3**
  (≤3 item per baris di kolom 48%; baris baru bila >3) supaya **tidak ada ruang kosong**
  apa pun jumlah datanya.
- Tablet (md, kolom kiri = full 2-col grid): `grid-cols-3`.
- Mobile (1 kolom): `grid-cols-2` (2 kartu potret sejajar — tetap padat).

## 4. Semantic HTML Structure

```
section.infographic-gallery        aria-labelledby="ig-heading"
  SectionHeader  →  h2#ig-heading "Infografis"
  ul[role=list]                    (grid; reset list style)
    li
      article.ig-card
        a (→ article route)        aria-label = judul
          figure
            img  alt = judul        (gambar 9:16, object-cover)
            figcaption.ig-overlay   (scrim + eyebrow + judul)
              span.pub-eyebrow      kategori
              h3.ig-title           judul
```

Document outline (tidak ada lompatan level): beranda `h1` (hero) → `h2` Infografis →
`h3` per judul kartu.

### Checklist Semantic
- [x] `<section>` punya accessible name via `aria-labelledby`.
- [x] Kartu klik = `<a>` (RouterLink), bukan `<div>` ber-handler.
- [x] `<img>` punya `alt` deskriptif (judul) — bukan dekoratif.
- [x] Galeri = `<ul>`/`<li>` (list reset CSS, `role="list"` dipertahankan).
- [x] Urutan DOM = urutan visual.

## 5. Component Inventory

```
Nama        : InfographicCard  (atom→molecule)
Region      : Kolom kiri, dalam InfographicGallery
Frekuensi   : Multiple (galeri)
HTML base   : <article> berisi <a><figure>

Props:
  - item: MockStory (id, slug, title, featured_image, category, category_color)

Slot/elemen :
  - img 9:16 (object-cover)
  - scrim overlay (gradient gelap bawah)
  - eyebrow kategori (opsional)
  - title (h3, putih, 2 baris max → line-clamp-3)

State:
  - default
  - hover  → img scale-105 (zoom halus, konsisten StoryCard), scrim sedikit lebih pekat
  - focus-visible → ring (a11y keyboard)
  - tanpa gambar → bidang --color-pub-ink, judul tetap terbaca

Token: --color-pub-ink, --color-pub-line, --ig-scrim, --font-pub-sans, rounded-lg
```

```
Nama        : InfographicGallery (organism)
HTML base   : <section> + SectionHeader + <ul>
Props       : items: MockStory[], title?: string
Render      : grid responsif kartu InfographicCard; kosong → tidak render (v-if length)
Reuse       : SectionHeader (judul + "Lihat semua"), pola yang sama dgn centerFeed/moreNews
```

### Hierarchy
```
Atom      : (img, scrim, eyebrow) — bagian InfographicCard
Molecule  : InfographicCard
Organism  : InfographicGallery  (dipakai HomeView, key 'analysis'→render galeri)
```

## 6. Responsive Plan

| Breakpoint | Konteks kolom | Grid galeri | Catatan |
|-----------|---------------|-------------|---------|
| `<640` (base) | 1 kolom | `grid-cols-2` | 2 kartu potret sejajar |
| `sm 640+` | 1 kolom | `grid-cols-3` | rapat, isi penuh |
| `md 768+` | kolom kiri = 2-col span | `grid-cols-3` | |
| `lg 1024+` | kolom kiri 48% | `grid-cols-3` | 9:16 ramping, mengisi lebar |

Aspect ratio kartu tetap **9:16** di semua breakpoint (`aspect-[9/16]`).

## 7. Accessibility Checklist

- [ ] Kontras judul putih atas scrim ≥ 4.5:1 (scrim 0.85 di bawah menjamin).
- [ ] `aria-labelledby` pada section menunjuk ke heading.
- [ ] `alt` gambar = judul (informatif).
- [ ] `focus-visible` ring pada tiap kartu (`outline`/`ring`).
- [ ] `loading="lazy"` pada gambar galeri (bukan LCP utama).
- [ ] `line-clamp` mencegah judul panjang menutupi seluruh gambar.

## 8. Catatan & Asumsi

- `[INFER]` Nilai gradient scrim & ukuran judul diperkirakan dari proporsi screenshot.
- Data: section memakai key registry **`analysis`** yang sudah ada (label diubah jadi
  "Infografis") agar **tidak perlu migrasi config/registry** — hanya render diganti.
  Sumber data: `mock.analysis` diubah dari objek tunggal → **array** `analysis[]`
  (galeri). Live mode: ambil beberapa post (mis. `posts.slice(5, X)`), atau type khusus.
- `[INFER]` Jumlah default galeri: **3–4 item** agar baris penuh di kolom 48%.
- Rasio 9:16 dipakai apa adanya; "lebar menyesuaikan jumlah konten" diwujudkan lewat
  grid (lebih banyak item → baris bertambah), bukan mengubah lebar per-kartu.

## 9. Rekomendasi

1. **Ganti label registry** `analysis` → "Infografis" (panel admin ikut berubah,
   tanpa breaking config user). Pertahankan key `analysis` demi kompatibilitas.
2. **Mock jadi array**: `analysis` → `analysis: MockStory[]` (3–4 item) supaya galeri
   terlihat penuh & mudah dipetakan ke API nanti.
3. **Reuse SectionHeader** untuk konsistensi (accent amber, `see-all`).
4. Pertimbangkan **CategoryTag** kecil di overlay untuk konteks kanal infografis.
5. Hover zoom + scrim transition mengikuti pola `StoryCard`/`HeroBreaking` (durasi 300ms).
