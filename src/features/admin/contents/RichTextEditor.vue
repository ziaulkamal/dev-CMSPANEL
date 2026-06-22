<!--
  src/features/admin/contents/RichTextEditor.vue
  WYSIWYG ringan berbasis contenteditable + execCommand (tanpa dependensi eksternal).
  Gambar <figure.rte-img> dengan preset ukuran, posisi (kiri/tengah/kanan), alt & caption
  via panel detail; sumber gambar dari MediaPickerModal. Tautan via popover inline.
-->
<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link2,
  Code2,
  Heading2,
  Heading3,
  RemoveFormatting,
  ImagePlus,
  Check,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Settings2,
  X,
} from '@lucide/vue';
import MediaPickerModal from './MediaPickerModal.vue';

const props = defineProps<{
  modelValue: string;
  disabled?: boolean;
  error?: string;
  label?: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const editorRef = ref<HTMLDivElement | null>(null);
const isFocused = ref(false);
const showHtml = ref(false);
const htmlDraft = ref('');
let savedRange: Range | null = null;

// ── State gambar terpilih (toolbar mengambang + panel detail + resize) ──
const selectedFigure = ref<HTMLElement | null>(null);
const toolbarPos = reactive({ top: 0, left: 0 });
const showDetail = ref(false);
const altDraft = ref('');
const captionDraft = ref('');
const currentSize = ref<'small' | 'large' | 'full'>('large');
const currentAlign = ref<'left' | 'center' | 'right'>('center');

// ── Media picker ──────────────────────────────────────────────────
const showMediaPicker = ref(false);

// ── Link popover ──────────────────────────────────────────────────
const showLinkPopover = ref(false);
const linkDraft = ref('');
const linkPos = reactive({ top: 0, left: 0 });

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Sinkronisasi: model → DOM (hanya jika berbeda agar kursor tidak loncat).
watch(
  () => props.modelValue,
  (val) => {
    if (editorRef.value && editorRef.value.innerHTML !== (val ?? '')) {
      editorRef.value.innerHTML = val ?? '';
    }
  },
);

onMounted(() => {
  if (editorRef.value) editorRef.value.innerHTML = props.modelValue ?? '';
});

function exec(command: string, value?: string): void {
  if (props.disabled) return;
  editorRef.value?.focus();
  document.execCommand(command, false, value);
  syncFromDom();
}

function syncFromDom(): void {
  if (!editorRef.value) return;
  // Bersihkan kelas transient (sorotan pilih) dari HTML yang disimpan.
  const clone = editorRef.value.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.rte-img--selected').forEach((el) => el.classList.remove('rte-img--selected'));
  emit('update:modelValue', clone.innerHTML);
}

function onInput(): void {
  syncFromDom();
}

// ── Selection helpers ─────────────────────────────────────────────
function saveSelection(): void {
  const sel = window.getSelection();
  if (sel && sel.rangeCount && editorRef.value?.contains(sel.anchorNode)) {
    savedRange = sel.getRangeAt(0).cloneRange();
  } else {
    savedRange = null;
  }
}

function restoreSelection(): void {
  editorRef.value?.focus();
  if (!savedRange) return;
  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }
}

// ── Tautan (popover inline) ───────────────────────────────────────
function closestAnchor(): HTMLAnchorElement | null {
  const sel = window.getSelection();
  let node = sel?.anchorNode as HTMLElement | null;
  while (node && node !== editorRef.value) {
    if (node.tagName === 'A') return node as HTMLAnchorElement;
    node = node.parentElement;
  }
  return null;
}

function openLinkPopover(): void {
  if (props.disabled || showHtml.value) return;
  saveSelection();
  const existing = closestAnchor();
  linkDraft.value = existing?.getAttribute('href') ?? 'https://';
  // Posisikan popover dekat selection.
  const wrap = editorRef.value?.parentElement;
  const sel = window.getSelection();
  if (wrap && sel && sel.rangeCount) {
    const r = sel.getRangeAt(0).getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    linkPos.top = r.bottom - w.top + 6;
    linkPos.left = Math.max(0, r.left - w.left);
  }
  showLinkPopover.value = true;
  void nextTick(() => {
    (document.querySelector('.rte__link-input') as HTMLInputElement | null)?.focus();
  });
}

