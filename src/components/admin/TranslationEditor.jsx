import React, { useEffect, useId, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, Wand2 } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Flag } from '../LanguageSwitcher';
import { LANGUAGES } from '../../i18n/languages';
import useLanguage from '../../i18n/useLanguage';

// Multilingual fields ({ en, de, ar }) for products and categories.
//
//   fields:   [{ key, label, multiline, maxLength, required, placeholder, hint }]
//   values:   { [key]: { en, de, ar } }
//   onChange(key, lang, value)
//   drafts:   Set of "key.lang" filled by AI and not reviewed yet
//   onDrafts(nextSet)
//
// Each language has its own tab with a "missing" indicator. AI translation is optional:
// it only fills EMPTY fields (existing translations are never overwritten) and marks them
// as drafts until the admin edits them or marks them as reviewed.

export const LANGS = LANGUAGES.map((l) => l.code);
export const emptyLocalized = () => Object.fromEntries(LANGS.map((code) => [code, '']));
export const toLocalized = (value) => Object.fromEntries(LANGS.map((code) => [
  code,
  typeof value === 'string' ? (code === 'en' ? value : '') : value?.[code] || '',
]));

// "name.de" style keys of the required-in-English fields that are empty in a language
export function missingTranslations(fields, values, lang) {
  return fields.filter((f) => (f.translate !== false) && values[f.key]?.en?.trim() && !values[f.key]?.[lang]?.trim()).map((f) => f.key);
}

// Is the AI translation service set up on the server? (asked once per page load)
let aiStatus = null;
function useAiStatus() {
  const [status, setStatus] = useState(aiStatus);
  useEffect(() => {
    if (aiStatus) return undefined;
    let alive = true;
    api.get('/api/admin/translate/status')
      .then((res) => { aiStatus = { enabled: Boolean(res.data?.enabled) }; })
      .catch(() => { aiStatus = { enabled: false }; })
      .finally(() => { if (alive) setStatus(aiStatus); });
    return () => { alive = false; };
  }, []);
  return status;
}

