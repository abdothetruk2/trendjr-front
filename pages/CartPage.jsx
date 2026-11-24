import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Truck, Minus, Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { useCart } from "../src/context/CartContext";
import ProductImage from "../src/components/ProductImage";
import { formatPrice, productPath } from "../src/utils/product";

export default function CartPage() {
  const { items, buyable, count, subtotal, setQuantity, removeItem, clearCart, refresh, maxFor } = useCart();
  const [checking, setChecking] = useState(items.length > 0);
  const savings = buyable.reduce((sum, item) => sum + (item.oldPrice > item.price ? (item.oldPrice - item.price) * item.quantity : 0), 0);
  const blocked = items.filter((item) => item.unavailable || item.soldOut);

  // Current prices and stock from the store (the saved cart is only a snapshot)
  useEffect(() => {
    const controller = new AbortController();
    refresh({ signal: controller.signal })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [refresh]);

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="mb-8">
          <p className="eyebrow">Almost yours</p>
          <h1 className="mt-2 text-3xl font-black text-secondary">Shopping cart</h1>
          <p className="mt-2 text-sm text-slate-500">
            {count ? `${count} item${count === 1 ? "" : "s"} — review them before continuing to checkout.` : "Review your items before continuing to checkout."}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="card mx-auto max-w-lg p-10 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-black text-secondary">Your cart is empty</h2>
            <p className="mt-2 text-sm text-slate-500">Find something you love and add it here.</p>
            <Link to="/shop" className="btn-primary mt-6">Start shopping <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-4" aria-label="Cart items">
              {blocked.length > 0 && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="flex-1">
                    {blocked.length === 1 ? "One item" : `${blocked.length} items`} can&apos;t be ordered right now. Remove {blocked.length === 1 ? "it" : "them"} to continue.
                  </p>
                  <button type="button" onClick={() => blocked.forEach((item) => removeItem(item.id))} className="shrink-0 font-bold underline">
                    Remove
                  </button>
                </div>
              )}
              {items.map((item) => {
                const url = productPath(item);
                const max = maxFor(item);
                const problem = item.unavailable ? "No longer available" : item.soldOut ? "Sold out" : null;
                return (
                  <article key={item.id} className={`card flex gap-4 p-4 ${problem ? "opacity-70" : ""}`}>
                    <Link to={url} className="shrink-0" tabIndex={-1} aria-hidden="true">
                      <ProductImage src={item.image} fallbackSrc={item.imageFallback} alt={item.title} fit="contain" className="h-24 w-24 rounded-2xl sm:h-28 sm:w-28" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link to={url} className="line-clamp-2 font-extrabold text-secondary hover:text-primary-600">{item.title}</Link>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatPrice(item.price)}
                            {item.oldPrice > item.price && <span className="ml-2 text-xs text-slate-400 line-through">{formatPrice(item.oldPrice)}</span>}
                          </p>
                          {problem && <p className="mt-1 text-xs font-bold text-rose-600">{problem}</p>}
                          {!problem && item.priceChanged && (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                              <RefreshCw className="h-3 w-3" aria-hidden="true" /> Price updated to today&apos;s price
                            </p>
                          )}
                          {!problem && item.tracked && max <= 5 && (
                            <p className="mt-1 text-xs font-semibold text-amber-700">Only {max} left</p>
                          )}
                        </div>
                        <button type="button" onClick={() => removeItem(item.id)} className="btn-delete shrink-0 p-1.5" aria-label={`Remove ${item.title}`}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                      {!problem && (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="px-3 py-2 text-slate-500 hover:text-primary-500 disabled:opacity-40" aria-label={`Decrease quantity of ${item.title}`}>
                              <Minus size={14} />
                            </button>
                            <span className="min-w-10 border-x border-slate-200 px-3 py-2 text-center text-sm font-bold text-secondary" aria-live="polite">{item.quantity}</span>
                            <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= max} className="px-3 py-2 text-slate-500 hover:text-primary-500 disabled:opacity-40" aria-label={`Increase quantity of ${item.title}`}>
                              <Plus size={14} />
                            </button>
                          </div>
                          <strong className="text-lg font-black text-secondary">{formatPrice(item.price * item.quantity)}</strong>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link to="/shop" className="link-primary text-sm">← Continue shopping</Link>
                <button type="button" onClick={clearCart} className="text-sm font-bold text-slate-400 hover:text-rose-500">Clear cart</button>
              </div>
            </section>

            <aside className="card h-fit p-5 sm:p-6 lg:sticky lg:top-28">
              <h2 className="text-lg font-black text-secondary">Order summary</h2>
              <div className="mt-5 space-y-3 border-b border-slate-100 pb-5 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal ({buyable.reduce((n, i) => n + i.quantity, 0)} items)</span><strong className="text-secondary">{formatPrice(subtotal)}</strong></div>
                {savings > 0 && <div className="flex justify-between text-slate-500"><span>You save</span><strong className="text-emerald-600">−{formatPrice(savings)}</strong></div>}
                <div className="flex justify-between text-slate-500"><span>Shipping</span><strong className="text-emerald-600">Free</strong></div>
              </div>
              <div className="mt-5 flex justify-between">
                <strong className="text-secondary">Total</strong>
                <strong className="text-2xl font-black text-primary-600">{formatPrice(subtotal)}</strong>
              </div>
              <p className="mt-1 text-xs text-slate-400">{checking ? "Checking current prices…" : "Coupons can be added at checkout."}</p>
              {blocked.length > 0 || buyable.length === 0 ? (
                <button type="button" disabled className="btn-primary mt-6 w-full py-3.5">Proceed to checkout <ArrowRight size={17} aria-hidden="true" /></button>
              ) : (
                <Link to="/checkout" className="btn-primary mt-6 w-full py-3.5">Proceed to checkout <ArrowRight size={17} aria-hidden="true" /></Link>
              )}
              <div className="mt-5 space-y-3 text-xs text-slate-500">
                <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-primary-500" aria-hidden="true" /> Buyer protection on eligible orders</p>
                <p className="flex items-center gap-2"><Truck size={16} className="text-primary-500" aria-hidden="true" /> Free shipping on all orders</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
