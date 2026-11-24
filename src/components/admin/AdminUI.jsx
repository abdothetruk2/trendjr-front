import React, { useEffect, useId, useState } from 'react';
import { Search, X, RotateCw, AlertTriangle, Inbox } from 'lucide-react';
import { Pagination } from '../ProductGrid';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { formatNumber } from '../../utils/format';

// Shared with the store's order pages
export { default as StatusBadge, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../StatusBadge';

// Title row of every admin page
export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-black tracking-tight text-secondary sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Search box: types freely, reports the (debounced) value after a short pause
export function SearchBox({ value, onSearch, placeholder = 'Search…', label = 'Search' }) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft, 350);

  useEffect(() => { setDraft(value); }, [value]); // Back/Forward
  useEffect(() => {
    if (debounced.trim() !== value) onSearch(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="input-icon" aria-hidden="true" />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="input-with-icon pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => { setDraft(''); onSearch(''); }}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options, allLabel = 'All', className = '' }) {
  return (
    <label className={`flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white pl-3 text-xs font-semibold text-slate-500 focus-within:border-primary-500 ${className}`}>
      <span className="whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 cursor-pointer rounded-r-xl bg-transparent py-2.5 pr-3 text-sm font-bold text-slate-800 outline-none sm:flex-none"
      >
        {allLabel !== null && <option value="">{allLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

// One row above the table that holds the search box and filters
// (phones: search on its own row, filters two per row)
export function Toolbar({ children }) {
  return <div className="mb-4 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center [&>*:first-child]:col-span-2">{children}</div>;
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-bold text-secondary">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center" role="alert">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-bold text-secondary">Something went wrong</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-outline btn-sm mt-5">
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}

// Grey rows while a table loads the first time
export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className={`h-4 animate-pulse rounded bg-slate-100 ${c === 0 ? 'w-1/3' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// "Showing 21–40 of 355" + page buttons
export function ListFooter({ page, pageSize, total, shown, onPage }) {
  if (!total) return null;
  const first = (page - 1) * pageSize + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-col items-center gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:justify-between">
      <p className="text-xs text-slate-500" aria-live="polite">
        {shown > 0
          ? <>Showing <strong className="text-slate-700">{formatNumber(first)}–{formatNumber(first + shown - 1)}</strong> of <strong className="text-slate-700">{formatNumber(total)}</strong></>
          : <>{formatNumber(total)} in total</>}
      </p>
      {totalPages > 1 && (
        <div className="[&_nav]:mt-0">
          <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={onPage} />
        </div>
      )}
    </div>
  );
}

// Labelled form control with an optional hint and error
export function Field({ label, hint, error, required = false, children, className = '' }) {
  const id = useId();
  const child = React.isValidElement(children)
    ? React.cloneElement(children, {
      id: children.props.id || id,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
    })
    : children;
  return (
    <div className={className}>
      <label htmlFor={React.isValidElement(children) ? children.props.id || id : undefined} className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}{required && <span className="text-rose-500"> *</span>}
      </label>
      {child}
      {error
        ? <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-rose-600">{error}</p>
        : hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// On/off switch (a real checkbox underneath, so it works with the keyboard)
export function Toggle({ checked, onChange, label, description, disabled = false }) {
  const id = useId();
  return (
    <label htmlFor={id} className={`flex items-start justify-between gap-4 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-primary-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-500" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

// White panel used for tables and forms
export function Panel({ title, description, actions, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-extrabold text-secondary">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
