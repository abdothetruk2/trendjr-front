import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, PackageSearch, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from './ProductCard';
import useApi from '../hooks/useApi';
import SectionHeader from './SectionHeader';
import useLanguage from '../i18n/useLanguage';
import { formatPrice } from '../utils/product';

export const PAGE_SIZE = 20; // products per page (fills the 4- and 5-column grids evenly)

// Tabs are quick sort presets; the dropdown offers every sort the API supports.
const TABS = [
  { label: 'grid.tabs.all', sort: 'featured' },
  { label: 'grid.tabs.popular', sort: 'popular' },
  { label: 'grid.tabs.newest', sort: 'newest' },
  { label: 'grid.tabs.rating', sort: 'rating' },
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'grid.sort.featured' },
  { value: 'popular', label: 'grid.sort.popular' },
  { value: 'newest', label: 'grid.sort.newest' },
  { value: 'rating', label: 'grid.sort.rating' },
  { value: 'price-asc', label: 'grid.sort.priceAsc' },
  { value: 'price-desc', label: 'grid.sort.priceDesc' },
  { value: 'discount', label: 'grid.sort.discount' },
];

// The catalog runs from about $2 to $100; at the top end the slider means "any price"
const PRICE_MIN = 5;
const PRICE_MAX = 100; // slider at max = no price filter

