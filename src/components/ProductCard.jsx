import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Heart, ShoppingCart, Star, Zap } from 'lucide-react';
import ProductImage from './ProductImage';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, getProductView, toNumber } from '../utils/product';

// "$1,234.56" shown as "$1,234" + smaller ".56"; screen readers get the plain price
export function PriceTag({ value, className = '' }) {
  const text = formatPrice(value);
  const dot = text.lastIndexOf('.');
  return (
    <span className={`font-extrabold tracking-tight text-slate-950 ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {dot === -1 ? text : text.slice(0, dot)}
        {dot !== -1 && <span className="text-[0.62em] font-bold">{text.slice(dot)}</span>}
      </span>
    </span>
  );
}

export default function ProductCard({
  product,
  language = 'en',
  onAddToCart,
  onToggleWishlist
}) {

  const { addItem } = useCart();
  const wishlist = useWishlist();
  const [added, setAdded] = useState(false);
  const [pop, setPop] = useState(false);
  const addedTimer = useRef(null);
  const popTimer = useRef(null);

  useEffect(() => () => {
    clearTimeout(addedTimer.current);
    clearTimeout(popTimer.current);
  }, []);

  if (!product) return null;

  const { id, title, image, imageFallback, price, oldPrice, discount, rating, reviews, stock, brand } =
    getProductView(product, language);
  const sold = toNumber(product.sold);
  const productUrl = `/product/${id}`;
  const saved = wishlist.has(id);
  const lowStock = stock > 0 && stock <= 5; // 0 means "not specified" in the imported data

  function handleAddToCart() {
    if (onAddToCart) onAddToCart(product);
    else addItem(product);
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

    <article className="
      group relative flex flex-col overflow-hidden
      rounded-2xl border border-slate-200/80 bg-white
      shadow-[0_1px_2px_rgb(15_23_42/0.04)]
      transition-[translate,box-shadow,border-color] duration-300 ease-out
      hover:-translate-y-1 hover:border-primary-200
      hover:shadow-[0_22px_44px_-22px_rgb(78_13_108/0.38)]
      focus-within:border-primary-300
      motion-reduce:transition-none motion-reduce:hover:translate-y-0
    ">

      {/* IMAGE (square: matches the product photos, no layout shift) */}

      <div className="relative">

        <Link to={productUrl} tabIndex={-1} aria-hidden="true" className="block">
          <ProductImage
            src={image}
            fallbackSrc={imageFallback}
            alt={title}
            className="aspect-square"
            imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </Link>

        {/* Soft shade that rises on hover, so the badges stay readable */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />

        {/* BADGES */}

        {(discount > 0 || product.flash_sale || product.isNew) && (
          <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">

            {discount > 0 && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-rose-600 to-pink-500 px-2.5 py-1 text-[11px] font-extrabold leading-none tracking-wide text-white shadow-md shadow-rose-600/25">
                −{discount}%
              </span>
            )}

            {product.flash_sale && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-[10px] font-extrabold uppercase leading-none tracking-wide text-amber-950 shadow-sm">
                <Zap className="h-3 w-3 fill-current" aria-hidden="true" /> Flash
              </span>
            )}

            {product.isNew && (
              <span className="badge-secondary rounded-full">NEW</span>
            )}

          </div>
        )}

        {/* WISHLIST */}

        <button
          type="button"
          onClick={handleWishlist}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
          title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`
            absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full
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

      </div>

      {/* DETAILS */}

      <div className="flex flex-1 flex-col p-3 sm:p-3.5">

        {brand && (
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {brand}
          </p>
        )}

        <h3 className="mt-1 text-left text-sm font-semibold leading-snug text-slate-800">
          <Link
            to={productUrl}
            className="line-clamp-2 min-h-[2.5rem] transition-colors hover:text-primary-600 focus-visible:underline focus-visible:outline-none"
          >
            {title}
          </Link>
        </h3>

        {/* RATING & SALES (only when there is data) */}

        {(rating > 0 || reviews > 0 || sold > 0) && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">

            {rating > 0 && (
              <span className="inline-flex items-center gap-0.5 font-bold text-slate-700">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="sr-only">Rated</span>
                {rating.toFixed(1)}
              </span>
            )}

            {reviews > 0 && <span>({reviews.toLocaleString()} reviews)</span>}

            {sold > 0 && <span>· {sold.toLocaleString()} sold</span>}

          </div>
        )}

        {/* PRICE & CART (pinned to the bottom so every card in a row lines up) */}

        <div className="mt-auto pt-3">

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <PriceTag value={price} className="text-lg sm:text-xl" />
            {oldPrice > 0 && (
              <span className="text-xs font-medium text-slate-400 line-through">
                <span className="sr-only">Was </span>{formatPrice(oldPrice)}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex min-h-4 flex-wrap items-center gap-x-2 text-[11px] font-bold">
            {oldPrice > 0 && <span className="text-emerald-600">Save {formatPrice(oldPrice - price)}</span>}
            {lowStock && <span className="text-amber-600">Only {stock} left</span>}
          </div>

          {/* ADD TO CART */}

          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${title} to cart`}
            className={`
              mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5
              text-xs font-bold transition-all duration-200 active:scale-[0.98] sm:text-sm
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500
              ${added
                ? 'bg-emerald-600 text-white'
                : 'bg-secondary text-white hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/25'}
            `}
          >
            {added ? (
              <><Check className="h-4 w-4" aria-hidden="true" /> Added</>
            ) : (
              <><ShoppingCart className="h-4 w-4" aria-hidden="true" /> Add to cart</>
            )}
          </button>

        </div>

      </div>

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
