import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingBag, Star, ChevronRight, CheckCircle2, PackageX } from 'lucide-react';
import Modal from './Modal';
import ProductGallery from './ProductGallery';
import { PriceTag } from './ProductCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, getProductImages, getProductView, getText } from '../utils/product';
import useLanguage from '../i18n/useLanguage';
import { formatNumber } from '../utils/format';

// A product's essentials in a dialog, opened from a product card
export default function QuickView({ product, open, onClose }) {
  useLanguage(); // re-render on a language change
  const title = product ? getProductView(product).title : '';
  return (
    <Modal open={open && Boolean(product)} onClose={onClose} title={title} size="xl">
      {open && product && <QuickViewBody product={product} onClose={onClose} />}
    </Modal>
  );
}

function QuickViewBody({ product, onClose }) {
  const { t } = useLanguage();
  const view = getProductView(product);
  const images = useMemo(() => getProductImages(product), [product]);
  const description = getText(product.description);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const saved = wishlist.has(view.id);
  const max = Math.max(1, view.maxQuantity);

  function add() {
    if (addItem(product, quantity)) onClose();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ProductGallery images={images.length ? images : [{ src: view.image, fallbackSrc: view.imageFallback }]} alt={view.title}>
        {view.discount > 0 && (
          <span className="pointer-events-none absolute start-3 top-3 z-10 rounded-full bg-gradient-to-r from-rose-600 to-pink-500 px-2.5 py-1 text-xs font-extrabold text-white shadow-md">
            <bdi dir="ltr">−{view.discount}%</bdi>
          </span>
        )}
      </ProductGallery>

      <div className="flex min-w-0 flex-col">
        {view.brand && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{view.brand}</p>}

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
          {view.rating > 0 ? (
            <span className="inline-flex items-center gap-1 font-bold text-slate-700">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              {view.rating.toFixed(1)}<span className="sr-only"> {t('product.outOf5')}</span>
            </span>
          ) : (
            <span className="text-slate-400">{t('product.noReviews')}</span>
          )}
          {view.reviews > 0 && <span>({t('product.reviewsCount', { count: view.reviews, formatted: formatNumber(view.reviews) })})</span>}
          {view.sold > 0 && <span>· {t('product.soldCount', { count: view.sold, formatted: formatNumber(view.sold) })}</span>}
        </div>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <PriceTag value={view.price} className="text-3xl text-primary-600" />
          {view.oldPrice > 0 && (
            <span className="text-base text-slate-400 line-through"><span className="sr-only">{t('product.was')} </span>{formatPrice(view.oldPrice)}</span>
          )}
        </div>
        {view.oldPrice > 0 && <p className="mt-1 text-sm font-bold text-emerald-600">{t('product.youSave', { amount: formatPrice(view.oldPrice - view.price) })}</p>}

        {view.tracked && (
          <p className={`mt-3 flex items-center gap-1.5 text-sm font-bold ${view.stock <= 0 ? 'text-rose-600' : view.lowStock ? 'text-amber-600' : 'text-emerald-600'}`}>
            {view.stock <= 0
              ? <><PackageX className="h-4 w-4" aria-hidden="true" /> {t('product.outOfStock')}</>
              : view.lowStock
                ? <>{t('product.onlyLeftInStock', { count: view.stock })}</>
                : <><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {t('product.inStock')}</>}
          </p>
        )}

        {description && <p className="mt-4 line-clamp-5 whitespace-pre-line text-sm leading-6 text-slate-600">{description}</p>}

        <div className="mt-auto pt-5">
          {view.inStock && (
            <div className="mb-3 flex items-center justify-between gap-3">
              <span id="qv-qty" className="text-sm font-bold text-secondary">{t('product.quantity')}</span>
              <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white" role="group" aria-labelledby="qv-qty">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label={t('product.decrease')} className="grid h-10 w-10 place-items-center text-slate-500 hover:text-primary-500 disabled:opacity-40">
                  <Minus size={16} aria-hidden="true" />
                </button>
                <strong className="min-w-10 border-x border-slate-200 px-3 py-2 text-center text-secondary" aria-live="polite">{quantity}</strong>
                <button type="button" onClick={() => setQuantity((q) => Math.min(max, q + 1))} disabled={quantity >= max} aria-label={t('product.increase')} className="grid h-10 w-10 place-items-center text-slate-500 hover:text-primary-500 disabled:opacity-40">
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button type="button" onClick={add} disabled={!view.inStock} className="btn-primary rounded-2xl py-3.5">
              <ShoppingBag size={18} aria-hidden="true" /> {view.inStock ? t('product.addToCartPrice', { price: formatPrice(view.price * quantity) }) : t('product.outOfStock')}
            </button>
            <button
              type="button"
              onClick={() => wishlist.toggle(product)}
              aria-pressed={saved}
              aria-label={saved ? t('product.removeFromWishlist') : t('product.saveToWishlist')}
              className={`grid w-12 place-items-center rounded-2xl border transition-colors ${saved ? 'border-rose-200 bg-rose-50 text-rose-500' : 'border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-500'}`}
            >
              <Heart size={19} className={saved ? 'fill-rose-500' : ''} aria-hidden="true" />
            </button>
          </div>
          <Link to={view.url} onClick={onClose} className="link-primary mt-3 inline-flex items-center gap-1 text-sm">
            {t('product.viewDetails')} <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
