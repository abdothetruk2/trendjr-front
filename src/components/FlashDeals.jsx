import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Star, ShoppingCart, Heart, ChevronRight, RotateCw } from 'lucide-react';
import ProductImage from './ProductImage';
import { useCart } from '../context/CartContext';
import { formatPrice, getProductView, toNumber } from '../utils/product';

const MAX_DEALS = 12;

// Flash-sale products (GET /api/products/flash), loaded by the page.
export default function FlashDeals({ products = [], loading = false, error = '', onRetry }) {
  const deals = (Array.isArray(products) ? products : []).slice(0, MAX_DEALS);
  const hasDeals = !loading && !error && deals.length > 0;

  return (
    <section id="flash-deals" className="container-page py-5 scroll-mt-24">
      <div className="card p-5 sm:p-6">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="icon-box-primary w-8 h-8">
                <Flame className="w-5 h-5 fill-primary text-primary" />
              </div>
              <div>
                <h2 className="heading text-lg sm:text-xl leading-none">Flash Deals</h2>
                <p className="text-muted mt-0.5">Today&apos;s lightning drops</p>
              </div>
            </div>

            {hasDeals && <Countdown />}
          </div>

          {hasDeals && (
            <Link to="/offers" className="link-primary text-xs sm:text-sm">
              See all deals <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => <DealSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            <span>Couldn&apos;t load flash deals. {error}</span>
            <button type="button" onClick={onRetry} className="btn-outline btn-sm">
              <RotateCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        ) : deals.length === 0 ? (
          <p className="text-sm text-slate-500">No flash deals right now — check back soon.</p>
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
  const { addItem } = useCart();
  const { id, title, image, imageFallback, price, oldPrice, discount, rating } = getProductView(product);
  const sold = toNumber(product.sold);
  const claimed = Math.min(100, toNumber(product.claimedPercent));
  const url = `/product/${id}`;

  return (
    <div className="group rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-md bg-white overflow-hidden flex flex-col transition-all">
      <div className="relative">
        <Link to={url} tabIndex={-1} aria-hidden="true">
          <ProductImage src={image} fallbackSrc={imageFallback} alt={title} className="aspect-square" imgClassName="group-hover:scale-105" />
        </Link>
        {discount > 0 && <span className="badge-primary absolute top-2 left-2">-{discount}%</span>}
        <button
          type="button"
          className="btn-wish top-2 right-2 w-7 h-7"
          aria-label={`Save ${title} to wishlist`}
        >
          <Heart className="w-3.5 h-3.5 text-slate-600" />
        </button>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <Link to={url}>
            <h3 className="text-left text-xs font-semibold text-slate-800 line-clamp-2 min-h-[2rem] hover:text-primary-600 leading-snug">
              {title}
            </h3>
          </Link>

          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="price text-base">{formatPrice(price)}</span>
            {oldPrice > 0 && <span className="price-old text-[11px]">{formatPrice(oldPrice)}</span>}
          </div>

          {(rating > 0 || sold > 0) && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              {rating > 0 && (
                <>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-700">{rating.toFixed(1)}</span>
                </>
              )}
              {sold > 0 && <span>· {sold.toLocaleString()} sold</span>}
            </div>
          )}
        </div>

        <div className="mt-2.5">
          {/* Claimed stock progress (only when the data has it) */}
          {claimed > 0 && (
            <>
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                <span>{claimed}% claimed</span>
                <span className="text-primary-600">Fast selling</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                  style={{ width: `${claimed}%` }}
                />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => addItem(product)}
            aria-label={`Add ${title} to cart`}
            className="btn-light btn-sm mt-2.5 w-full py-1.5 rounded-lg hover:bg-secondary hover:text-white"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>
    </div>
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
    <div className="flex items-center gap-1.5 pl-1" role="timer" aria-label="Time left for today's deals">
      <span className="text-xs font-semibold text-slate-500 mr-1">Ends in</span>
      {parts.map((value, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="font-bold text-slate-400">:</span>}
          <span className="min-w-[28px] text-center px-1.5 py-1 rounded-lg bg-secondary text-white font-mono text-xs font-bold">
            {pad(value)}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
