import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
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
  PackageCheck,
  BadgeCheck,
  Gift,
  Lock,
  MapPin,
  Share2,
  Link2,
  Check,
  Minus,
  Plus,
  Store,
} from "lucide-react";
import useApi from "../src/hooks/useApi";
import ProductGallery from "../src/components/ProductGallery";
import ProductCard, { ProductCardSkeleton } from "../src/components/ProductCard";
import {
  formatPrice,
  getCategoryLabel,
  getProductCategory,
  getProductImages,
  getProductView,
  getText,
  splitDescription,
  toNumber,
} from "../src/utils/product";
import { useCart } from "../src/context/CartContext";
import { useWishlist } from "../src/context/WishlistContext";

const STORE_NAME = "Trend Jr";
const LOW_STOCK = 5;
// Same delivery promise as the home page (TrustSection): free, 7–21 days
const DELIVERY_DAYS = [7, 21];

const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

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

  // key: start fresh (quantity, photo etc.) when moving to another product
  return <ProductDetails key={id} product={product} />;
}

// Category of the product plus its parent (for the breadcrumb), from the category list
function useProductCategory(product) {
  const slug = getProductCategory(product);
  const { data } = useApi(slug ? "/api/categories" : null);
  return useMemo(() => {
    if (!slug) return { slug: "", trail: [] };
    const list = Array.isArray(data) ? data : [];
    const category = list.find((c) => c.slug === slug);
    if (!category) return { slug, trail: [{ slug, label: getCategoryLabel({ slug }) }] };
    const parent = category.parent_id != null ? list.find((c) => c.id === category.parent_id) : null;
    return {
      slug,
      trail: [
        ...(parent ? [{ slug: parent.slug, label: getCategoryLabel(parent) }] : []),
        { slug: category.slug, label: getCategoryLabel(category) },
      ],
    };
  }, [slug, data]);
}

