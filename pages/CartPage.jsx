import { Link } from "react-router-dom";
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Truck, Minus, Plus } from "lucide-react";
import { useCart } from "../src/context/CartContext";
import ProductImage from "../src/components/ProductImage";
import { formatPrice } from "../src/utils/product";

export default function CartPage() {
  const { items, count, subtotal, setQuantity, removeItem, clearCart, maxFor } = useCart();
  const savings = items.reduce((sum, item) => sum + (item.oldPrice > item.price ? (item.oldPrice - item.price) * item.quantity : 0), 0);

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
            <Link to="/shop" className="btn-primary mt-6">Start shopping <ArrowRight size={17} /></Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-4" aria-label="Cart items">
              {items.map((item) => (
                <article key={item.id} className="card flex gap-4 p-4">
                  <Link to={`/product/${item.id}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
                    <ProductImage src={item.image} fallbackSrc={item.imageFallback} alt={item.title} fit="contain" className="h-24 w-24 rounded-2xl sm:h-28 sm:w-28" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/product/${item.id}`} className="line-clamp-2 font-extrabold text-secondary hover:text-primary-600">{item.title}</Link>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatPrice(item.price)}
                          {item.oldPrice > item.price && <span className="ml-2 text-xs text-slate-400 line-through">{formatPrice(item.oldPrice)}</span>}
                        </p>
                      </div>
                      <button type="button" onClick={() => removeItem(item.id)} className="btn-delete shrink-0 p-1.5" aria-label={`Remove ${item.title}`}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="px-3 py-2 text-slate-500 hover:text-primary-500 disabled:opacity-40" aria-label="Decrease quantity">
                          <Minus size={14} />
                        </button>
                        <span className="min-w-10 border-x border-slate-200 px-3 py-2 text-center text-sm font-bold text-secondary" aria-live="polite">{item.quantity}</span>
                        <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= maxFor(item)} className="px-3 py-2 text-slate-500 hover:text-primary-500 disabled:opacity-40" aria-label="Increase quantity">
                          <Plus size={14} />
                        </button>
                      </div>
                      <strong className="text-lg font-black text-secondary">{formatPrice(item.price * item.quantity)}</strong>
                    </div>
                  </div>
                </article>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link to="/shop" className="link-primary text-sm">← Continue shopping</Link>
                <button type="button" onClick={clearCart} className="text-sm font-bold text-slate-400 hover:text-rose-500">Clear cart</button>
              </div>
            </section>

            <aside className="card h-fit p-5 sm:p-6">
              <h2 className="text-lg font-black text-secondary">Order summary</h2>
              <div className="mt-5 space-y-3 border-b border-slate-100 pb-5 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal ({count} items)</span><strong className="text-secondary">{formatPrice(subtotal)}</strong></div>
                {savings > 0 && <div className="flex justify-between text-slate-500"><span>You save</span><strong className="text-emerald-600">−{formatPrice(savings)}</strong></div>}
                <div className="flex justify-between text-slate-500"><span>Shipping</span><strong className="text-emerald-600">Free</strong></div>
              </div>
              <div className="mt-5 flex justify-between">
                <strong className="text-secondary">Total</strong>
                <strong className="text-2xl font-black text-primary-600">{formatPrice(subtotal)}</strong>
              </div>
              <Link to="/checkout" className="btn-primary mt-6 w-full py-3.5">Proceed to checkout <ArrowRight size={17} /></Link>
              <div className="mt-5 space-y-3 text-xs text-slate-500">
                <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-primary-500" /> Buyer protection on eligible orders</p>
                <p className="flex items-center gap-2"><Truck size={16} className="text-primary-500" /> Free shipping on all orders</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
