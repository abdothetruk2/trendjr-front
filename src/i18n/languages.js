// The store's languages. English is the default and the fallback for any
// missing translation (UI text and product content alike).
export const LANGUAGES = [
  { code: 'en', name: 'English', short: 'EN', dir: 'ltr', locale: 'en-US', hreflang: 'en' },
  { code: 'de', name: 'Deutsch', short: 'DE', dir: 'ltr', locale: 'de-DE', hreflang: 'de' },
  // Latin digits ("nu-latn") keep prices, phone numbers and order numbers easy to read
  { code: 'ar', name: 'العربية', short: 'AR', dir: 'rtl', locale: 'ar-u-nu-latn', hreflang: 'ar' },
  { code: 'fr', name: 'Français', short: 'FR', dir: 'ltr', locale: 'fr-FR', hreflang: 'fr' },
  { code: 'es', name: 'Español', short: 'ES', dir: 'ltr', locale: 'es-ES', hreflang: 'es' },
];

export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);
export const STORAGE_KEY = 'trendjr_lang';

export const isSupported = (code) => LANGUAGE_CODES.includes(code);
export const languageInfo = (code) => LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];

// First visit: the browser's language when the store has it (de, ar, fr, es), else en.
// A ?lang= link (used by the hreflang alternates) or a saved choice wins.
export function detectLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (isSupported(fromUrl)) return fromUrl;
  } catch { /* ignore */ }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) return saved;
  } catch { /* private mode */ }
  const browser = String(window.navigator?.language || window.navigator?.languages?.[0] || '').toLowerCase();
  const code = browser.slice(0, 2);
  return isSupported(code) ? code : DEFAULT_LANGUAGE;
}

export function saveLanguage(code) {
  try { window.localStorage.setItem(STORAGE_KEY, code); } catch { /* private mode */ }
}