function ProductDetails({ product }) {
  const view = getProductView(product);
  const { title, price, discount, stock, brand } = view;
  const images = useMemo(() => getProductImages(product), [product]);
  const { specs, paragraphs } = useMemo(() => splitDescription(getText(product.description)), [product.description]);
  const category = useProductCategory(product);
  const rewardPoints = toNumber(product.reward_points);
  const wishlist = useWishlist();
  const saved = wishlist.has(product.id);

  // Show the product name in the browser tab
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | Trend Jr`;
    return () => { document.title = previous; };
  }, [title]);

  // Jewelry descriptions are mostly "Key: value" lines: show the main ones as highlights
  const highlights = specs.filter((row) => !/^care$/i.test(row.label)).slice(0, 4);
  // Without highlights the overview already shows the first paragraph; a Description
  // tab is only worth it when there is more text than that
  const showDescriptionTab = highlights.length > 0
    ? paragraphs.length > 0
    : paragraphs.length > 1 || (paragraphs[0]?.length ?? 0) > 300;

  const details = [
    brand && { label: "Brand", value: brand },
    ...specs,
    category.trail.length > 0 && { label: "Category", value: category.trail.map((c) => c.label).join(" › ") },
    product.sku && { label: "SKU", value: product.sku },
    { label: "Product ID", value: String(product.id) },
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-surface pb-12 pt-4 sm:pt-6">
      <div className="container-page">
        <nav className="mb-4 sm:mb-6" aria-label="Breadcrumb">
          <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-400">
            <li><Link to="/" className="hover:text-primary-500">Home</Link></li>
            <BreadcrumbSep />
            {category.trail.length > 0 ? (
              category.trail.map((c) => (
                <Fragment key={c.slug}>
                  <li><Link to={`/category/${encodeURIComponent(c.slug)}`} className="hover:text-primary-500">{c.label}</Link></li>
                  <BreadcrumbSep />
                </Fragment>
              ))
            ) : (
              <>
                <li><Link to="/shop" className="hover:text-primary-500">Products</Link></li>
                <BreadcrumbSep />
              </>
            )}
            <li className="min-w-0 max-w-full truncate font-medium text-secondary" aria-current="page">{title}</li>
          </ol>
        </nav>

        {/* Phones: photos, title + price, buy box, details. Tablets: photos | the rest.
            Wide screens: photos | title, price + details | buy box. */}
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:gap-x-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)]">
          <div className="md:row-span-3 md:sticky md:top-24 xl:row-span-2">
            <ProductGallery images={images} alt={title}>
              {discount > 0 && (
                <span className="pointer-events-none absolute left-4 top-4 z-10 rounded-xl bg-primary-500 px-3 py-1.5 text-sm font-extrabold text-white shadow-lg">
                  {discount}% OFF
                </span>
              )}
              <button
                type="button"
                onClick={() => wishlist.toggle(product)}
                aria-pressed={saved}
                aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
                title={saved ? "Remove from wishlist" : "Add to wishlist"}
                className={`absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full shadow-md transition-transform active:scale-90 ${
                  saved ? "bg-rose-50 text-rose-500" : "bg-white text-slate-500 hover:text-primary-500"
                }`}
              >
                <Heart size={21} className={saved ? "fill-rose-500" : ""} />
              </button>
            </ProductGallery>
          </div>

          <div className="min-w-0 md:col-start-2">
            <ProductHeadline product={product} view={view} rewardPoints={rewardPoints} />
          </div>

          <div className="min-w-0 md:col-start-2 xl:col-start-3 xl:row-span-2 xl:row-start-1 xl:sticky xl:top-24">
            <BuyBox product={product} title={title} price={price} stock={stock} saved={saved} onToggleSaved={() => wishlist.toggle(product)} />
          </div>

          <div className="min-w-0 md:col-start-2 xl:row-start-2">
            <ProductMore category={category} summary={paragraphs[0] || ""} highlights={highlights} />
          </div>
        </div>

        <ProductDetailsTabs paragraphs={showDescriptionTab ? paragraphs : []} details={details} />
        <RelatedProducts product={product} categorySlug={category.slug} />
      </div>
    </main>
  );
}

function BreadcrumbSep() {
  return (
    <li aria-hidden="true" className="flex">
      <ChevronRight size={14} />
    </li>
  );
}

function StarRow({ rating, size = 17 }) {
  return (
    <span className="flex items-center gap-0.5 text-amber-400" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} className={star <= Math.round(rating) ? "fill-amber-400" : "fill-slate-200 text-slate-200"} />
      ))}
    </span>
  );
}

function StockStatus({ stock }) {
  // stock 0 means "not specified" in the imported data, not sold out
  if (stock <= 0) return null;
  if (stock <= LOW_STOCK) {
    return (
      <p className="flex items-center gap-2 text-sm font-bold text-amber-600">
        <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" /> Only {stock} left in stock — order soon
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2 text-sm font-bold text-emerald-600">
      <CheckCircle2 size={17} aria-hidden="true" /> In stock — ready to ship
    </p>
  );
}

// Brand, title, rating, price and stock
function ProductHeadline({ product, view, rewardPoints }) {
  const { title, price, oldPrice, discount, rating, reviews, stock, brand } = view;

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {brand && (
          <span className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700">{brand}</span>
        )}
        {product.featured && (
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">Featured</span>
        )}
        {product.flash_sale && (
          <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600">Flash deal</span>
        )}
      </div>

      <h1 className="text-2xl font-black leading-tight text-secondary sm:text-3xl">{title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        {rating > 0 ? (
          <>
            <StarRow rating={rating} />
            <strong className="text-sm text-secondary">
              <span className="sr-only">Rated </span>{rating.toFixed(1)}<span className="sr-only"> out of 5</span>
            </strong>
            {reviews > 0 && <span className="text-sm text-slate-400">({reviews.toLocaleString()} reviews)</span>}
          </>
        ) : (
          <span className="text-sm text-slate-400">No reviews yet</span>
        )}
        {product.sku && (
          <span className="text-xs text-slate-400">
            <span className="mx-1 text-slate-300" aria-hidden="true">|</span> SKU: <span className="font-semibold text-slate-500">{product.sku}</span>
          </span>
        )}
      </div>

      <div className="mt-5 border-y border-slate-200 py-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <strong className="text-3xl font-black text-primary-600">{formatPrice(price)}</strong>
          {oldPrice > 0 && (
            <span className="text-lg text-slate-400 line-through">
              <span className="sr-only">Was </span>{formatPrice(oldPrice)}
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-extrabold text-rose-600">-{discount}%</span>
          )}
        </div>
        {oldPrice > 0 && (
          <p className="mt-1.5 text-sm font-semibold text-emerald-600">You save {formatPrice(oldPrice - price)}</p>
        )}
        <div className="mt-3 empty:hidden">
          <StockStatus stock={stock} />
        </div>
        {rewardPoints > 0 && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <Gift size={16} className="shrink-0" aria-hidden="true" />
            Earn <strong>{rewardPoints.toLocaleString()} reward point{rewardPoints === 1 ? "" : "s"}</strong> with this item
          </p>
        )}
      </div>
    </div>
  );
}

// Overview / highlights, delivery and category links
function ProductMore({ category, summary, highlights }) {
  const from = dayFormat.format(addDays(DELIVERY_DAYS[0]));
  const to = dayFormat.format(addDays(DELIVERY_DAYS[1]));

  return (
    <div className="min-w-0 *:first:mt-0">
      {(highlights.length > 0 || summary) && (
        <div className="mt-5">
          <h2 className="text-sm font-extrabold text-secondary">{highlights.length > 0 ? "Highlights" : "Overview"}</h2>
          {highlights.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              {highlights.map((row) => (
                <li key={row.label} className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary-500" aria-hidden="true" />
                  <span><strong className="font-semibold text-secondary">{row.label}:</strong> {row.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 line-clamp-4 text-sm leading-7 text-slate-600">{summary}</p>
          )}
          <button
            type="button"
            onClick={() => document.getElementById("product-details")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="link-primary mt-2 inline-flex items-center gap-1 text-sm"
          >
            See full details <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-extrabold text-secondary">Delivery</h2>
        <ul className="mt-3 space-y-3 text-sm">
          <li className="flex gap-3">
            <Truck size={18} className="mt-0.5 shrink-0 text-primary-500" aria-hidden="true" />
            <span>
              <strong className="text-secondary">Free delivery</strong>
              <span className="block text-slate-500">
                Estimated arrival <strong className="font-semibold text-slate-700">{from} – {to}</strong>
              </span>
            </span>
          </li>
          <li className="flex gap-3">
            <MapPin size={18} className="mt-0.5 shrink-0 text-primary-500" aria-hidden="true" />
            <span className="text-slate-500">Order tracking from dispatch to your door</span>
          </li>
          <li className="flex gap-3">
            <PackageCheck size={18} className="mt-0.5 shrink-0 text-primary-500" aria-hidden="true" />
            <span className="text-slate-500">Quality-checked before it ships</span>
          </li>
        </ul>
      </div>

      {category.trail.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {category.trail.map((c) => (
            <Link
              key={c.slug}
              to={`/category/${encodeURIComponent(c.slug)}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-primary-200 hover:text-primary-600"
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function BuyBox({ product, title, price, stock, saved, onToggleSaved }) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const maxQuantity = stock > 0 ? stock : 10;

  return (
    <aside aria-label="Purchase options">
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <Store size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Sold and shipped by</p>
            <p className="flex items-center gap-1 text-sm font-extrabold text-secondary">
              {STORE_NAME} <BadgeCheck size={15} className="text-primary-500" aria-hidden="true" />
            </p>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <span id="qty-label" className="text-sm font-bold text-secondary">Quantity</span>
            <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white" role="group" aria-labelledby="qty-label">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="grid h-10 w-10 place-items-center text-slate-500 hover:text-primary-500 disabled:opacity-40"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <strong className="min-w-10 border-x border-slate-200 px-3 py-2 text-center text-secondary" aria-live="polite">
                {quantity}
              </strong>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                aria-label="Increase quantity"
                className="grid h-10 w-10 place-items-center text-slate-500 hover:text-primary-500 disabled:opacity-40"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          {quantity > 1 && (
            <p className="flex justify-between text-sm text-slate-500">
              <span>Total</span>
              <strong className="text-secondary">{formatPrice(price * quantity)}</strong>
            </p>
          )}

          <div className="grid gap-2.5">
            <button type="button" onClick={() => addItem(product, quantity)} className="btn-primary rounded-2xl py-3.5 text-base">
              <ShoppingBag size={19} aria-hidden="true" /> Add to cart
            </button>
            <button
              type="button"
              onClick={() => { addItem(product, quantity); navigate("/cart"); }}
              className="btn-secondary rounded-2xl py-3.5 text-base"
            >
              Buy now <ChevronRight size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onToggleSaved}
              aria-pressed={saved}
              className={`btn-outline rounded-2xl py-3 ${saved ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" : ""}`}
            >
              <Heart size={18} className={saved ? "fill-rose-500 text-rose-500" : ""} aria-hidden="true" />
              {saved ? "Saved to wishlist" : "Add to wishlist"}
            </button>
          </div>

          <ul className="space-y-2.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
            <li className="flex items-center gap-2.5"><CheckCircle2 size={16} className="shrink-0 text-emerald-500" aria-hidden="true" /> Item as described</li>
            <li className="flex items-center gap-2.5"><Lock size={16} className="shrink-0 text-emerald-500" aria-hidden="true" /> Secure checkout</li>
            <li className="flex items-center gap-2.5"><RotateCcw size={16} className="shrink-0 text-emerald-500" aria-hidden="true" /> Refund if it arrives damaged or not at all</li>
            <li className="flex items-center gap-2.5"><ShieldCheck size={16} className="shrink-0 text-emerald-500" aria-hidden="true" /> Buyer protection on every order</li>
          </ul>
        </div>

        <ShareRow title={title} />
      </div>
    </aside>
  );
}

