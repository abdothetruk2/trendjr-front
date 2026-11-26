// Per-page SEO in the active language: <title>, meta description, Open Graph
// locale, canonical link and hreflang alternates (?lang=en|de|ar).
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import i18n, { currentLanguage } from './index';
import { LANGUAGES, DEFAULT_LANGUAGE, languageInfo } from './languages';
import { SITE } from '../config/site';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
}

const defaultTitle = () => i18n.t('seo.defaultTitle', { ns: 'common' });
const defaultDescription = () => i18n.t('seo.defaultDescription', { ns: 'common' });

function apply({ title, description, image }) {
  const fullTitle = title ? `${title} | ${SITE.name}` : defaultTitle();
  const desc = description || defaultDescription();
  document.title = fullTitle;
  setMeta('name', 'description', desc);
  setMeta('property', 'og:title', fullTitle);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:site_name', SITE.name);
  setMeta('property', 'og:locale', languageInfo(currentLanguage()).locale.split('-u-')[0].replace('-', '_'));
  setMeta('property', 'og:image', image || '');
}

// Plain-text summary for meta descriptions
export const toMetaDescription = (text, max = 160) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

// usePageMeta({ title, description }) - leaves the defaults back when the page closes
export function usePageMeta({ title = '', description = '', image = '' } = {}) {
  const lang = currentLanguage();
  useEffect(() => {
    apply({ title, description, image });
    return () => apply({});
  }, [title, description, image, lang]);
}

// Canonical + hreflang alternates for the current URL (rendered once in each layout)
export function useAlternateLinks() {
  const { pathname, search } = useLocation();
  const lang = currentLanguage();
  useEffect(() => {
    const base = SITE.url || window.location.origin;
    const params = new URLSearchParams(search);
    params.delete('lang');
    const urlFor = (code) => {
      const p = new URLSearchParams(params);
      if (code) p.set('lang', code);
      const qs = p.toString();
      return `${base}${pathname}${qs ? `?${qs}` : ''}`;
    };
    setLink('link[rel="canonical"]', { rel: 'canonical', href: urlFor(lang === DEFAULT_LANGUAGE ? '' : lang) });
    LANGUAGES.forEach(({ code, hreflang }) => {
      setLink(`link[rel="alternate"][hreflang="${hreflang}"]`, { rel: 'alternate', hreflang, href: urlFor(code) });
    });
    setLink('link[rel="alternate"][hreflang="x-default"]', { rel: 'alternate', hreflang: 'x-default', href: urlFor('') });
  }, [pathname, search, lang]);
}
