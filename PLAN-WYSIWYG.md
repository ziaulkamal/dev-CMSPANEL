# Plan Lanjutan: Finalisasi Gambar WYSIWYG & Improve `/admin/contents/new`

> Disalin dari plan mode (sumber: `~/.claude/plans/masih-banyak-yang-belum-tingly-pillow.md`).
> Status: **disetujui, belum dieksekusi**. Lanjutkan dengan bilang "mulai implementasi".

## Context

Editor konten (`/admin/contents/new`) sudah punya WYSIWYG dasar, upload gambar langsung ke MinIO, gambar berbasis `<figure class="rte-img">` dengan preset ukuran (S/L/Full), resize drag, dan caption-saat-insert. Namun beberapa hal belum tuntas dan terasa kaku:

- **Alt belum bekerja** — tombol "Alt" di toolbar mengambang gagal menyimpan (kemungkinan `selectedFigure` ter-deselect oleh `onDocClick`/blur saat input alt difokus, atau sinkronisasi tidak tersimpan).
- **Caption** hanya bisa diisi saat pertama insert, belum bisa diedit ulang via klik gambar.
- **Belum ada posisi gambar** (kiri/tengah/kanan).
- **Belum ada opsi "ambil dari media yang ada"** — hanya upload baru (berlaku juga untuk gambar unggulan).
- **Tombol Undo/Redo** tidak diperlukan di toolbar.
- **Dialog tautan** masih `window.prompt` yang kaku.
- Halaman editor secara keseluruhan masih bisa di-polish (visual, validasi, counter SEO).

Tujuan: menjadikan pengelolaan gambar di editor setara CMS modern (WordPress/Notion-like) dan merapikan keseluruhan UX halaman editor.

Keputusan desain (sudah dikonfirmasi user):
1. Media picker = **modal galeri + tab upload**, dipakai bersama editor body & gambar unggulan.
2. Posisi gambar = **align blok** (figure digeser sebagai blok, caption ikut), bukan float/wrap.
3. Toolbar gambar = **toolbar ikon + panel detail** (alt & caption diedit di panel rapi, bukan input mepet).
4. Tautan = **popover inline elegan** (bukan prompt/modal).
5. Improve #6 = **polish visual & spacing** + **validasi & UX form** + **counter SEO & slug live** (loading/empty states tidak diprioritaskan).

## Komponen & file kunci

- `src/features/admin/contents/RichTextEditor.vue` — editor utama; lokasi semua logika gambar/tautan.
- `src/features/admin/contents/FeaturedImagePicker.vue` — gambar unggulan; akan pakai MediaPickerModal.
- `src/features/admin/contents/ContentEditorView.vue` — halaman editor; target improve #6.
- `src/features/admin/contents/SeoPanel.vue` — counter SEO live.
- `src/services/media.service.ts` — sudah dinormalisasi (snake_case), punya `list()` cursor & `upload()`.
- `src/features/admin/media/MediaCard.vue` & `MediaUploader.vue` — pola grid & dropzone yang bisa direplikasi/dirujuk.
- `src/components/app/AppModal.vue` — Teleport modal, ada `size="lg"`/`xl`/`full`.
- `src/components/ui/LoadMore.vue` — tombol pagination cursor.
- `src/features/public/article/ArticleView.vue` — render publik; sudah ada style figure, perlu tambah align.

---

## Bagian A — Komponen baru: `MediaPickerModal.vue`

File baru: `src/features/admin/contents/MediaPickerModal.vue`. Reusable; dipakai editor body & gambar unggulan.

- Pakai `AppModal` (`size="xl"`), dua tab via `AppTabs`: **Media Library** & **Upload Baru**.
- **Tab Library**: `useInfiniteQuery` dengan `mediaService.list({ limit, cursor, sort: '-created_at' })` (replikasi pola `MediaLibraryView.vue`). Grid kartu gambar (filter hanya `mime_type` diawali `image/`), klik = pilih (highlight), `LoadMore` untuk halaman berikut.
- **Tab Upload**: dropzone (rujuk `FileDropzone`/`MediaUploader`), upload via `mediaService.upload()`; setelah sukses, otomatis terpilih.
- Emit `select` dengan objek `{ url, alt }` (pakai `media.file_url`, `media.alt_text`). Tutup modal saat "Pilih".
- Props: `v-model` (open), opsi `accept` default gambar.

**Reuse:** `mediaService` (sudah normalisasi), `AppModal`, `AppTabs`, `LoadMore`, pola `MediaCard`.

---

## Bagian B — `RichTextEditor.vue` (revisi gambar & tautan)

