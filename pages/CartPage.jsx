import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Truck, Minus, Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { useCart } from "../src/context/CartContext";
import ProductImage from "../src/components/ProductImage";
import { formatMoney, formatPrice, getText, productPath } from "../src/utils/product";
import { convertLines, convertPrice, displayCurrency } from "../src/currency";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta } from "../src/i18n/seo";

export default function CartPage() {
  const { items, buyable, count, setQuantity, removeItem, clearCart, refresh, maxFor } = useCart();
  const [checking, setChecking] = useState(items.length > 0);
  // Display-currency amounts, unit prices converted first (the same rule as checkout)
  const code = displayCurrency();
  const savings = buyable.reduce((sum, item) => sum + (item.oldPrice > item.price ? (convertPrice(item.oldPrice) - convertPrice(item.price)) * item.quantity : 0), 0);
  const displaySubtotal = convertLines(buyable);
  const blocked = items.filter((item) => item.unavailable || item.soldOut);
  const { t } = useLanguage();
  usePageMeta({ title: t("cartPage.title") });
  const itemTitle = (item) => getText(item.name) || item.title; // in the visitor's language

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
          <p className="eyebrow">{t("cartPage.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black text-secondary">{t("cartPage.title")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {count ? t("cartPage.countIntro", { count }) : t("cartPage.intro")}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="card mx-auto max-w-lg p-10 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-black text-secondary">{t("cartPage.empty")}</h2>
            <p className="mt-2 text-sm text-slate-500">{t("cartPage.emptyText")}</p>
            <Link to="/shop" className="btn-primary mt-6">{t("cartPage.startShopping")} <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-4" aria-label={t("cartPage.items")}>
              {blocked.length > 0 && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="flex-1">
                    {t("cartPage.blocked", { count: blocked.length })}
                  </p>
                  <button type="button" onClick={() => blocked.forEach((item) => removeItem(item.id))} className="shrink-0 font-bold underline">
                    {t("cartPage.remove")}
                  </button>
                </div>
              )}
              {items.map((item) => {
                const url = productPath(item);
                const max = maxFor(item);
                const problem = item.unavailable ? t("cartPage.unavailable") : item.soldOut ? t("product.soldOut") : null;
                const title = itemTitle(item);
                return (
                  <article key={item.id} className={`card flex gap-4 p-4 ${problem ? "opacity-70" : ""}`}>
                    <Link to={url} className="shrink-0" tabIndex={-1} aria-hidden="true">
                      <ProductImage src={item.image} fallbackSrc={item.imageFallback} alt={title} fit="contain" className="h-24 w-24 rounded-2xl sm:h-28 sm:w-28" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link to={url} className="line-clamp-2 font-extrabold text-secondary hover:text-primary-600">{title}</Link>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatPrice(item.price)}
                            {item.oldPrice > item.price && <span className="ms-2 text-xs text-slate-400 line-through">{formatPrice(item.oldPrice)}</span>}
                          </p>
                          {problem && <p className="mt-1 text-xs font-bold text-rose-600">{problem}</p>}
                          {!problem && item.priceChanged && (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                              <RefreshCw className="h-3 w-3" aria-hidden="true" /> {t("cartPage.priceUpdated")}
                            </p>
                          )}
                          {!problem && item.tracked && max <= 5 && (
                            <p className="mt-1 text-xs font-semibold text-amber-700">{t("product.onlyLeft", { count: max })}</p>
                          )}
                        </div>
                        <button type="button" onClick={() => removeItem(item.id)} className="btn-delete shrink-0 p-1.5" aria-label={t("cartPage.removeNamed", { name: title })}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                      {!problem && (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="px-3 py-2 text-slate-500 hover:text-primary-500 disabled:opacity-40" aria-label={t("cartPage.decreaseNamed", { name: title })}>
                              <Minus size={14} />
                            </button>
                            <span className="min-w-10 border-x border-slate-200 px-3 py-2 text-center text-sm font-bold text-secondary" aria-live="polite">{item.quantity}</span>
                            <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= max} className="px-3 py-2 text-slate-500 hover:text-primary-500 disabled:opacity-40" aria-label={t("cartPage.increaseNamed", { name: title })}>
                              <Plus size={14} />
                            </button>
                          </div>
                          <strong className="text-lg font-black text-secondary">{formatMoney(convertPrice(item.price) * item.quantity, displayCurrency())}</strong>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link to="/shop" className="link-primary text-sm"><span aria-hidden="true" className="inline-block rtl:-scale-x-100">←</span> {t("cartPage.continue")}</Link>
                <button type="button" onClick={clearCart} className="text-sm font-bold text-slate-400 hover:text-rose-500">{t("cartPage.clear")}</button>
              </div>
            </section>

            <aside className="card h-fit p-5 sm:p-6 lg:sticky lg:top-28">
              <h2 className="text-lg font-black text-secondary">{t("cartPage.summary")}</h2>
              <div className="mt-5 space-y-3 border-b border-slate-100 pb-5 text-sm">
                <div className="flex justify-between text-slate-500"><span>{t("cartPage.subtotalItems", { count: buyable.reduce((n, i) => n + i.quantity, 0) })}</span><strong className="text-secondary">{formatMoney(displaySubtotal, code)}</strong></div>
                {savings > 0 && <div className="flex justify-between text-slate-500"><span>{t("cartPage.youSave")}</span><strong className="text-emerald-600"><bdi dir="ltr">−{formatMoney(savings, code)}</bdi></strong></div>}
                <div className="flex justify-between text-slate-500"><span>{t("cartPage.shipping")}</span><strong className="text-emerald-600">{t("cartPage.free")}</strong></div>
              </div>
              <div className="mt-5 flex justify-between">
                <strong className="text-secondary">{t("productPage.total")}</strong>
                <strong className="text-2xl font-black text-primary-600">{formatMoney(displaySubtotal, code)}</strong>
              </div>
              <p className="mt-1 text-xs text-slate-400">{checking ? t("cartPage.checking") : t("cartPage.couponHint")}</p>
              {blocked.length > 0 || buyable.length === 0 ? (
                <button type="button" disabled className="btn-primary mt-6 w-full py-3.5">{t("cartPage.proceed")} <ArrowRight size={17} aria-hidden="true" /></button>
              ) : (
                <Link to="/checkout" className="btn-primary mt-6 w-full py-3.5">{t("cartPage.proceed")} <ArrowRight size={17} aria-hidden="true" /></Link>
              )}
              <div className="mt-5 space-y-3 text-xs text-slate-500">
                <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-primary-500" aria-hidden="true" /> {t("cartPage.protection")}</p>
                <p className="flex items-center gap-2"><Truck size={16} className="text-primary-500" aria-hidden="true" /> {t("cartPage.freeShipping")}</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