function applyLink(): void {
  const url = linkDraft.value.trim();
  restoreSelection();
  if (url) document.execCommand('createLink', false, url);
  showLinkPopover.value = false;
  syncFromDom();
}

function removeLink(): void {
  restoreSelection();
  document.execCommand('unlink');
  showLinkPopover.value = false;
  syncFromDom();
}

// ── Sisip gambar ──────────────────────────────────────────────────
function pickImage(): void {
  if (props.disabled) return;
  saveSelection();
  showMediaPicker.value = true;
}

function onMediaSelected(payload: { url: string; alt: string }): void {
  insertImageAtCursor(payload.url, payload.alt);
}

function insertImageAtCursor(url: string, alt: string): void {
  restoreSelection();
  // Default: ukuran besar, posisi tengah. Caption diisi nanti via panel detail.
  const figure =
    `<figure class="rte-img rte-img--large rte-img--align-center" contenteditable="false">` +
    `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" draggable="false" />` +
    `</figure><p><br></p>`;
  const ok = document.execCommand('insertHTML', false, figure);
  if (!ok && editorRef.value) {
    editorRef.value.insertAdjacentHTML('beforeend', figure);
  }
  syncFromDom();
}

// ── Interaksi gambar terpilih ─────────────────────────────────────
const geomTick = ref(0);

function positionToolbar(fig: HTMLElement): void {
  const wrap = editorRef.value?.parentElement;
  if (!wrap) return;
  const f = fig.getBoundingClientRect();
  const w = wrap.getBoundingClientRect();
  toolbarPos.top = Math.max(0, f.top - w.top - 44);
  toolbarPos.left = f.left - w.left;
  geomTick.value++;
}

const resizeHandleStyle = computed<Record<string, string>>(() => {
  void geomTick.value;
  const fig = selectedFigure.value;
  const wrap = editorRef.value?.parentElement;
  const img = fig?.querySelector('img');
  if (!fig || !wrap || !img) return { display: 'none', top: '0', left: '0' };
  const r = img.getBoundingClientRect();
  const w = wrap.getBoundingClientRect();
  return {
    display: 'block',
    top: `${r.bottom - w.top - 7}px`,
    left: `${r.right - w.left - 7}px`,
  };
});

function readFigureState(fig: HTMLElement): void {
  currentSize.value = fig.classList.contains('rte-img--small')
    ? 'small'
    : fig.classList.contains('rte-img--full')
      ? 'full'
      : 'large';
  currentAlign.value = fig.classList.contains('rte-img--align-left')
    ? 'left'
    : fig.classList.contains('rte-img--align-right')
      ? 'right'
      : 'center';
  altDraft.value = fig.querySelector('img')?.getAttribute('alt') ?? '';
  captionDraft.value = fig.querySelector('figcaption')?.textContent ?? '';
}

function selectFigure(fig: HTMLElement): void {
  if (props.disabled) return;
  selectedFigure.value?.classList.remove('rte-img--selected');
  selectedFigure.value = fig;
  fig.classList.add('rte-img--selected');
  showDetail.value = false;
  readFigureState(fig);
  void nextTick(() => positionToolbar(fig));
}

function deselectFigure(): void {
  selectedFigure.value?.classList.remove('rte-img--selected');
  selectedFigure.value = null;
  showDetail.value = false;
}

function onEditorClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  const fig = target.closest('figure.rte-img') as HTMLElement | null;
  if (fig) selectFigure(fig);
  else deselectFigure();
}

function setSize(size: 'small' | 'large' | 'full'): void {
  const fig = selectedFigure.value;
  if (!fig) return;
  fig.classList.remove('rte-img--small', 'rte-img--large', 'rte-img--full');
  fig.classList.add(`rte-img--${size}`);
  currentSize.value = size;
  const img = fig.querySelector('img');
  if (img) img.style.width = ''; // reset lebar manual agar preset penuh
  void nextTick(() => positionToolbar(fig));
  syncFromDom();
}