### B1. Hapus Undo/Redo (poin 4)
Hapus grup pertama (`Undo2`, `Redo2`) dari `groups` computed + import-nya.

### B2. Sumber gambar: media lama atau upload (poin 3)
- Ganti tombol toolbar "Sisipkan gambar" agar membuka **MediaPickerModal** (bukan langsung file input).
- Saat picker emit `select({ url, alt })`, panggil `insertImageAtCursor(url, alt)` yang sudah ada.
- Hapus alur `imageInputRef`/`onImageChange` lama (atau pindahkan ke dalam modal). `saveSelection()` tetap dipanggil sebelum modal dibuka agar kursor tidak hilang.

### B3. Toolbar ikon + panel detail (poin 1, 2, fix alt)
Ganti toolbar mengambang `rte__imgbar` menjadi 2 baris:
- **Baris toolbar (ikon):** grup ukuran (S/M/L atau S/L/Full — ikon), grup posisi (ikon kiri/tengah/kanan), tombol "Detail" (toggle panel), tombol hapus.
- **Panel detail (muncul saat toggle):** dua field rapi — `Alt text` & `Caption` — pakai input bergaya `AppInput`-like, tombol Terapkan.

**Fix bug alt (akar masalah):**
- Saat panel/input gambar aktif, **jangan deselect** figure. Perbaiki `onDocClick` agar tidak men-deselect bila target ada di dalam `.rte__imgbar`/panel (klik di dalam toolbar mengambang).
- Pegang referensi `selectedFigure` secara eksplisit; `applyAlt()`/`applyCaption()` beroperasi pada referensi itu, bukan bergantung pada selection DOM aktif. (Logika `applyAlt`/`applyCaption` sudah benar; masalahnya figure ter-deselect sebelum apply.)
- Pastikan input panel di dalam container ber-`@mousedown.prevent` agar fokus editor tidak hilang, namun input tetap bisa diketik (gunakan handler yang tidak mem-prevent default pada input itu sendiri).

### B4. Posisi gambar kiri/tengah/kanan (poin 1, 2) — align blok
- Tambah fungsi `setAlign('left'|'center'|'right')` yang menambah class `rte-img--align-left|center|right` pada `<figure>` (hapus class align lain dulu).
- CSS (di `RichTextEditor.vue` `:deep` & `ArticleView.vue`):
  - `figure.rte-img--align-left { margin-right: auto; margin-left: 0; }`
  - `figure.rte-img--align-center { margin-left: auto; margin-right: auto; }`
  - `figure.rte-img--align-right { margin-left: auto; margin-right: 0; }`
  - figure sudah punya `width` dari preset; align mengatur margin auto. Caption otomatis ikut (bisa tambah `text-align` mengikuti align bila perlu).
- Default saat insert: center.

### B5. Caption editable saat klik (poin 2)
Sudah ada `startEditCaption`/`applyCaption`. Pindahkan ke panel detail B3 sehingga caption diedit bersama alt & posisi dalam satu panel rapi. Hapus caption = kosongkan field (logika hapus `<figcaption>` sudah ada).

### B6. Tautan popover inline elegan (poin 5)
- Ganti `makeLink()` (`window.prompt`) dengan popover kecil di dalam `.rte__shell`.
- State: `showLinkPopover`, `linkDraft`, posisi mengikuti selection (rujuk pola `positionToolbar`). Saat tombol link diklik: simpan selection, buka popover dengan URL existing (bila kursor di dalam `<a>`).
- Tombol **Terapkan** (`document.execCommand('createLink', ...)` atau bungkus manual) & **Hapus tautan** (`unlink`).
- Style konsisten dengan `rte__imgbar` (border, shadow, radius token).

### B7. Persistensi
- Semua perubahan (align/size/alt/caption/link) lewat `syncFromDom()` yang sudah membersihkan class transient `rte-img--selected`. Pastikan class `rte-img--align-*` TIDAK dibersihkan (itu permanen).

---

## Bagian C — `FeaturedImagePicker.vue` (poin 3)

- Tambah pilihan sumber: tombol **"Dari Media"** (buka `MediaPickerModal`) di samping **"Upload"**.
- Saat picker emit `select({ url })`, set `modelValue = url` (tanpa upload ulang).
- Tetap pertahankan upload langsung yang sudah ada sebagai salah satu jalur (lewat tab upload di modal, atau tombol terpisah). Empty state menampilkan dua aksi: "Dari Media" & "Upload".

---

## Bagian D — Improve `/admin/contents/new` (poin 6)

