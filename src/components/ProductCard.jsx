import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Eye, Heart, PackageX, ShoppingCart, Star, Zap } from 'lucide-react';
import ProductImage from './ProductImage';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, getProductImages, getProductView, webpCopies } from '../utils/product';
import useLanguage from '../i18n/useLanguage';
import { formatNumber } from '../utils/format';

// Loaded the first time someone opens a Quick View
const QuickView = lazy(() => import('./QuickView'));

// "$1,234.56" shown as "$1,234" + smaller ".56"; screen readers get the plain price
export function PriceTag({ value, className = '' }) {
  const text = formatPrice(value);
  // the decimal separator of the visitor's language ("." or ",")
  const sep = formatPrice(1.5).replace(/[^.,]/g, '').slice(-1) || '.';
  const dot = text.lastIndexOf(sep);
  return (
    <span className={`font-extrabold tracking-tight text-slate-950 ${className}`} dir="ltr">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {dot === -1 ? text : text.slice(0, dot)}
        {dot !== -1 && <span className="text-[0.62em] font-bold">{text.slice(dot)}</span>}
      </span>
    </span>
  );
}

// How wide a card photo is shown (2 columns on phones ... 6 on wide screens)
const CARD_IMAGE_SIZES = '(min-width: 1536px) 240px, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw';

// The product's second photo, shown over the first while the card is hovered.
// Stays invisible until it has loaded, so there is never a grey flash.
// Tries the small WebP copies, then the original, then the supplier's copy.
function HoverPhoto({ photo }) {
  const copies = webpCopies(photo.src);
  const chain = [
    copies && { src: copies.src, srcSet: copies.srcSet },
    photo.src && { src: photo.src },
    photo.fallbackSrc && { src: photo.fallbackSrc },
  ].filter(Boolean);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const current = chain[step];
  if (!current) return null;
  return (
    <img
      key={current.src}
      src={current.src}
      srcSet={current.srcSet}
      sizes={current.srcSet ? CARD_IMAGE_SIZES : undefined}
      alt=""
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setStep((s) => s + 1)}
      className={`absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 motion-reduce:transition-none ${
        loaded ? 'group-hover:opacity-100' : ''
      }`}
    />
  );
}

