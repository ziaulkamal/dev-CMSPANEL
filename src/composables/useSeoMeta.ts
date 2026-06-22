/**
 * src/composables/useSeoMeta.ts
 * Set <title> & meta SEO/OG reaktif untuk SPA (sampai SSR/SSG diadopsi).
 */
import { watchEffect, type MaybeRefOrGetter, toValue } from 'vue';

export interface SeoMeta {
  title?: string;
  description?: string;
  image?: string;
}

/** Upsert <meta name|property=...> tunggal di <head>. */
function setMeta(attr: 'name' | 'property', key: string, value?: string) {
  if (!value) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

export function useSeoMeta(source: MaybeRefOrGetter<SeoMeta>): void {
  watchEffect(() => {
    const m = toValue(source);
    if (m.title) document.title = m.title;
    setMeta('name', 'description', m.description);
    setMeta('property', 'og:title', m.title);
    setMeta('property', 'og:description', m.description);
    setMeta('property', 'og:image', m.image);
  });
}