### D1. Polish visual & spacing
- `ContentEditorView.vue`: rapikan header (judul + status badge sejajar), **sticky action bar** (tombol Simpan/Batal) di bawah saat scroll panjang, konsistensi ikon judul kartu, jarak antar kartu seragam, perjelas grup sidebar.

### D2. Validasi & UX form
- Tandai field wajib (judul, tipe, penulis) lebih jelas.
- **Ringkasan error** di atas form bila `fieldErrors` terisi (daftar field bermasalah, klik scroll ke field).
- **Konfirmasi keluar** bila ada perubahan belum tersimpan: lacak `isDirty` (bandingkan form awal vs sekarang), pasang `onBeforeRouteLeave` + `beforeunload`. (Cek apakah `vue-router` guard sudah dipakai di tempat lain.)

### D3. Counter SEO & slug live
- `SeoPanel.vue`: counter karakter untuk `seo_title` (ideal ~60) & `seo_description` (ideal ~155), warna berubah saat melebihi ideal. Reuse `maxlength`/counter `AppTextarea` bila cocok, atau tambahkan indikator kecil.
- Preview snippet sederhana (judul biru + URL hijau + deskripsi) opsional di SeoPanel.
- Permalink/slug: tampilkan preview URL penuh & jaga sinkron auto-slug (logika sudah ada di `ContentEditorView`); rapikan tampilannya.

---

## Bagian E — Render publik (`ArticleView.vue`)

Tambah CSS align ke blok `<style>` yang sudah ada:
- `.prose figure.rte-img--align-left/center/right { ... }` (margin auto sesuai align).
Pastikan preset ukuran + caption + align tampil identik dengan editor.

---

## Urutan implementasi disarankan

1. **B1** (hapus undo/redo) — cepat, bersihkan toolbar.
2. **A** (MediaPickerModal) — fondasi untuk B2 & C.
3. **B3 + fix alt + B5** (toolbar ikon + panel detail + caption editable) — inti perbaikan.
4. **B4 + E** (posisi gambar + render publik).
5. **B2 + C** (sumber gambar dari media, editor & unggulan).
6. **B6** (popover tautan).
7. **D1 → D2 → D3** (improve halaman).

Tiap langkah diakhiri `pnpm type-check`; build final `pnpm build`.

---

## Verifikasi (end-to-end)

Jalankan `pnpm dev`, buka `/admin/contents/new`:

1. **Sisip gambar dari media:** tombol gambar → modal terbuka → tab Library tampil grid → pilih → gambar masuk body. Tab Upload → unggah → otomatis terpilih & masuk.
2. **Alt:** klik gambar → panel detail → isi Alt → Terapkan → inspect `<img alt="...">` terisi & tersimpan setelah Save.
3. **Caption editable:** klik gambar → ubah caption → kosongkan → `<figcaption>` hilang; isi → muncul.
4. **Posisi:** klik gambar → kiri/tengah/kanan → figure bergeser; cek di `ArticleView` setelah publish posisinya sama.
5. **Ukuran:** S/L/Full + resize drag tetap berfungsi; tersimpan saat edit ulang.
6. **Gambar unggulan:** tombol "Dari Media" memilih gambar lama tanpa upload ulang; "Upload" tetap jalan.
7. **Tautan:** seleksi teks → tombol link → popover inline → Terapkan/Hapus, tanpa `window.prompt`.
8. **Undo/Redo** tidak ada lagi di toolbar.
9. **Improve:** counter SEO berubah warna saat melebihi ideal; ringkasan error muncul saat submit invalid; konfirmasi muncul saat keluar dengan perubahan belum tersimpan; action bar sticky.
10. `pnpm type-check` & `pnpm build` lolos; `git`/lint tidak wajib (eslint config belum ada di repo).

## Catatan / risiko

- **contenteditable + fokus input**: bug alt saat ini kemungkinan karena figure ter-deselect saat input difokus. Solusi B3 (jangan deselect bila klik di dalam toolbar/panel) adalah inti perbaikan — perlu hati-hati pada urutan event `mousedown`/`click`/`blur`.
- **Sanitasi**: body dirender `v-html` di publik (sudah disanitasi server per FRONTEND-API.md). Pastikan class `rte-img--*` & `<figure>/<figcaption>` tidak dibuang sanitizer server — bila dibuang, posisi/caption hilang saat tayang. **Perlu dicek ke tim backend `dev-cmscore`.**
- MediaPickerModal memuat daftar media; pastikan endpoint `/media` mengembalikan `mime_type` agar filter gambar bekerja (sudah dinormalisasi di service).