export default function TranslationEditor({ fields, values, onChange, drafts, onDrafts, errors = {}, title, description }) {
  const { t } = useLanguage('admin');
  const toast = useToast();
  const ai = useAiStatus();
  const baseId = useId();
  const [active, setActive] = useState('en');
  const [translating, setTranslating] = useState(false);

  const missing = Object.fromEntries(LANGS.map((lang) => [
    lang,
    lang === 'en'
      ? fields.filter((f) => f.required && !values[f.key]?.en?.trim()).map((f) => f.key)
      : missingTranslations(fields, values, lang),
  ]));
  const draftsIn = (lang) => [...drafts].filter((d) => d.endsWith(`.${lang}`)).length;
  const totalMissing = LANGS.filter((code) => code !== 'en').reduce((sum, code) => sum + missing[code].length, 0);

  function edit(key, lang, value) {
    onChange(key, lang, value);
    const id = `${key}.${lang}`;
    if (drafts.has(id)) {
      const next = new Set(drafts);
      next.delete(id); // edited by hand = reviewed
      onDrafts(next);
    }
  }

  function markReviewed(lang) {
    onDrafts(new Set([...drafts].filter((d) => !d.endsWith(`.${lang}`))));
  }

  // Fill the empty German/Arabic fields from the English text (never overwrites)
  async function translateMissing() {
    const jobs = {};
    for (const lang of LANGS.filter((code) => code !== 'en')) {
      for (const key of missingTranslations(fields, values, lang)) {
        (jobs[lang] ||= []).push(key);
      }
    }
    const langs = Object.keys(jobs);
    if (langs.length === 0) {
      toast.info(t('translate.nothingMissing'));
      return;
    }
    const source = Object.fromEntries(fields.filter((f) => f.translate !== false && values[f.key]?.en?.trim()).map((f) => [f.key, values[f.key].en.trim()]));
    setTranslating(true);
    try {
      const res = await api.post('/api/admin/translate', { from: 'en', to: langs, fields: source }, { timeout: 90000 });
      const result = res.data?.translations || {};
      const next = new Set(drafts);
      let filled = 0;
      for (const lang of langs) {
        for (const key of jobs[lang]) {
          const text = result[lang]?.[key];
          // Re-check: the admin may have typed something while the request ran
          if (typeof text === 'string' && text.trim() && !values[key]?.[lang]?.trim()) {
            onChange(key, lang, text.trim());
            next.add(`${key}.${lang}`);
            filled += 1;
          }
        }
      }
      onDrafts(next);
      if (filled) {
        toast.success(t('translate.filled', { count: filled }));
        setActive(langs[0]);
      } else {
        toast.error(t('translate.noResult'));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTranslating(false);
    }
  }

  const tabId = (lang) => `${baseId}-tab-${lang}`;
  const panelId = (lang) => `${baseId}-panel-${lang}`;
  const info = LANGUAGES.find((l) => l.code === active);

  return (
    <div className="rounded-2xl border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-secondary">{title || t('translate.title')}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {description || (totalMissing
              ? t('translate.missingSummary', { count: totalMissing })
              : t('translate.complete'))}
          </p>
        </div>
        <button
          type="button"
          onClick={translateMissing}
          disabled={translating || !ai?.enabled || totalMissing === 0}
          title={ai && !ai.enabled ? t('translate.notConfigured') : undefined}
          className="btn-outline btn-sm"
        >
          {translating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Wand2 className="h-4 w-4 text-primary-500" aria-hidden="true" />}
          {translating ? t('translate.working') : t('translate.button')}
        </button>
      </div>
      {ai && !ai.enabled && (
        <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">{t('translate.notConfigured')}</p>
      )}

      <div role="tablist" aria-label={t('translate.languages')} className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 pt-2">
        {LANGUAGES.map((l) => {
          const count = missing[l.code].length;
          const pending = draftsIn(l.code);
          const selected = active === l.code;
          return (
            <button
              key={l.code}
              id={tabId(l.code)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId(l.code)}
              onClick={() => setActive(l.code)}
              className={`relative flex shrink-0 items-center gap-2 rounded-t-xl px-3.5 py-2.5 text-sm font-bold transition-colors ${
                selected ? 'bg-white text-primary-700 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Flag code={l.code} />
              <span lang={l.code}>{l.name}</span>
              {count > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800" title={t('translate.missingIn', { count })}>
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" /> {count}
                  <span className="sr-only">{t('translate.missingIn', { count })}</span>
                </span>
              ) : pending > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-extrabold text-violet-800" title={t('translate.toReview', { count: pending })}>
                  <Sparkles className="h-3 w-3" aria-hidden="true" /> {pending}
                  <span className="sr-only">{t('translate.toReview', { count: pending })}</span>
                </span>
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label={t('translate.done')} />
              )}
              {selected && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary-500" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div id={panelId(active)} role="tabpanel" aria-labelledby={tabId(active)} className="space-y-4 p-4">
        {draftsIn(active) > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-900">
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{t('translate.reviewNote')}</span>
            <button type="button" onClick={() => markReviewed(active)} className="rounded-lg bg-white px-2.5 py-1 font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
              {t('translate.markReviewed')}
            </button>
          </div>
        )}

        {fields.map((field) => {
          const value = values[field.key]?.[active] || '';
          const english = values[field.key]?.en || '';
          const isDraft = drafts.has(`${field.key}.${active}`);
          const isMissing = active !== 'en' && field.translate !== false && english.trim() && !value.trim();
          const inputId = `${baseId}-${field.key}-${active}`;
          const Tag = field.multiline ? 'textarea' : 'input';
          const error = active === 'en' ? errors[field.key] : undefined;
          return (
            <div key={field.key}>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <label htmlFor={inputId} className="text-xs font-bold text-slate-600">
                  {field.label} <span className="font-semibold text-slate-400">({info.short})</span>
                  {field.required && active === 'en' && <span className="text-rose-500"> *</span>}
                </label>
                {isMissing && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" /> {t('translate.missing')}
                  </span>
                )}
                {isDraft && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-extrabold text-violet-800">
                    <Sparkles className="h-3 w-3" aria-hidden="true" /> {t('translate.aiDraft')}
                  </span>
                )}
              </div>
              <Tag
                id={inputId}
                value={value}
                onChange={(e) => edit(field.key, active, e.target.value)}
                lang={active}
                dir={info.dir}
                maxLength={field.maxLength}
                placeholder={active === 'en' ? field.placeholder : english ? t('translate.translationOf', { text: english.slice(0, 60) }) : ''}
                aria-invalid={error ? true : undefined}
                className={`input ${field.multiline ? 'min-h-32' : ''} ${field.mono ? 'font-mono text-xs' : ''} ${isDraft ? 'border-violet-300 bg-violet-50/40' : isMissing ? 'border-amber-300' : ''}`}
              />
              {error ? (
                <p className="mt-1.5 text-xs font-semibold text-rose-600">{error}</p>
              ) : active !== 'en' && english ? (
                <p className="mt-1.5 line-clamp-2 text-[11px] text-slate-400" dir="ltr" lang="en">
                  <span className="font-bold">EN:</span> {english}
                </p>
              ) : field.hint ? (
                <p className="mt-1.5 text-xs text-slate-400">{field.hint}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// EN / DE / AR chips: which languages have a name
export function TranslationStatus({ value }) {
  const { t } = useLanguage('admin');
  const names = toLocalized(value);
  return (
    <div className="flex items-center gap-1">
      {LANGS.map((code) => (
        <span
          key={code}
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${names[code] ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-800"}`}
          title={names[code] ? names[code] : t("translate.missing")}
        >
          <Flag code={code} className="h-2.5 w-3.5" /> {code.toUpperCase()}
          <span className="sr-only">{names[code] ? t("translate.done") : t("translate.missing")}</span>
        </span>
      ))}
    </div>
  );
}
