import { Link } from "react-router-dom";
import { Heart, ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import ProductCard from "../src/components/ProductCard";
import { useWishlist } from "../src/context/WishlistContext";
import { useCart } from "../src/context/CartContext";

// Saved products (kept in this browser; see WishlistContext)
export default function WishlistPage() {
  const { items, count, clear } = useWishlist();
  const { addItem } = useCart();

  function addAllToCart() {
    items.forEach((item) => addItem(item));
  }

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Your saved finds</p>
            <h1 className="mt-2 text-3xl font-black text-secondary">
              My wishlist
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Keep the products you love in one place.
            </p>
          </div>
          {count > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700">
                {count} saved item{count === 1 ? "" : "s"}
              </span>
              <button type="button" onClick={addAllToCart} className="btn-primary btn-sm">
                <ShoppingCart size={15} aria-hidden="true" /> Add all to cart
              </button>
              <button type="button" onClick={clear} className="btn-outline btn-sm text-slate-600">
                <Trash2 size={15} aria-hidden="true" /> Clear
              </button>
            </div>
          )}
        </div>

        {count === 0 ? (
          <div className="card mx-auto max-w-lg p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
              <Heart size={26} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-xl font-black text-secondary">Your wishlist is empty</h2>
            <p className="mt-2 text-sm text-slate-500">
              Tap the heart on any product to save it here for later.
            </p>
            <Link to="/shop" className="btn-primary mt-6">
              Explore products <ArrowRight size={17} aria-hidden="true" />
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
              Prices are shown as they were when you saved each item; the product page and checkout always use the current price.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
