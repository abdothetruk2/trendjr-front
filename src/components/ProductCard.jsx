import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import ProductImage from './ProductImage';
import { useCart } from '../context/CartContext';
import { formatPrice, getProductView, toNumber } from '../utils/product';

export default function ProductCard({
  product,
  language = 'en',
  onAddToCart,
  onToggleWishlist
}) {

  const { addItem } = useCart();

  if (!product) return null;

  const { id, title, image, imageFallback, price, oldPrice, discount, rating, reviews } = getProductView(product, language);
  const sold = toNumber(product.sold);
  const productUrl = `/product/${id}`;

  return (

    <div className="
      group bg-white rounded-2xl
      border border-slate-200/80
      hover:border-primary-300
      hover:shadow-soft
      overflow-hidden
      flex flex-col
      transition-all duration-200
    ">

      {/* PRODUCT IMAGE (square: matches the product photos, no layout shift) */}

      <div className="relative">

        <Link to={productUrl} tabIndex={-1} aria-hidden="true">
          <ProductImage
            src={image}
            fallbackSrc={imageFallback}
            alt={title}
            className="aspect-square"
            imgClassName="group-hover:scale-105"
          />
        </Link>

        {/* BADGES */}

        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 pointer-events-none">

          {discount > 0 && (
            <span className="badge-primary">-{discount}% OFF</span>
          )}

          {product.isNew && (
            <span className="badge-secondary">NEW</span>
          )}

        </div>

        {/* WISHLIST BUTTON */}

        <button
          type="button"
          onClick={() => onToggleWishlist?.(product)}
          className="btn-wish top-2.5 right-2.5 w-8 h-8"
          aria-label={`Save ${title} to wishlist`}
        >
          <Heart className="w-4 h-4 text-slate-600" />
        </button>

      </div>

      {/* PRODUCT DETAILS */}

      <div className="p-3.5 flex-1 flex flex-col justify-between">

        <div>

          <Link to={productUrl}>
            <h3 className="
              mt-1 min-h-[2.5rem]
              text-left text-sm
              font-bold text-slate-900
              line-clamp-2
              hover:text-primary-600
              leading-snug
            ">
              {title}
            </h3>
          </Link>

          {/* RATING & SALES (only when there is data) */}

          {(rating > 0 || reviews > 0 || sold > 0) && (
            <div className="mt-2 flex items-center gap-1.5 text-muted">

              {rating > 0 && (
                <span className="inline-flex items-center gap-0.5 font-bold text-slate-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {rating.toFixed(1)}
                </span>
              )}

              {reviews > 0 && <span>({reviews.toLocaleString()})</span>}

              {sold > 0 && <span>· {sold.toLocaleString()} sold</span>}

            </div>
          )}

        </div>

        {/* PRICE & CART */}

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">

          <div>

            <div className="flex items-baseline gap-1.5 flex-wrap">

              <span className="text-lg font-extrabold text-slate-950">
                {formatPrice(price)}
              </span>

              {oldPrice > 0 && (
                <span className="price-old text-xs">{formatPrice(oldPrice)}</span>
              )}

            </div>

            {oldPrice > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                Save {formatPrice(oldPrice - price)}
              </div>
            )}

          </div>

          {/* ADD TO CART */}

          <button
            type="button"
            onClick={() => (onAddToCart ? onAddToCart(product) : addItem(product))}
            className="btn-light p-2.5 shrink-0 hover:bg-primary-500 hover:text-white transition-colors"
            aria-label={`Add ${title} to cart`}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>

        </div>

      </div>

    </div>

  );

}

// Placeholder with the same layout as a product card (used while products load)
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col" aria-hidden="true">
      <div className="aspect-square bg-slate-200 animate-pulse" />
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div className="mt-1 space-y-2">
          <div className="h-3.5 w-11/12 rounded bg-slate-200 animate-pulse" />
          <div className="h-3.5 w-2/3 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="h-6 w-20 rounded bg-slate-200 animate-pulse" />
          <div className="h-9 w-9 rounded-xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
