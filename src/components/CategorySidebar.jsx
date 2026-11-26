import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LayoutGrid, RotateCw, SlidersHorizontal } from 'lucide-react';
import Drawer from './Drawer';
import useCategories from '../hooks/useCategories';
import { categoryTree } from '../utils/categories';
import { getCategoryLabel } from '../utils/product';
import useLanguage from '../i18n/useLanguage';

const total = (category) =>
  (category.productCount || 0) + (category.children || []).reduce((sum, child) => sum + (child.productCount || 0), 0);

// Category navigation for the Shop and Category pages: a sticky column on wide
// screens; on phones and tablets a button that opens the same list in a drawer.
// active: current category slug ('all' = every product) · hrefFor(slug): link target
export default function CategorySidebar({ active = 'all', hrefFor }) {
  const { data, loading, error, retry } = useCategories();
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const tree = useMemo(() => categoryTree(data), [data, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCategory = useMemo(() => {
    for (const root of tree) {
      if (root.slug === active) return root;
      const child = root.children.find((c) => c.slug === active);
      if (child) return child;
    }
    return null;
  }, [tree, active]);

  const list = (
    <CategoryTree tree={tree} active={active} hrefFor={hrefFor} loading={loading} error={error} retry={retry} onNavigate={() => setOpen(false)} />
  );

  return (
    <>
      {/* Phones & tablets */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-controls="category-drawer"
          className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-start text-sm shadow-sm transition-colors hover:border-primary-300"
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-primary-500" aria-hidden="true" />
          <span className="text-slate-500">{t('categories.categoryLabel')}</span>
          <strong className="min-w-0 flex-1 truncate text-secondary">{activeCategory ? getCategoryLabel(activeCategory) : t('categories.allProducts')}</strong>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        </button>
        <Drawer open={open} onClose={() => setOpen(false)} title={t('nav.categories')} id="category-drawer" closeLabel={t('categories.close')}>
          <div className="p-3">{list}</div>
        </Drawer>
      </div>

      {/* Desktop */}
      <aside className="hidden lg:block" aria-label={t('nav.categories')}>
        <div className="card sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('nav.categories')}</p>
          {list}
        </div>
      </aside>
    </>
  );
}

function CategoryTree({ tree, active, hrefFor, loading, error, retry, onNavigate }) {
  const { t } = useLanguage();
  const activeRoot = tree.find((c) => c.slug === active || c.children.some((child) => child.slug === active))?.slug;
  const [expanded, setExpanded] = useState(() => new Set(activeRoot ? [activeRoot] : []));

  // Open the branch of the category being viewed
  useEffect(() => {
    if (activeRoot) setExpanded((set) => (set.has(activeRoot) ? set : new Set([...set, activeRoot])));
  }, [activeRoot]);

  const toggle = (slug) => setExpanded((set) => {
    const next = new Set(set);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    return next;
  });

  const rowClass = (isActive) => `flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
    isActive ? 'bg-primary-50 font-bold text-primary-700' : 'font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950'
  }`;
  const count = (n) => <span className="ms-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-500">{n}</span>;

  if (loading) {
    return (
      <div className="space-y-2 px-1" aria-busy="true" aria-label={t('categories.loading')}>
        {Array.from({ length: 7 }, (_, i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />)}
      </div>
    );
  }
  if (error) {
    return (
      <button type="button" onClick={retry} className="mx-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700">
        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> {t('categories.loadError')}
      </button>
    );
  }

  const visible = tree.filter((c) => total(c) > 0 || c.slug === activeRoot);

  return (
    <nav aria-label={t('categories.productCategories')}>
      <ul className="space-y-0.5">
        <li>
          <Link to={hrefFor('all')} onClick={onNavigate} aria-current={active === 'all' ? 'page' : undefined} className={rowClass(active === 'all')}>
            <LayoutGrid className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /> {t('categories.allProducts')}
          </Link>
        </li>
        {visible.map((category) => {
          const children = category.children.filter((c) => (c.productCount || 0) > 0 || c.slug === active);
          const isOpen = expanded.has(category.slug);
          const listId = `sidebar-sub-${category.slug}`;
          return (
            <li key={category._id ?? category.slug}>
              <div className="flex items-center gap-1">
                <Link
                  to={hrefFor(category.slug)}
                  onClick={onNavigate}
                  aria-current={active === category.slug ? 'page' : undefined}
                  className={rowClass(active === category.slug)}
                >
                  <span className="truncate">{getCategoryLabel(category)}</span>
                  {count(total(category))}
                </Link>
                {children.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggle(category.slug)}
                    aria-expanded={isOpen}
                    aria-controls={listId}
                    aria-label={t(isOpen ? 'categories.hideSub' : 'categories.showSub', { name: getCategoryLabel(category) })}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                )}
              </div>
              {children.length > 0 && isOpen && (
                <ul id={listId} className="ms-4 mt-0.5 space-y-0.5 border-s border-slate-100 ps-2 animate-[fade-in_150ms_ease-out]">
                  {children.map((child) => (
                    <li key={child._id ?? child.slug}>
                      <Link
                        to={hrefFor(child.slug)}
                        onClick={onNavigate}
                        aria-current={active === child.slug ? 'page' : undefined}
                        className={`${rowClass(active === child.slug)} py-1.5 text-[13px]`}
                      >
                        <span className="truncate">{getCategoryLabel(child)}</span>
                        {count(child.productCount || 0)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