function setAlign(align: 'left' | 'center' | 'right'): void {
  const fig = selectedFigure.value;
  if (!fig) return;
  fig.classList.remove('rte-img--align-left', 'rte-img--align-center', 'rte-img--align-right');
  fig.classList.add(`rte-img--align-${align}`);
  currentAlign.value = align;
  void nextTick(() => positionToolbar(fig));
  syncFromDom();
}

function toggleDetail(): void {
  if (!selectedFigure.value) return;
  if (!showDetail.value) readFigureState(selectedFigure.value);
  showDetail.value = !showDetail.value;
}

/** Terapkan alt & caption dari panel detail. */
function applyDetail(): void {
  const fig = selectedFigure.value;
  if (!fig) return;
  const img = fig.querySelector('img');
  if (img) img.setAttribute('alt', altDraft.value);

  let cap = fig.querySelector('figcaption');
  const text = captionDraft.value.trim();
  if (text) {
    if (!cap) {
      cap = document.createElement('figcaption');
      fig.appendChild(cap);
    }
    cap.textContent = text;
  } else if (cap) {
    cap.remove(); // kosong → hilangkan
  }
  showDetail.value = false;
  void nextTick(() => fig && positionToolbar(fig));
  syncFromDom();
}

function removeFigure(): void {
  selectedFigure.value?.remove();
  deselectFigure();
  syncFromDom();
}

// Resize drag dari handle sudut kanan-bawah.
let resizeState: { startX: number; startW: number; img: HTMLImageElement } | null = null;
function startResize(e: PointerEvent): void {
  const img = selectedFigure.value?.querySelector('img') as HTMLImageElement | null;
  if (!img) return;
  e.preventDefault();
  resizeState = { startX: e.clientX, startW: img.getBoundingClientRect().width, img };
  window.addEventListener('pointermove', onResize);
  window.addEventListener('pointerup', endResize);
}
function onResize(e: PointerEvent): void {
  if (!resizeState) return;
  const delta = e.clientX - resizeState.startX;
  const next = Math.max(60, resizeState.startW + delta);
  const maxW = editorRef.value?.clientWidth ?? next;
  resizeState.img.style.width = `${Math.min(next, maxW)}px`;
  if (selectedFigure.value) positionToolbar(selectedFigure.value);
}
function endResize(): void {
  window.removeEventListener('pointermove', onResize);
  window.removeEventListener('pointerup', endResize);
  resizeState = null;
  syncFromDom();
}

// Deselect hanya bila klik benar-benar di luar editor/toolbar/popover.
function onDocClick(e: MouseEvent): void {
  const t = e.target as HTMLElement;
  if (t.closest('.rte__shell') || t.closest('.rte__imgbar')) return;
  deselectFigure();
  showLinkPopover.value = false;
}
onMounted(() => document.addEventListener('click', onDocClick));
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick);
  window.removeEventListener('pointermove', onResize);
  window.removeEventListener('pointerup', endResize);
});

function toggleHtml(): void {
  deselectFigure();
  if (showHtml.value) {
    emit('update:modelValue', htmlDraft.value);
    if (editorRef.value) editorRef.value.innerHTML = htmlDraft.value;
  } else {
    htmlDraft.value = props.modelValue ?? '';
  }
  showHtml.value = !showHtml.value;
}

function onHtmlInput(e: Event): void {
  htmlDraft.value = (e.target as HTMLTextAreaElement).value;
  emit('update:modelValue', htmlDraft.value);
}

interface ToolButton {
  icon: unknown;
  title: string;
  action: () => void;
}

const groups = computed<ToolButton[][]>(() => [
  [
    { icon: Heading2, title: 'Judul H2', action: () => exec('formatBlock', '<h2>') },
    { icon: Heading3, title: 'Judul H3', action: () => exec('formatBlock', '<h3>') },
  ],
  [
    { icon: Bold, title: 'Tebal', action: () => exec('bold') },
    { icon: Italic, title: 'Miring', action: () => exec('italic') },
    { icon: Underline, title: 'Garis bawah', action: () => exec('underline') },
    { icon: Strikethrough, title: 'Coret', action: () => exec('strikeThrough') },
  ],
  [
    { icon: List, title: 'Daftar bullet', action: () => exec('insertUnorderedList') },
    { icon: ListOrdered, title: 'Daftar nomor', action: () => exec('insertOrderedList') },
    { icon: Quote, title: 'Kutipan', action: () => exec('formatBlock', '<blockquote>') },
  ],
  [
    { icon: Link2, title: 'Tautan', action: openLinkPopover },
    { icon: ImagePlus, title: 'Sisipkan gambar', action: pickImage },
    { icon: RemoveFormatting, title: 'Hapus format', action: () => exec('removeFormat') },
  ],
]);
</script>