export default function ProductCard({
  product,
  language,
  onAddToCart,
  onToggleWishlist,
  priority = false,
}) {

  const { addItem } = useCart();
  const { t, lang } = useLanguage();
  const wishlist = useWishlist();
  const [added, setAdded] = useState(false);
  const [pop, setPop] = useState(false);
  const [hovered, setHovered] = useState(false); // load the 2nd photo only once someone hovers
  const [quickView, setQuickView] = useState(false);
  const addedTimer = useRef(null);
  const popTimer = useRef(null);

  useEffect(() => () => {
    clearTimeout(addedTimer.current);
    clearTimeout(popTimer.current);
  }, []);

  if (!product) return null;

  const view = getProductView(product, language || lang);
  const { id, title, image, imageFallback, price, oldPrice, discount, rating, reviews, sold, brand, url } = view;
  const secondPhoto = getProductImages(product)[1];
  const saved = wishlist.has(id);
  const soldOut = !view.inStock;

  function handleAddToCart() {
    const ok = onAddToCart ? (onAddToCart(product), true) : addItem(product);
    if (!ok) return;
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1600);
  }

  function handleWishlist() {
    if (onToggleWishlist) onToggleWishlist(product);
    else wishlist.toggle(product);
    setPop(true);
    clearTimeout(popTimer.current);
    popTimer.current = setTimeout(() => setPop(false), 250);
  }

  return (

    <article
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(true); }}
      className="
        group relative flex flex-col overflow-hidden
        rounded-2xl border border-slate-200/80 bg-white
        shadow-[0_1px_2px_rgb(15_23_42/0.04)]
        transition-[translate,box-shadow,border-color] duration-300 ease-out
        hover:-translate-y-1 hover:border-primary-200
        hover:shadow-[0_22px_44px_-22px_rgb(78_13_108/0.38)]
        focus-within:border-primary-300
        motion-reduce:transition-none motion-reduce:hover:translate-y-0
      "
    >

      {/* IMAGE (square: matches the product photos, no layout shift) */}

      <div className="relative">

        <Link to={url} tabIndex={-1} aria-hidden="true" className="block">
          <ProductImage
            src={image}
            fallbackSrc={imageFallback}
            alt={title}
            priority={priority}
            sizes={CARD_IMAGE_SIZES}
            className="aspect-square"
            imgClassName={`transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${soldOut ? 'opacity-60' : ''}`}
          />
          {/* Second photo fades in on hover (mouse only; fetched on first hover) */}
          {secondPhoto && hovered && <HoverPhoto photo={secondPhoto} />}
        </Link>

        {/* Soft shade that rises on hover, so the badges stay readable */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />

        {/* BADGES */}

        {(discount > 0 || product.flash_sale || product.isNew || soldOut) && (
          <div className="pointer-events-none absolute start-2.5 top-2.5 flex flex-col items-start gap-1.5">

            {soldOut && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/90 px-2.5 py-1 text-[11px] font-extrabold leading-none text-white shadow-sm">
                <PackageX className="h-3 w-3" aria-hidden="true" /> {t('product.soldOut')}
              </span>
            )}

            {discount > 0 && !soldOut && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-rose-600 to-pink-500 px-2.5 py-1 text-[11px] font-extrabold leading-none tracking-wide text-white shadow-md shadow-rose-600/25">
                <bdi dir="ltr">−{discount}%</bdi>
              </span>
            )}

            {product.flash_sale && !soldOut && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-[10px] font-extrabold uppercase leading-none tracking-wide text-amber-950 shadow-sm">
                <Zap className="h-3 w-3 fill-current" aria-hidden="true" /> {t('product.flash')}
              </span>
            )}

            {product.isNew && (
              <span className="badge-secondary rounded-full">{t('product.new')}</span>
            )}

          </div>
        )}

        {/* WISHLIST + QUICK VIEW */}

        <div className="absolute end-2.5 top-2.5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleWishlist}
            aria-pressed={saved}
            aria-label={saved ? t('product.removeFromWishlistNamed', { name: title }) : t('product.saveToWishlistNamed', { name: title })}
            title={saved ? t('product.removeFromWishlist') : t('product.saveToWishlist')}
            className={`
              grid h-9 w-9 place-items-center rounded-full
              shadow-sm ring-1 backdrop-blur transition-all duration-200 active:scale-90
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500
              ${saved ? 'bg-rose-50 ring-rose-200' : 'bg-white/90 ring-slate-200/70 hover:bg-white hover:ring-rose-200'}
            `}
          >
            <Heart
              className={`h-4.5 w-4.5 transition-transform duration-200 ${pop ? 'scale-125' : 'scale-100'} ${
                saved ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
              }`}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={() => setQuickView(true)}
            aria-label={t('product.quickViewNamed', { name: title })}
            title={t('product.quickView')}
            className="
              grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm ring-1 ring-slate-200/70 backdrop-blur
              transition-all duration-200 hover:bg-white hover:text-primary-600 active:scale-90
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500
              pointer-fine:opacity-0 pointer-fine:translate-y-1 pointer-fine:group-hover:opacity-100 pointer-fine:group-hover:translate-y-0
              pointer-fine:focus-visible:opacity-100 pointer-fine:focus-visible:translate-y-0
            "
          >
            <Eye className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

      </div>

      {/* DETAILS */}

      <div className="flex flex-1 flex-col p-3 sm:p-3.5">

        {brand && (
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {brand}
          </p>
        )}

        <h3 className="mt-1 text-start text-sm font-semibold leading-snug text-slate-800">
          <Link
            to={url}
            className="line-clamp-2 min-h-[2.5rem] transition-colors hover:text-primary-600 focus-visible:underline focus-visible:outline-none"
          >
            {title}
          </Link>
        </h3>

        {/* RATING & SALES (only when there is data) */}

        {(rating > 0 || reviews > 0 || sold > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500">

            {rating > 0 && (
              <span className="inline-flex items-center gap-0.5 font-bold text-slate-700">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="sr-only">{t('product.rated')}</span>
                {rating.toFixed(1)}
              </span>
            )}

            {reviews > 0 && <span>({t('product.reviewsCount', { count: reviews, formatted: formatNumber(reviews) })})</span>}

            {sold > 0 && <span>{rating > 0 || reviews > 0 ? '· ' : ''}{t('product.soldCount', { count: sold, formatted: formatNumber(sold) })}</span>}

          </div>
        )}

        {/* PRICE & CART (pinned to the bottom so every card in a row lines up) */}

        <div className="mt-auto pt-3">

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <PriceTag value={price} className="text-lg sm:text-xl" />
            {oldPrice > 0 && (
              <span className="text-xs font-medium text-slate-400 line-through">
                <span className="sr-only">{t('product.was')} </span>{formatPrice(oldPrice)}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex min-h-4 flex-wrap items-center gap-x-2 text-[11px] font-bold">
            {oldPrice > 0 && <span className="text-emerald-600">{t('product.save', { amount: formatPrice(oldPrice - price) })}</span>}
            {view.lowStock && <span className="text-amber-600">{t('product.onlyLeft', { count: view.stock })}</span>}
          </div>

          {/* ADD TO CART */}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={soldOut}
            aria-label={soldOut ? t('product.soldOutNamed', { name: title }) : t('product.addToCartNamed', { name: title })}
            className={`
              mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5
              text-xs font-bold transition-all duration-200 active:scale-[0.98] sm:text-sm
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500
              disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none
              ${added
                ? 'bg-emerald-600 text-white'
                : 'bg-secondary text-white hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/25'}
            `}
          >
            {soldOut ? (
              <>{t('product.soldOut')}</>
            ) : added ? (
              <><Check className="h-4 w-4" aria-hidden="true" /> {t('product.added')}</>
            ) : (
              <><ShoppingCart className="h-4 w-4" aria-hidden="true" /> {t('product.addToCart')}</>
            )}
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

// Placeholder with the same layout as a product card (used while products load)
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col" aria-hidden="true">
      <div className="aspect-square bg-slate-200 animate-pulse" />
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col">
        <div className="h-2.5 w-1/3 rounded bg-slate-200 animate-pulse" />
        <div className="mt-2 space-y-2">
          <div className="h-3.5 w-11/12 rounded bg-slate-200 animate-pulse" />
          <div className="h-3.5 w-2/3 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="mt-auto pt-3">
          <div className="h-6 w-20 rounded bg-slate-200 animate-pulse" />
          <div className="mt-3 h-9 w-full rounded-xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
