import { Link } from "react-router-dom";
import { Heart, ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import ProductCard from "../src/components/ProductCard";
import { useWishlist } from "../src/context/WishlistContext";
import { useCart } from "../src/context/CartContext";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta } from "../src/i18n/seo";

// Saved products (kept in this browser; see WishlistContext)
export default function WishlistPage() {
  const { items, count, clear } = useWishlist();
  const { addItem } = useCart();
  const { t } = useLanguage();
  usePageMeta({ title: t("wishlist.title") });

  function addAllToCart() {
    items.forEach((item) => addItem(item));
  }

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t("wishlist.eyebrow")}</p>
            <h1 className="mt-2 text-3xl font-black text-secondary">
              {t("wishlist.title")}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {t("wishlist.intro")}
            </p>
          </div>
          {count > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700">
                {t("wishlist.count", { count })}
              </span>
              <button type="button" onClick={addAllToCart} className="btn-primary btn-sm">
                <ShoppingCart size={15} aria-hidden="true" /> {t("wishlist.addAll")}
              </button>
              <button type="button" onClick={clear} className="btn-outline btn-sm text-slate-600">
                <Trash2 size={15} aria-hidden="true" /> {t("wishlist.clear")}
              </button>
            </div>
          )}
        </div>

        {count === 0 ? (
          <div className="card mx-auto max-w-lg p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
              <Heart size={26} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-xl font-black text-secondary">{t("wishlist.empty")}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {t("wishlist.emptyText")}
            </p>
            <Link to="/shop" className="btn-primary mt-6">
              {t("wishlist.explore")} <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-400">
              {t("wishlist.priceNote")}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
