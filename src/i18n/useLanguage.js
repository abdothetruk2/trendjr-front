import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, languageInfo } from './languages';
import { currentLanguage } from './index';
import { getText } from '../utils/product';
import { useCurrency } from '../currency';

// One hook for components that show translated text or localized data:
//   const { t, lang, dir, text, setLanguage } = useLanguage();
//   text(product.name) -> the name in the active language (English if missing)
export default function useLanguage(namespace) {
  const { t, i18n } = useTranslation(namespace);
  // Components that show text usually show prices too: re-render on a currency change
  const currency = useCurrency();
  const lang = currentLanguage();
  const info = languageInfo(lang);

  const setLanguage = useCallback((code) => {
    if (code !== i18n.language) i18n.changeLanguage(code);
  }, [i18n]);

  const text = useCallback((value) => getText(value, lang), [lang]);

  return { t, i18n, lang, dir: info.dir, locale: info.locale, isRtl: info.dir === 'rtl', text, setLanguage, languages: LANGUAGES, currency };
}