<template>
  <div class="rte" :class="{ 'rte--error': !!error, 'rte--disabled': disabled }">
    <label v-if="label" class="rte__label">{{ label }}</label>

    <div class="rte__shell" :class="{ 'rte__shell--focused': isFocused }">
      <!-- Toolbar -->
      <div class="rte__toolbar">
        <template v-for="(group, gi) in groups" :key="gi">
          <div class="rte__group">
            <button
              v-for="(btn, bi) in group"
              :key="bi"
              type="button"
              class="rte__btn"
              :title="btn.title"
              :disabled="disabled || showHtml"
              @mousedown.prevent="btn.action"
            >
              <component :is="btn.icon" :size="15" />
            </button>
          </div>
          <span class="rte__divider" />
        </template>
        <button
          type="button"
          class="rte__btn rte__btn--toggle"
          :class="{ 'rte__btn--active': showHtml }"
          title="Sunting HTML"
          :disabled="disabled"
          @mousedown.prevent="toggleHtml"
        >
          <Code2 :size="15" />
        </button>
      </div>

      <!-- Editor area -->
      <div v-show="!showHtml" class="rte__editor-wrap">
        <div
          ref="editorRef"
          class="rte__editor"
          :class="{ 'rte__editor--has-sel': selectedFigure }"
          :contenteditable="!disabled"
          role="textbox"
          aria-multiline="true"
          @input="onInput"
          @click="onEditorClick"
          @focus="isFocused = true"
          @blur="isFocused = false"
        />

        <!-- Toolbar mengambang untuk gambar terpilih -->
        <div
          v-if="selectedFigure && !disabled"
          class="rte__imgbar"
          :style="{ top: `${toolbarPos.top}px`, left: `${toolbarPos.left}px` }"
          @mousedown.prevent
        >
          <!-- Baris ikon -->
          <div class="rte__imgbar-row">
            <!-- Ukuran -->
            <div class="rte__imgbar-grp">
              <button
                class="rte__imgbar-btn"
                :class="{ 'rte__imgbar-btn--on': currentSize === 'small' }"
                title="Kecil"
                @click="setSize('small')"
              >S</button>
              <button
                class="rte__imgbar-btn"
                :class="{ 'rte__imgbar-btn--on': currentSize === 'large' }"
                title="Besar"
                @click="setSize('large')"
              >L</button>
              <button
                class="rte__imgbar-btn"
                :class="{ 'rte__imgbar-btn--on': currentSize === 'full' }"
                title="Penuh"
                @click="setSize('full')"
              >Full</button>
            </div>
            <span class="rte__imgbar-sep" />
            <!-- Posisi -->
            <div class="rte__imgbar-grp">
              <button
                class="rte__imgbar-btn"
                :class="{ 'rte__imgbar-btn--on': currentAlign === 'left' }"
                title="Kiri"
                @click="setAlign('left')"
              ><AlignLeft :size="14" /></button>
              <button
                class="rte__imgbar-btn"
                :class="{ 'rte__imgbar-btn--on': currentAlign === 'center' }"
                title="Tengah"
                @click="setAlign('center')"
              ><AlignCenter :size="14" /></button>
              <button
                class="rte__imgbar-btn"
                :class="{ 'rte__imgbar-btn--on': currentAlign === 'right' }"
                title="Kanan"
                @click="setAlign('right')"
              ><AlignRight :size="14" /></button>
            </div>
            <span class="rte__imgbar-sep" />
            <button
              class="rte__imgbar-btn"
              :class="{ 'rte__imgbar-btn--on': showDetail }"
              title="Alt & caption"
              @click="toggleDetail"
            ><Settings2 :size="14" /></button>
            <button class="rte__imgbar-btn rte__imgbar-btn--danger" title="Hapus" @click="removeFigure">
              <Trash2 :size="14" />
            </button>
          </div>

          <!-- Panel detail (alt + caption) -->
          <div v-if="showDetail" class="rte__detail">
            <label class="rte__detail-field">
              <span class="rte__detail-label">Alt text</span>
              <input
                v-model="altDraft"
                class="rte__detail-input"
                placeholder="Deskripsi gambar untuk SEO/aksesibilitas"
                @keydown.enter.prevent="applyDetail"
              />
            </label>
            <label class="rte__detail-field">
              <span class="rte__detail-label">Caption</span>
              <input
                v-model="captionDraft"
                class="rte__detail-input"
                placeholder="Kosongkan jika tidak perlu"
                @keydown.enter.prevent="applyDetail"
              />
            </label>
            <div class="rte__detail-actions">
              <button class="rte__detail-apply" @click="applyDetail"><Check :size="14" /> Terapkan</button>
            </div>
          </div>
        </div>

        <!-- Handle resize -->
        <div
          v-if="selectedFigure && !disabled && !showDetail"
          class="rte__resize"
          :style="resizeHandleStyle"
          title="Tarik untuk mengubah ukuran"
          @pointerdown="startResize"
        />

        <!-- Popover tautan -->
        <div
          v-if="showLinkPopover"
          class="rte__linkpop"
          :style="{ top: `${linkPos.top}px`, left: `${linkPos.left}px` }"
          @mousedown.prevent
        >
          <input
            v-model="linkDraft"
            class="rte__link-input"
            placeholder="https://…"
            @keydown.enter.prevent="applyLink"
            @keydown.esc="showLinkPopover = false"
          />
          <button class="rte__imgbar-btn" title="Terapkan" @click="applyLink"><Check :size="14" /></button>
          <button class="rte__imgbar-btn rte__imgbar-btn--danger" title="Hapus tautan" @click="removeLink">
            <X :size="14" />
          </button>
        </div>
      </div>

      <!-- Raw HTML -->
      <textarea
        v-show="showHtml"
        class="rte__html"
        :value="htmlDraft"
        :disabled="disabled"
        spellcheck="false"
        @input="onHtmlInput"
      />
    </div>

    <p v-if="error" class="rte__msg rte__msg--error" role="alert">{{ error }}</p>

    <!-- Pemilih media (galeri + upload) -->
    <MediaPickerModal v-model="showMediaPicker" @select="onMediaSelected" />
  </div>
