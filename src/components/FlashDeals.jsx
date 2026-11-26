import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Star, ShoppingCart, Heart, ChevronRight, RotateCw, Eye, BadgePercent } from 'lucide-react';
import ProductImage from './ProductImage';
import useApi from '../hooks/useApi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, getProductView, toNumber } from '../utils/product';
import useLanguage from '../i18n/useLanguage';
import { formatNumber } from '../utils/format';

const QuickView = lazy(() => import('./QuickView'));
const MAX_DEALS = 12;
const TOP_DEALS_PATH = `/api/products?discounted=true&sort=discount&page=1&limit=6`;

// Flash-sale products (GET /api/products/flash, loaded by the page). When there
// are none, the section shows the real biggest discounts instead ("Top deals").
export default function FlashDeals({ products = [], loading = false, error = '', onRetry }) {
  const { t } = useLanguage();
  const flash = (Array.isArray(products) ? products : []).slice(0, MAX_DEALS);
  const useFallback = !loading && !error && flash.length === 0;
  const top = useApi(useFallback ? TOP_DEALS_PATH : null);

  const deals = useFallback ? (Array.isArray(top.data) ? top.data : []) : flash;
  const busy = loading || (useFallback && top.loading);
  const failed = error || (useFallback ? top.error : '');
  const hasDeals = !busy && !failed && deals.length > 0;
  const isFlash = !useFallback;

  return (
    <section id="flash-deals" className="container-page py-5 scroll-mt-24" aria-labelledby="deals-title">
      <div className="card p-5 sm:p-6">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="icon-box-primary w-8 h-8">
                {isFlash
                  ? <Flame className="w-5 h-5 fill-primary text-primary" aria-hidden="true" />
                  : <BadgePercent className="w-5 h-5 text-primary" aria-hidden="true" />}
              </div>
              <div>
                <h2 id="deals-title" className="heading text-lg sm:text-xl leading-none">{isFlash ? t('deals.flashTitle') : t('deals.topTitle')}</h2>
                <p className="text-muted mt-0.5">{isFlash ? t('deals.flashText') : t('deals.topText')}</p>
              </div>
            </div>

            {hasDeals && isFlash && <Countdown />}
          </div>

          {hasDeals && (
            <Link to="/offers" className="link-primary py-1 text-xs sm:text-sm">
              {t('deals.seeAll')} <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        {/* Cards */}
        {busy ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => <DealSkeleton key={i} />)}
          </div>
        ) : failed ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            <span>{t('deals.loadError')} {failed}</span>
            <button type="button" onClick={useFallback ? top.retry : onRetry} className="btn-outline btn-sm">
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.retry')}
            </button>
          </div>
        ) : deals.length === 0 ? (
          <p className="text-sm text-slate-500">{t('deals.empty')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {deals.map((item) => (
              <DealCard key={item.id ?? item._id} product={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DealCard({ product }) {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const [quickView, setQuickView] = useState(false);
  const view = getProductView(product);
  const { id, title, image, imageFallback, price, oldPrice, discount, rating, sold, url } = view;
  const claimed = Math.min(100, toNumber(product.claimedPercent));
  const saved = wishlist.has(id);

  return (
    <article className="group relative rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-md bg-white overflow-hidden flex flex-col transition-all">
      <div className="relative">
        <Link to={url} tabIndex={-1} aria-hidden="true">
          <ProductImage src={image} fallbackSrc={imageFallback} alt={title} sizes="(min-width: 1536px) 230px, (min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw" className="aspect-square" imgClassName={`transition-transform duration-500 group-hover:scale-105 ${view.inStock ? '' : 'opacity-60'}`} />
        </Link>
        {discount > 0 && view.inStock && (
          <span className="absolute top-2 start-2 inline-flex items-center rounded-full bg-gradient-to-r from-rose-600 to-pink-500 px-2 py-0.5 text-[11px] font-extrabold text-white shadow-sm">
            <bdi dir="ltr">−{discount}%</bdi>
          </span>
        )}
        {!view.inStock && (
          <span className="absolute top-2 start-2 rounded-full bg-secondary/90 px-2 py-0.5 text-[11px] font-extrabold text-white">{t('product.soldOut')}</span>
        )}
        <div className="absolute top-2 end-2 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => wishlist.toggle(product)}
            aria-pressed={saved}
            className="grid w-8 h-8 place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200/70 transition active:scale-90 hover:bg-white"
            aria-label={saved ? t('product.removeFromWishlistNamed', { name: title }) : t('product.saveToWishlistNamed', { name: title })}
          >
            <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setQuickView(true)}
            aria-label={t('product.quickViewNamed', { name: title })}
            className="grid w-8 h-8 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm ring-1 ring-slate-200/70 transition hover:bg-white hover:text-primary-600 active:scale-90 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-start text-xs font-semibold text-slate-800 leading-snug">
            <Link to={url} className="line-clamp-2 min-h-[2rem] hover:text-primary-600">{title}</Link>
          </h3>

          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base font-extrabold text-slate-950">{formatPrice(price)}</span>
            {oldPrice > 0 && <span className="price-old text-[11px]"><span className="sr-only">{t('product.was')} </span>{formatPrice(oldPrice)}</span>}
          </div>

          {(rating > 0 || sold > 0) && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              {rating > 0 && (
                <>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <span className="font-semibold text-slate-700"><span className="sr-only">{t('product.rated')} </span>{rating.toFixed(1)}</span>
                </>
              )}
              {sold > 0 && <span>{rating > 0 ? '· ' : ''}{t('product.soldCount', { count: sold, formatted: formatNumber(sold) })}</span>}
            </div>
          )}
        </div>

        <div className="mt-2.5">
          {/* Claimed stock progress (only when the data has it) */}
          {claimed > 0 && (
            <>
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                <span>{t('deals.claimed', { percent: claimed })}</span>
                <span className="text-primary-600">{t('deals.fastSelling')}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600" style={{ width: `${claimed}%` }} />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => addItem(product)}
            disabled={!view.inStock}
            aria-label={view.inStock ? t('product.addToCartNamed', { name: title }) : t('product.soldOutNamed', { name: title })}
            className="btn-light btn-sm mt-2.5 w-full py-1.5 rounded-lg hover:bg-secondary hover:text-white disabled:hover:bg-slate-100"
          >
            <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
            {view.inStock ? t('deals.add') : t('product.soldOut')}
          </button>
        </div>
      </div>

      {quickView && (
        <Suspense fallback={null}>
          <QuickView product={product} open={quickView} onClose={() => setQuickView(false)} />
        </Suspense>
      )}
    </article>
  );
}

function DealSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
      <div className="aspect-square bg-slate-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-11/12 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
        <div className="h-7 w-full rounded-lg bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}

const pad = (n) => String(n).padStart(2, '0');

// Counts down to midnight: these are "today's" deals (the API has no end time).
// Only this small component re-renders every second.
function Countdown() {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const left = Math.max(0, Math.floor((midnight.getTime() - now) / 1000));
  const parts = [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60];

  return (
    <div className="flex items-center gap-1.5 ps-1" role="timer" aria-label={t('deals.timeLeft')}>
      <span className="text-xs font-semibold text-slate-500 me-1">{t('deals.endsIn')}</span>
      <span className="flex items-center gap-1.5" dir="ltr">
      {parts.map((value, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="font-bold text-slate-400">:</span>}
          <span className="min-w-[28px] text-center px-1.5 py-1 rounded-lg bg-secondary text-white font-mono text-xs font-bold">
            {pad(value)}
          </span>
        </React.Fragment>
      ))}
      </span>
    </div>
  );
}
