import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Star,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  ShoppingBag,
  CheckCircle2,
  ChevronRight,
  PackageX,
  RotateCw,
} from "lucide-react";
import useApi from "../src/hooks/useApi";
import ProductImage from "../src/components/ProductImage";
import ProductCard, { ProductCardSkeleton } from "../src/components/ProductCard";
import { formatPrice, getProductView, getText } from "../src/utils/product";
import { useCart } from "../src/context/CartContext";

export default function ProductPage() {
  const { id } = useParams();
  const { data: product, loading, error, status, retry } = useApi(`/api/products/${encodeURIComponent(id)}`);

  if (loading) return <ProductPageSkeleton />;

  if (error || !product) {
    const notFound = status === 404 || status === 400;
    return (
      <main className="min-h-[60vh] bg-surface py-16">
        <div className="container-page">
          <div className="card mx-auto max-w-lg p-8 text-center" role="alert">
            <PackageX className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-black text-secondary">
              {notFound ? "Product not found" : "We couldn't load this product"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {notFound ? "It may have been removed or the link is wrong." : error}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {!notFound && (
                <button type="button" onClick={retry} className="btn-primary">
                  <RotateCw size={16} /> Try again
                </button>
              )}
              <Link to="/shop" className="btn-outline">Browse products</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // key: start fresh (quantity etc.) when moving to another product
  return <ProductDetails key={id} product={product} />;
}

function ProductDetails({ product }) {
  const { title, image, imageFallback, price, oldPrice, discount, rating, reviews, stock, brand } =
    getProductView(product);
  const description = getText(product.description);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const maxQuantity = stock > 0 ? stock : 10;

  // Show the product name in the browser tab
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | Trend Jr`;
    return () => { document.title = previous; };
  }, [title]);

  return (
    <main className="min-h-screen bg-surface py-6 sm:py-10">
      <div className="container-page">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary-500">
            Home
          </Link>
          <ChevronRight size={15} aria-hidden="true" />
          <Link to="/shop" className="hover:text-primary-500">
            Products
          </Link>
          <ChevronRight size={15} aria-hidden="true" />
          <span className="truncate font-medium text-secondary">{title}</span>
        </nav>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white">
              {discount > 0 && (
                <span className="absolute left-5 top-5 z-10 rounded-xl bg-primary-500 px-4 py-2 text-sm font-extrabold text-white shadow-lg">
                  {discount}% OFF
                </span>
              )}
              <button
                type="button"
                aria-label="Add to wishlist"
                className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-500 shadow-md hover:text-primary-500"
              >
                <Heart size={21} />
              </button>
              <ProductImage
                src={image}
                fallbackSrc={imageFallback}
                alt={title}
                fit="contain"
                priority
                className="aspect-square"
                imgClassName="p-6 group-hover:scale-105"
              />
            </div>
          </div>
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {brand && (
                <span className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700">
                  {brand}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={14} /> Verified product
              </span>
            </div>
            <h1 className="text-2xl font-black leading-tight text-secondary sm:text-4xl">
              {title}
            </h1>
            <div className="mb-6 mt-4 flex flex-wrap items-center gap-3">
              {rating > 0 ? (
                <>
                  <span className="flex items-center gap-0.5 text-amber-400" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={17} className={star <= Math.round(rating) ? "fill-amber-400" : "fill-slate-200 text-slate-200"} />
                    ))}
                  </span>
                  <strong className="text-sm text-secondary">{rating.toFixed(1)}</strong>
                  {reviews > 0 && <span className="text-sm text-slate-400">{reviews.toLocaleString()} reviews</span>}
                </>
              ) : (
                <span className="text-sm text-slate-400">No reviews yet</span>
              )}
            </div>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <strong className="text-3xl font-black text-primary-600">
                  {formatPrice(price)}
                </strong>
                {oldPrice > 0 && (
                  <span className="text-lg text-slate-400 line-through">
                    {formatPrice(oldPrice)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-600">
                    -{discount}%
                  </span>
                )}
              </div>
              {oldPrice > 0 && (
                <p className="mt-2 text-sm font-semibold text-emerald-600">
                  Save {formatPrice(oldPrice - price)} on this product
                </p>
              )}
              {stock > 0 && (
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 size={17} /> In stock — ready to ship
                </div>
              )}
            </div>
            <div className="mb-7">
              <h3 className="mb-3 font-bold text-secondary">Quantity</h3>
              <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="px-4 py-3 text-slate-500 hover:text-primary-500 disabled:opacity-40"
                >
                  −
                </button>
                <strong className="min-w-12 border-x border-slate-200 px-5 py-3 text-center text-secondary" aria-live="polite">
                  {quantity}
                </strong>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  disabled={quantity >= maxQuantity}
                  aria-label="Increase quantity"
                  className="px-4 py-3 text-slate-500 hover:text-primary-500 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mb-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => addItem(product, quantity)}
                className="btn-primary rounded-2xl py-4 text-sm sm:text-base"
              >
                <ShoppingBag size={19} /> Add to cart
              </button>
              <button
                type="button"
                onClick={() => { addItem(product, quantity); navigate("/cart"); }}
                className="btn-outline rounded-2xl py-4 text-sm sm:text-base"
              >
                Buy now <ChevronRight size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-6">
              <div className="text-center">
                <Truck className="mx-auto mb-2 text-primary-500" />
                <p className="text-xs font-bold text-secondary">
                  Fast shipping
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Order tracking
                </p>
              </div>
              <div className="text-center">
                <ShieldCheck className="mx-auto mb-2 text-primary-500" />
                <p className="text-xs font-bold text-secondary">
                  Buyer protection
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Secure purchase
                </p>
              </div>
              <div className="text-center">
                <RotateCcw className="mx-auto mb-2 text-primary-500" />
                <p className="text-xs font-bold text-secondary">Easy returns</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Simple process
                </p>
              </div>
            </div>
          </div>
        </div>
        {description && (
          <section className="card mt-12 p-6 sm:p-8">
            <h2 className="text-2xl font-black text-secondary">
              Product description
            </h2>
            <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-8 text-slate-600">
              {description}
            </p>
          </section>
        )}
        <RelatedProducts product={product} />
      </div>
    </main>
  );
}

// Same category when the product has one, otherwise the newest products
function RelatedProducts({ product }) {
  const categoryTag = Array.isArray(product.tags)
    ? product.tags.find((tag) => typeof tag === "string" && tag.startsWith("category-request:"))
    : null;
  const query = categoryTag
    ? `category=${encodeURIComponent(categoryTag.slice("category-request:".length))}`
    : "sort=newest";
  const { data, loading } = useApi(`/api/products?page=1&limit=5&${query}`);
  const items = (Array.isArray(data) ? data : []).filter((p) => p.id !== product.id).slice(0, 4);

  if (!loading && items.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow">You may also like</p>
          <h2 className="mt-2 text-2xl font-black text-secondary">
            Related products
          </h2>
        </div>
        <Link to="/shop" className="link-primary text-sm">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
          : items.map((item) => <ProductCard key={item.id} product={item} />)}
      </div>
    </section>
  );
}

function ProductPageSkeleton() {
  return (
    <main className="min-h-screen bg-surface py-6 sm:py-10" aria-busy="true">
      <div className="container-page">
        <div className="mb-6 h-4 w-64 rounded bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="aspect-square rounded-3xl bg-slate-200 animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-32 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-10 w-11/12 rounded bg-slate-200 animate-pulse" />
            <div className="h-10 w-2/3 rounded bg-slate-200 animate-pulse" />
            <div className="h-5 w-40 rounded bg-slate-200 animate-pulse" />
            <div className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="h-12 w-40 rounded-xl bg-slate-200 animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-14 rounded-2xl bg-slate-200 animate-pulse" />
              <div className="h-14 rounded-2xl bg-slate-200 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