</template>

<style scoped>
.rte { display: flex; flex-direction: column; gap: 6px; }
.rte__label { font-size: 12.5px; font-weight: 600; color: var(--color-text-primary); }

.rte__shell {
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition: border-color 150ms ease, box-shadow 150ms ease;
  overflow: hidden;
}
.rte__shell--focused {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
.rte--error .rte__shell { border-color: var(--color-danger); }
.rte--disabled { opacity: 0.6; pointer-events: none; }

/* Toolbar */
.rte__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1.5px solid var(--color-border);
  background: var(--color-bg-subtle);
}
.rte__group { display: flex; align-items: center; gap: 2px; }
.rte__divider {
  width: 1px;
  height: 18px;
  background: var(--color-border);
  margin: 0 4px;
}
.rte__divider:last-of-type { display: none; }

.rte__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.rte__btn:hover:not(:disabled) { background: var(--color-border); color: var(--color-text-primary); }
.rte__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.rte__btn--toggle { margin-left: auto; }
.rte__btn--active { background: rgba(99, 102, 241, 0.14); color: #6366f1; }

/* Editor */
.rte__editor-wrap { position: relative; }
.rte__editor {
  min-height: 280px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px 18px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-primary);
  outline: none;
}
.rte__editor :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

/* ── Gambar berbasis <figure> + preset ukuran + posisi ── */
.rte__editor :deep(figure.rte-img) {
  margin: 12px 0;
  position: relative;
}
.rte__editor :deep(figure.rte-img img) { display: block; margin: 0; }
.rte__editor :deep(figure.rte-img figcaption) {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--color-text-muted);
  font-style: italic;
  line-height: 1.4;
}
/* Preset ukuran */
.rte__editor :deep(figure.rte-img--small) { width: 35%; }
.rte__editor :deep(figure.rte-img--large) { width: 70%; }
.rte__editor :deep(figure.rte-img--full) { width: 100%; }
.rte__editor :deep(figure.rte-img--small img),
.rte__editor :deep(figure.rte-img--large img),
.rte__editor :deep(figure.rte-img--full img) { width: 100%; }
/* Posisi (align blok) */
.rte__editor :deep(figure.rte-img--align-left) { margin-left: 0; margin-right: auto; }
.rte__editor :deep(figure.rte-img--align-center) { margin-left: auto; margin-right: auto; }
.rte__editor :deep(figure.rte-img--align-right) { margin-left: auto; margin-right: 0; }
.rte__editor :deep(figure.rte-img--align-center figcaption) { text-align: center; }
.rte__editor :deep(figure.rte-img--align-right figcaption) { text-align: right; }
/* Sorotan saat terpilih */
.rte__editor :deep(figure.rte-img--selected) {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.rte__editor:empty::before {
  content: 'Tulis isi konten di sini…';
  color: var(--color-text-subtle);
}

/* ── Toolbar mengambang gambar ── */
.rte__imgbar {
  position: absolute;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}
.rte__imgbar-row { display: flex; align-items: center; gap: 2px; }
.rte__imgbar-grp { display: flex; align-items: center; gap: 2px; }
.rte__imgbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 7px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.rte__imgbar-btn:hover { background: var(--color-bg-subtle); color: var(--color-text-primary); }
.rte__imgbar-btn--on { background: rgba(99, 102, 241, 0.14); color: #6366f1; }
.rte__imgbar-btn--danger:hover { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.rte__imgbar-sep { width: 1px; height: 18px; background: var(--color-border); margin: 0 2px; }

/* Panel detail (alt + caption) */
.rte__detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid var(--color-border);
  min-width: 280px;
}
.rte__detail-field { display: flex; flex-direction: column; gap: 3px; }
.rte__detail-label { font-size: 11px; font-weight: 600; color: var(--color-text-muted); }
.rte__detail-input {
  height: 32px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0 10px;
  font-size: 12.5px;
  font-family: var(--font-sans);
  outline: none;
  color: var(--color-text-primary);
  background: var(--color-surface);
}
.rte__detail-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12); }
.rte__detail-actions { display: flex; justify-content: flex-end; }
.rte__detail-apply {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.rte__detail-apply:hover { background: linear-gradient(135deg, #4f46e5, #7c3aed); }

/* ── Handle resize ── */
.rte__resize {
  position: absolute;
  z-index: 20;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #6366f1;
  border: 2px solid var(--color-surface);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  cursor: nwse-resize;
  touch-action: none;
}

/* ── Popover tautan ── */
.rte__linkpop {
  position: absolute;
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}
.rte__link-input {
  width: 240px;
  height: 30px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0 10px;
  font-size: 12.5px;
  font-family: var(--font-sans);
  outline: none;
  color: var(--color-text-primary);
  background: var(--color-surface);
}
.rte__link-input:focus { border-color: #6366f1; }

.rte__editor :deep(h2) { font-size: 1.4em; font-weight: 600; margin: 0.6em 0 0.3em; }
.rte__editor :deep(h3) { font-size: 1.2em; font-weight: 600; margin: 0.6em 0 0.3em; }
.rte__editor :deep(p) { margin: 0 0 0.7em; }
.rte__editor :deep(ul) { list-style: disc; padding-left: 1.4em; margin: 0 0 0.7em; }
.rte__editor :deep(ol) { list-style: decimal; padding-left: 1.4em; margin: 0 0 0.7em; }
.rte__editor :deep(blockquote) {
  border-left: 3px solid var(--color-border-strong);
  padding-left: 14px;
  color: var(--color-text-muted);
  margin: 0 0 0.7em;
}
.rte__editor :deep(a) { color: #6366f1; text-decoration: underline; }

/* Raw HTML */
.rte__html {
  width: 100%;
  min-height: 280px;
  max-height: 60vh;
  border: none;
  outline: none;
  resize: vertical;
  padding: 16px 18px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--color-text-primary);
  background: var(--color-surface);
}

.rte__msg { font-size: 11.5px; }
.rte__msg--error { color: var(--color-danger); }
</style>
