import { Heart, ShoppingCart, Star, ArrowRight } from "lucide-react";

export default function WishlistPage() {
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
          <span className="rounded-xl bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700">
            3 saved items
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <article className="card overflow-hidden">
            <div className="relative h-52 bg-white p-4">
              <button
                type="button"
                aria-label="Remove from wishlist"
                className="absolute right-3 top-3 rounded-full bg-rose-50 p-2 text-rose-500"
              >
                <Heart size={17} fill="currentColor" />
              </button>
              <img
                src="/product.jpg"
                alt="Wireless massage wand"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-400">Electronics</p>
              <h2 className="mt-1 font-extrabold text-secondary">
                Portable Wireless Massage Wand
              </h2>
              <div className="mt-3 flex items-center gap-1 text-amber-400">
                <Star size={13} fill="currentColor" />
                <span className="text-xs text-slate-500">4.8 (128)</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <strong className="text-lg text-primary-600">$29.99</strong>
                <a
                  href="/cart"
                  className="rounded-lg bg-primary-500 p-2 text-white"
                >
                  <ShoppingCart size={16} />
                </a>
              </div>
            </div>
          </article>
          <article className="card overflow-hidden">
            <div className="relative h-52 bg-white p-4">
              <button
                type="button"
                aria-label="Remove from wishlist"
                className="absolute right-3 top-3 rounded-full bg-rose-50 p-2 text-rose-500"
              >
                <Heart size={17} fill="currentColor" />
              </button>
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80"
                alt="Classic watch"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-400">Accessories</p>
              <h2 className="mt-1 font-extrabold text-secondary">
                Classic Minimal Watch
              </h2>
              <div className="mt-3 flex items-center gap-1 text-amber-400">
                <Star size={13} fill="currentColor" />
                <span className="text-xs text-slate-500">4.8 (96)</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <strong className="text-lg text-primary-600">$49.00</strong>
                <a
                  href="/cart"
                  className="rounded-lg bg-primary-500 p-2 text-white"
                >
                  <ShoppingCart size={16} />
                </a>
              </div>
            </div>
          </article>
          <article className="card overflow-hidden">
            <div className="relative h-52 bg-white p-4">
              <button
                type="button"
                aria-label="Remove from wishlist"
                className="absolute right-3 top-3 rounded-full bg-rose-50 p-2 text-rose-500"
              >
                <Heart size={17} fill="currentColor" />
              </button>
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80"
                alt="Wireless headphones"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-400">Electronics</p>
              <h2 className="mt-1 font-extrabold text-secondary">
                Wireless Headphones
              </h2>
              <div className="mt-3 flex items-center gap-1 text-amber-400">
                <Star size={13} fill="currentColor" />
                <span className="text-xs text-slate-500">4.7 (54)</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <strong className="text-lg text-primary-600">$64.00</strong>
                <a
                  href="/cart"
                  className="rounded-lg bg-primary-500 p-2 text-white"
                >
                  <ShoppingCart size={16} />
                </a>
              </div>
            </div>
          </article>
        </div>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">Looking for something else?</p>
          <a href="/products" className="link-primary mt-2 inline-flex">
            Explore all products <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </main>
  );
}
