// i18next setup. Translations live in src/locales/<lang>/<namespace>.json:
//   common - the store (header, pages, cart, checkout, account, messages)
//   admin  - the admin dashboard (loaded only when an admin opens it)
//   server - readable versions of the API's (English) messages
// Only the active language's files are downloaded (each JSON is its own chunk).
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, LANGUAGE_CODES, detectLanguage, languageInfo, saveLanguage } from './languages';

// import.meta.glob (not a template-literal import): each file stays its own lazy
// chunk, and it works with any folder name (the dynamic-import helper breaks on
// paths containing parentheses, like this project's).
const loaders = import.meta.glob('../locales/*/*.json');

const lazyJson = {
  type: 'backend',
  init() {},
  read(language, namespace, callback) {
    const load = loaders[`../locales/${language}/${namespace}.json`];
    if (!load) {
      callback(new Error(`No translations for ${language}/${namespace}`), null);
      return;
    }
    load()
      .then((module) => callback(null, module.default))
      .catch((error) => callback(error, null));
  },
};

// <html lang dir>, the saved choice and the Arabic web font
export function applyDocumentLanguage(code) {
  const info = languageInfo(code);
  const html = document.documentElement;
  html.lang = info.code;
  html.dir = info.dir;
  saveLanguage(info.code);
  if (info.code === 'ar' && !document.getElementById('font-ar')) {
    const link = document.createElement('link');
    link.id = 'font-ar';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }
}

i18n.on('languageChanged', (code) => {
  if (typeof document !== 'undefined') applyDocumentLanguage(code);
});

export const i18nReady = i18n
  .use(lazyJson)
  .use(initReactI18next)
  .init({
    lng: detectLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: LANGUAGE_CODES,
    nonExplicitSupportedLngs: false,
    load: 'languageOnly',
    ns: ['common', 'server'],
    defaultNS: 'common',
    fallbackNS: 'common', // the admin namespace can use the shared store words
    interpolation: { escapeValue: false }, // React escapes already
    returnNull: false,
    react: { useSuspense: true, bindI18nStore: 'added' },
  });

// The active language code ('en' | 'de' | 'ar')
export const currentLanguage = () => {
  const code = i18n.resolvedLanguage || i18n.language || DEFAULT_LANGUAGE;
  return LANGUAGE_CODES.includes(code) ? code : DEFAULT_LANGUAGE;
};

export const currentLocale = () => languageInfo(currentLanguage()).locale;
export const isRtl = () => languageInfo(currentLanguage()).dir === 'rtl';

export default i18n;
