import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Coins } from 'lucide-react';
import useLanguage from '../i18n/useLanguage';
import { displayCurrency, setCurrency } from '../currency';

// "€" / "EGP" / "$" for a currency in the visitor's language
function currencySymbol(code, locale) {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0).find((part) => part.type === 'currency')?.value || code;
  } catch {
    return code;
  }
}

// Currency picker, styled like the language picker next to it.
// variant: 'header' (dropdown) | 'list' (all options, for the side menu)
export default function CurrencySwitcher({ variant = 'header', className = '' }) {
  const { t, locale, currency } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
  const menuId = useId();
  const active = displayCurrency();

  const options = useMemo(() => {
    let names = null;
    try { names = new Intl.DisplayNames([locale], { type: 'currency' }); } catch { /* old browser */ }
    return currency.currencies.map(({ code }) => ({
      code,
      symbol: currencySymbol(code, locale),
      name: names?.of(code) || code,
    }));
  }, [currency.currencies, locale]);

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

  if (options.length <= 1) return null; // no exchange rates (yet): nothing to choose

  function choose(code) {
    setCurrency(code);
    setOpen(false);
  }

  const current = options.find((o) => o.code === active) || { code: active, symbol: currencySymbol(active, locale), name: active };

  if (variant === 'list') {
    return (
      <div className={`grid grid-cols-3 gap-1.5 ${className}`} role="group" aria-label={t('currency.label')}>
        {options.map((o) => (
          <button
            key={o.code}
            type="button"
            onClick={() => choose(o.code)}
            aria-pressed={o.code === active}
            title={o.name}
            className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-bold transition-colors ${
              o.code === active ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            <span dir="ltr">{o.code}</span>
            {o.symbol !== o.code && <span className="font-semibold text-slate-400" dir="ltr">{o.symbol}</span>}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={wrapper} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('currency.change', { currency: current.name })}
        title={t('currency.label')}
        className="flex h-10 items-center gap-1 rounded-xl px-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <span className="text-slate-400" dir="ltr">{current.symbol !== current.code ? current.symbol : ''}</span>
        <span dir="ltr">{current.code}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          id={menuId}
          role="listbox"
          aria-label={t('currency.label')}
          className="absolute end-0 top-full z-50 mt-1.5 max-h-80 w-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-[fade-in_120ms_ease-out]"
        >
          <li className="flex items-center gap-1.5 px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <Coins className="h-3.5 w-3.5" aria-hidden="true" /> {t('currency.label')}
          </li>
          {options.map((o) => (
            <li key={o.code} role="option" aria-selected={o.code === active}>
              <button
                type="button"
                onClick={() => choose(o.code)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm font-semibold transition-colors ${
                  o.code === active ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-10 shrink-0 font-bold" dir="ltr">{o.code}</span>
                <span className="min-w-0 flex-1 truncate">{o.name}</span>
                <span className="shrink-0 text-xs text-slate-400" dir="ltr">{o.symbol !== o.code ? o.symbol : ''}</span>
                {o.code === active && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