function ShareRow({ title }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
      <span className="mr-auto text-xs font-bold text-slate-500">Share</span>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25D366] px-3 text-xs font-bold text-white hover:bg-[#1da851]"
      >
        <WhatsAppIcon /> WhatsApp
      </a>
      <button
        type="button"
        onClick={copy}
        className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-primary-600"
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Link copied" : "Copy link"}
      >
        {copied ? <Check size={16} className="text-emerald-600" aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, url }).catch(() => {})}
          className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-primary-600"
          aria-label="Share"
          title="Share"
        >
          <Share2 size={16} aria-hidden="true" />
        </button>
      )}
      <span className="sr-only" aria-live="polite">{copied ? "Link copied to clipboard" : ""}</span>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.64-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.3 11.3 0 0 0 12.05.72C5.79.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.64l6.05-1.59a11.3 11.3 0 0 0 5.4 1.38h.01c6.25 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.33-8.03" />
    </svg>
  );
}

// Description / Specifications / Shipping & returns, as accessible tabs
function ProductDetailsTabs({ paragraphs, details }) {
  const baseId = useId();
  const tabs = [
    paragraphs.length > 0 && { id: "description", label: "Description" },
    { id: "specs", label: "Specifications" },
    { id: "shipping", label: "Shipping & returns" },
  ].filter(Boolean);
  const [active, setActive] = useState(tabs[0].id);
  const tabRefs = useRef({});

  function onKeyDown(e) {
    const index = tabs.findIndex((t) => t.id === active);
    let next = null;
    if (e.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
    if (e.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (e.key === "Home") next = tabs[0];
    if (e.key === "End") next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    setActive(next.id);
    tabRefs.current[next.id]?.focus();
  }

  return (
    <section id="product-details" className="card mt-10 scroll-mt-24 overflow-hidden">
      <div role="tablist" aria-label="Product information" onKeyDown={onKeyDown} className="no-scrollbar flex overflow-x-auto border-b border-slate-200 px-2 sm:px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(node) => { tabRefs.current[tab.id] = node; }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            className={`relative shrink-0 px-4 py-4 text-sm font-extrabold transition-colors ${
              active === tab.id ? "text-primary-600" : "text-slate-500 hover:text-secondary"
            }`}
          >
            {tab.label}
            {active === tab.id && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary-500" aria-hidden="true" />}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={active !== tab.id}
          tabIndex={0}
          className="p-5 outline-none focus-visible:ring-2 focus-visible:ring-primary-200 sm:p-8"
        >
          {tab.id === "description" && (
            <div className="max-w-3xl space-y-3 text-sm leading-7 text-slate-600">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}
          {tab.id === "specs" && (
            <dl className="max-w-3xl divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 text-sm">
              {details.map((row) => (
                <div key={row.label} className="grid grid-cols-1 gap-1 px-4 py-3 odd:bg-slate-50/70 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="font-bold text-secondary">{row.label}</dt>
                  <dd className="text-slate-600">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {tab.id === "shipping" && <ShippingInfo />}
        </div>
      ))}
    </section>
  );
}

function ShippingInfo() {
  const items = [
    { icon: Truck, title: "Free delivery", text: `Every order ships free, with no minimum basket. Delivery usually takes ${DELIVERY_DAYS[0]}–${DELIVERY_DAYS[1]} days depending on your location.` },
    { icon: MapPin, title: "Order tracking", text: "Follow your parcel from dispatch to delivery on the My Orders page once tracking is available." },
    { icon: PackageCheck, title: "Quality check", text: "Items are checked before they ship." },
    { icon: RotateCcw, title: "Refunds", text: "If your order arrives damaged or doesn't arrive, contact us with your order number for a refund." },
  ];
  return (
    <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <Icon size={19} aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-secondary">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
          </div>
        </div>
      ))}
      <p className="text-sm text-slate-500 sm:col-span-2">
        More questions? See the <Link to="/faq" className="link-primary">FAQ</Link> or <Link to="/contact" className="link-primary">contact us</Link>.
      </p>
    </div>
  );
}

// Same category when the product has one, otherwise the newest products
function RelatedProducts({ product, categorySlug }) {
  const query = categorySlug ? `category=${encodeURIComponent(categorySlug)}` : "sort=newest";
  const { data, loading } = useApi(`/api/products?page=1&limit=9&${query}`);
  const items = (Array.isArray(data) ? data : []).filter((p) => p.id !== product.id).slice(0, 8);

  if (!loading && items.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow">You may also like</p>
          <h2 className="mt-2 text-2xl font-black text-secondary">Similar products</h2>
        </div>
        <Link to={categorySlug ? `/category/${encodeURIComponent(categorySlug)}` : "/shop"} className="link-primary text-sm">
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
  const bar = "rounded bg-slate-200 animate-pulse";
  return (
    <main className="min-h-screen bg-surface pb-12 pt-4 sm:pt-6" aria-busy="true">
      <div className="container-page">
        <div className={`mb-6 h-4 w-64 ${bar}`} />
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:gap-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)]">
          <div className="md:row-span-2 xl:row-span-1">
            <div className="aspect-square rounded-3xl bg-slate-200 animate-pulse" />
            <div className="mt-3 flex gap-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 w-20 rounded-xl bg-slate-200 animate-pulse" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className={`h-6 w-32 rounded-full ${bar}`} />
            <div className={`h-9 w-11/12 ${bar}`} />
            <div className={`h-5 w-40 ${bar}`} />
            <div className={`h-24 rounded-2xl ${bar}`} />
            <div className={`h-20 ${bar}`} />
            <div className={`h-32 rounded-2xl ${bar}`} />
          </div>
          <div className="h-96 rounded-2xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    </main>
  );
}