// Paginated product list (server-side filters, PAGE_SIZE per page).
// page, sort and price live in the URL (?page=2&sort=price-asc&maxPrice=50), so the
// Back button and bookmarks return to the same page.
// category: category slug ('all' = everything) · search: text · discounted: only offers
// onFirstLoad: called once when the first page has loaded (or failed)
export default function ProductGrid({
  id = 'discover-grid',
  category = 'all',
  search = '',
  discounted = false,
  defaultSort = 'featured',
  onFirstLoad,
  embedded = false, // inside a page layout with a sidebar: no outer padding, fewer columns
  eyebrow = '',
  title = '', // optional section heading (the homepage uses one)
}) {
  const [params, setParams] = useSearchParams();
  const { t } = useLanguage();

  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const sortParam = params.get('sort');
  const sort = SORT_OPTIONS.some((o) => o.value === sortParam) ? sortParam : defaultSort;
  const maxParam = Number(params.get('maxPrice'));
  const maxPrice = maxParam >= PRICE_MIN && maxParam < PRICE_MAX ? maxParam : PRICE_MAX;

  // Change URL params; null removes one. Filter changes replace history, page changes push.
  function updateParams(changes, options) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === undefined) next.delete(key);
        else next.set(key, String(value));
      });
      return next;
    }, options);
  }

  // The slider moves freely; the request waits until it stops for 300ms
  const [priceDraft, setPriceDraft] = useState(maxPrice);
  useEffect(() => { setPriceDraft(maxPrice); }, [maxPrice]); // Back/Forward
  useEffect(() => {
    if (priceDraft === maxPrice) return undefined;
    const timer = setTimeout(() => {
      updateParams({ maxPrice: priceDraft < PRICE_MAX ? priceDraft : null, page: null }, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }); // runs after every render; only acts while the slider differs from the URL

  const setSort = (value) => updateParams({ sort: value === defaultSort ? null : value, page: null }, { replace: true });

  const goToPage = (n) => {
    updateParams({ page: n > 1 ? n : null });
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // One request per page: GET /api/products?page=&limit=&category=...
  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (category && category !== 'all') query.set('category', category);
  if (search) query.set('search', search);
  if (discounted) query.set('discounted', 'true');
  if (sort !== 'featured') query.set('sort', sort);
  if (maxPrice < PRICE_MAX) query.set('maxPrice', String(maxPrice));

  const { data, total, loading, error, retry } = useApi(`/api/products?${query}`);
  const items = !loading && Array.isArray(data) ? data : [];
  const totalPages = total ? Math.ceil(total / PAGE_SIZE) : 1;
  const first = (page - 1) * PAGE_SIZE + 1;

  // Tell the page (once) that the first products are in
  const reported = useRef(false);
  useEffect(() => {
    if (!loading && !reported.current) {
      reported.current = true;
      onFirstLoad?.();
    }
  }, [loading, onFirstLoad]);

  const priceFiltered = maxPrice < PRICE_MAX;
  const gridClass = embedded
    ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4'
    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4';

  return (
    <section id={id} className={`${embedded ? '' : 'container-page '}py-5 scroll-mt-24 min-w-0`}>
      {title && <SectionHeader eyebrow={eyebrow} title={title} id={`${id}-title`} />}

      {/* Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.sort}
              type="button"
              onClick={() => setSort(tab.sort)}
              aria-pressed={sort === tab.sort}
              className={`tab ${sort === tab.sort ? 'tab-active' : 'tab-idle'}`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Price Cap */}
          <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span className="min-w-[4.5rem]">{priceDraft < PRICE_MAX ? t('grid.under', { price: formatPrice(priceDraft, { whole: true }) }) : t('grid.anyPrice')}</span>
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step="5"
              value={priceDraft}
              onChange={(e) => setPriceDraft(Number(e.target.value))}
              className="w-20 accent-primary cursor-pointer"
              aria-label={t('grid.maxPrice')}
            />
          </label>

          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input w-auto px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer"
            aria-label={t('grid.sortLabel')}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{t(option.label)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4 text-muted" aria-live="polite">
        <span>
          {loading ? t('grid.loading') : items.length > 0 ? (
            total !== null
              ? t('grid.showingOf', { from: first, to: first + items.length - 1, total })
              : t('grid.showing', { from: first, to: first + items.length - 1 })
          ) : null}
        </span>
        {!loading && totalPages > 1 && page <= totalPages && <span>{t('grid.pageOf', { page, total: totalPages })}</span>}
      </div>

      {loading ? (
        /* Skeletons: same size as the cards, so nothing jumps */
        <div className={gridClass} aria-busy="true">
          {Array.from({ length: PAGE_SIZE }, (_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="card p-8 text-center" role="alert">
          <p className="font-bold text-slate-900">{t('grid.loadError')}</p>
          <p className="text-muted mt-1">{error}</p>
          <button type="button" onClick={retry} className="btn-primary btn-sm mt-4">
            <RotateCw className="w-3.5 h-3.5" /> {t('common.retry')}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center">
          <PackageSearch className="w-10 h-10 mx-auto text-slate-300" aria-hidden="true" />
          {total > 0 ? (
            <>
              <p className="mt-3 font-bold text-slate-900">{t('grid.noPage', { page })}</p>
              <button type="button" onClick={() => goToPage(1)} className="btn-outline btn-sm mt-4">
                {t('grid.firstPage')}
              </button>
            </>
          ) : (
            <>
              <p className="mt-3 font-bold text-slate-900">{t('grid.empty')}</p>
              <p className="text-muted mt-1">
                {priceFiltered ? t('grid.emptyPrice', { price: formatPrice(maxPrice, { whole: true }) }) : t('grid.emptyHint')}
              </p>
              {priceFiltered && (
                <button type="button" onClick={() => setPriceDraft(PRICE_MAX)} className="btn-outline btn-sm mt-4">
                  {t('grid.clearPrice')}
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className={gridClass}>
          {items.map((product) => (
            <ProductCard key={product.id ?? product._id} product={product} />
          ))}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
      )}
    </section>
  );
}

// 1 … 4 5 6 … 18  (first, last, and the current page ± 1)
export function pageList(current, total) {
  const pages = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - current) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return pages;
}

// Also used by the admin tables
export function Pagination({ page, totalPages, onChange }) {
  const { t } = useLanguage();
  if (totalPages <= 1) return null;

  const arrow = 'inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-secondary transition-colors hover:border-primary-300 hover:text-primary-600 disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label={t('grid.pages')}>
      <button type="button" className={arrow} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" /> {t('grid.prev')}
      </button>

      {pageList(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-slate-400" aria-hidden="true">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-label={t('grid.page', { page: p })}
            aria-current={p === page ? 'page' : undefined}
            className={`h-10 min-w-10 rounded-xl px-3 text-sm font-bold transition-colors ${
              p === page
                ? 'bg-primary-500 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button type="button" className={arrow} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        {t('grid.next')} <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
