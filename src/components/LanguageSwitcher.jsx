import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import useLanguage from '../i18n/useLanguage';

// Small inline flags (emoji flags don't show on Windows)
export function Flag({ code, className = 'h-3.5 w-5' }) {
  const common = { className: `${className} shrink-0 rounded-[3px] ring-1 ring-black/10`, 'aria-hidden': true, preserveAspectRatio: 'none' };
  if (code === 'de') {
    return (
      <svg viewBox="0 0 5 3" {...common}>
        <rect width="5" height="1" y="0" fill="#000" />
        <rect width="5" height="1" y="1" fill="#DD0000" />
        <rect width="5" height="1" y="2" fill="#FFCE00" />
      </svg>
    );
  }
  if (code === 'fr') {
    return (
      <svg viewBox="0 0 3 2" {...common}>
        <rect width="1" height="2" x="0" fill="#0055A4" />
        <rect width="1" height="2" x="1" fill="#fff" />
        <rect width="1" height="2" x="2" fill="#EF4135" />
      </svg>
    );
  }
  if (code === 'es') {
    return (
      <svg viewBox="0 0 750 500" {...common}>
        <rect width="750" height="500" fill="#AA151B" />
        <rect width="750" height="250" y="125" fill="#F1BF00" />
        <rect width="34" height="70" x="200" y="215" rx="6" fill="#AA151B" opacity="0.8" />
      </svg>
    );
  }
  if (code === 'ar') {
    // Egypt
    return (
      <svg viewBox="0 0 9 6" {...common}>
        <rect width="9" height="2" y="0" fill="#CE1126" />
        <rect width="9" height="2" y="2" fill="#fff" />
        <rect width="9" height="2" y="4" fill="#000" />
        <path d="M4.5 2.35 L5.05 2.75 L4.85 3.55 L4.5 3.75 L4.15 3.55 L3.95 2.75 Z" fill="#C09300" />
      </svg>
    );
  }
  // United Kingdom
  return (
    <svg viewBox="0 0 60 30" {...common}>
      <clipPath id="uk-flag-clip"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-flag-clip)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

// Language picker for the header (and a compact one for the side menu / admin).
// variant: 'header' | 'dark' (on the navy admin sidebar) | 'list' (all options shown)
export default function LanguageSwitcher({ variant = 'header', className = '' }) {
  const { t, lang, languages, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
  const menuId = useId();
  const current = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!wrapper.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(code) {
    setLanguage(code);
    setOpen(false);
  }

  if (variant === 'list') {
    return (
      <div className={`grid grid-cols-3 gap-1.5 ${className}`} role="group" aria-label={t('language.label')}>
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            onClick={() => choose(l.code)}
            aria-pressed={l.code === lang}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition-colors ${
              l.code === lang ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            <Flag code={l.code} /> {l.name}
          </button>
        ))}
      </div>
    );
  }

  const dark = variant === 'dark';

  return (
    <div ref={wrapper} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('language.change', { language: current.name })}
        title={t('language.label')}
        className={`flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
          dark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <Flag code={current.code} />
        <span>{current.short}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''} ${dark ? 'text-slate-400' : 'text-slate-500'}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          id={menuId}
          role="listbox"
          aria-label={t('language.label')}
          className={`absolute end-0 z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-[fade-in_120ms_ease-out] ${dark ? 'bottom-full mb-1.5' : 'top-full'}`}
        >
          <li className="flex items-center gap-1.5 px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <Globe className="h-3.5 w-3.5" aria-hidden="true" /> {t('language.label')}
          </li>
          {languages.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                lang={l.code}
                onClick={() => choose(l.code)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm font-semibold transition-colors ${
                  l.code === lang ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Flag code={l.code} />
                <span className="flex-1">{l.name}</span>
                {l.code === lang && <Check className="h-4 w-4" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
