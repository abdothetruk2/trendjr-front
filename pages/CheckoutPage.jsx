import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LockKeyhole, Truck, CreditCard, ShieldCheck, ChevronRight, Loader2, TicketPercent, AlertTriangle, X,
  ShoppingBag, CheckCircle2,
} from "lucide-react";
import api, { getErrorMessage } from "../src/services/api";
import { useAuth } from "../src/context/AuthContext";
import { useCart } from "../src/context/CartContext";
import { useToast } from "../src/context/ToastContext";
import ProductImage from "../src/components/ProductImage";
import { formatMoney, formatPrice, getImageUrl, getText, isExternalUrl } from "../src/utils/product";
import { BASE_CURRENCY, displayCurrency } from "../src/currency";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta } from "../src/i18n/seo";
import { translateServerMessage } from "../src/i18n/serverMessages";
import i18n from "../src/i18n";

const PHONE_PATTERN = /^[+\d][\d\s()./-]{3,29}$/;
const COUNTRY_SUGGESTIONS = ["DE", "AT", "CH", "NL", "BE", "FR", "IT", "ES", "EG"]; // shown in the visitor's language

function validate(form) {
  const errors = {};
  const t = i18n.t.bind(i18n);
  if (!form.fullName.trim()) errors.fullName = t("checkout.errors.fullName");
  if (!PHONE_PATTERN.test(form.phone.trim())) errors.phone = t("checkout.errors.phone");
  if (!form.address.trim()) errors.address = t("checkout.errors.address");
  if (!form.city.trim()) errors.city = t("checkout.errors.city");
  if (!form.country.trim()) errors.country = t("checkout.errors.country");
  return errors;
}

function FieldError({ id, children }) {
  if (!children) return null;
  return <span id={id} className="mt-1.5 block text-xs font-semibold text-rose-600">{children}</span>;
}

export default function CheckoutPage() {
  const { user, updateUser } = useAuth();
  const { items, buyable, refresh, clearCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const currencyCode = displayCurrency();
  usePageMeta({ title: t("checkout.title") });
  const countryNames = useMemo(() => {
    try {
      const names = new Intl.DisplayNames([locale], { type: "region" });
      return COUNTRY_SUGGESTIONS.map((code) => names.of(code));
    } catch {
      return [];
    }
  }, [locale]);

  const saved = user?.addresses?.[0] || {};
  const [form, setForm] = useState(() => ({
    fullName: saved.fullName || "",
    phone: saved.phone || user?.phone || "",
    address: saved.street || "",
    city: saved.city || "",
    postalCode: saved.postalCode || "",
    country: saved.country || "",
    notes: "",
  }));
  const [saveAddress, setSaveAddress] = useState(!user?.addresses?.length);
  const [errors, setErrors] = useState({});
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponNote, setCouponNote] = useState(null); // { ok, text }
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoting, setQuoting] = useState(true);
  const [placing, setPlacing] = useState(false);

  // Editing a field clears its error message
  const set = (key) => (e) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((errs) => (errs[key] ? { ...errs, [key]: undefined } : errs));
  };

  // Current prices and stock for what's in the cart
  useEffect(() => {
    const controller = new AbortController();
    refresh({ signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [refresh]);

  const lines = useMemo(() => buyable.map((item) => ({ product: item.id, quantity: item.quantity })), [buyable]);
  const linesKey = JSON.stringify(lines);

  // The server's price for this exact order (prices, stock, coupon, total)
  useEffect(() => {
    if (lines.length === 0) {
      setQuote(null);
      setQuoting(false);
      return undefined;
    }
    const controller = new AbortController();
    setQuoting(true);
    // The server converts to the display currency with its own exchange rate
    api.post("/api/orders/quote", { items: lines, couponCode: couponCode || undefined, currency: currencyCode }, { signal: controller.signal })
      .then((res) => {
        setQuote(res.data);
        setQuoteError("");
        if (couponCode && res.data.couponError) {
          setCouponNote({ ok: false, text: translateServerMessage(res.data.couponError) });
          setCouponCode("");
        } else if (couponCode && res.data.coupon) {
          setCouponNote({ ok: true, code: res.data.coupon.code });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setQuoteError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoting(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, couponCode, currencyCode]);

  function applyCoupon(e) {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponNote(null);
    setCouponCode(code);
  }

  function removeCoupon() {
    setCouponCode("");
    setCouponInput("");
    setCouponNote(null);
  }

  async function placeOrder(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error(t("checkout.completeDetails"));
      document.getElementById(`checkout-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    if (!quote?.ok) {
      toast.error(translateServerMessage(quote?.problems?.[0]?.message) || t("checkout.reviewCart"));
      return;
    }

    const shippingAddress = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim(),
    };

    setPlacing(true);
    try {
      const res = await api.post("/api/orders", {
        items: lines,
        shippingAddress,
        paymentMethod: "cash",
        notes: form.notes.trim() || undefined,
        couponCode: couponCode || undefined,
        currency: currencyCode,
      });
      if (saveAddress) {
        const { address, ...rest } = shippingAddress;
        api.patch("/api/auth/me", { address: { ...rest, street: address } })
          .then((r) => updateUser(r.data.user))
          .catch(() => {});
      }
      clearCart();
      navigate(`/orders/${res.data._id}?placed=1`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      // Stock or prices may have changed: show the current state
      refresh().catch(() => {});
      setPlacing(false);
    }
  }

  const unavailableCount = items.length - buyable.length;
  // Amounts as priced by the server: in the display currency when it converted them,
  // otherwise in the base currency
  const shown = quote?.display || null;
  const money = (key) => (shown ? formatMoney(shown[key], shown.code) : formatMoney(quote?.[key] ?? 0, BASE_CURRENCY));
  const lineMoney = (item, key) => {
    const converted = shown?.items?.find((line) => String(line.product) === String(item.product));
    return converted ? formatMoney(converted[key], shown.code) : formatMoney(item[key], BASE_CURRENCY);
  };
  const summaryItems = quote?.items ?? buyable.map((item) => ({
    product: item.id, name: item.title, image: null, price: item.price, quantity: item.quantity, subtotal: item.price * item.quantity,
  }));

  if (items.length === 0) {
    return (
      <main className="min-h-[70vh] bg-surface py-12">
        <div className="container-page">
          <div className="card mx-auto max-w-lg p-10 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-black text-secondary">{t("cartPage.empty")}</h1>
            <p className="mt-2 text-sm text-slate-500">{t("checkout.emptyText")}</p>
            <Link to="/shop" className="btn-primary mt-6">{t("notFound.browse")}</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="mb-8">
          <p className="eyebrow">{t("checkout.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black text-secondary">{t("checkout.title")}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("checkout.intro")}</p>
        </div>

        {unavailableCount > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{t("checkout.unavailable", { count: unavailableCount })}</span>
            <Link to="/cart" className="font-bold underline">{t("checkout.reviewCartLink")}</Link>
          </div>
        )}

        <form onSubmit={placeOrder} noValidate className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <section className="card p-5 sm:p-7" aria-labelledby="checkout-shipping">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600"><Truck aria-hidden="true" /></span>
                <div>
                  <h2 id="checkout-shipping" className="font-extrabold text-secondary">{t("checkout.shippingInfo")}</h2>
                  <p className="text-xs text-slate-400">{t("checkout.shippingText")}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-600 sm:col-span-2">{t("address.fullName")} *
                  <input id="checkout-fullName" value={form.fullName} onChange={set("fullName")} autoComplete="name" maxLength={100} className="input mt-2" placeholder={t("checkout.namePlaceholder")} aria-invalid={errors.fullName ? true : undefined} aria-describedby="err-fullName" />
                  <FieldError id="err-fullName">{errors.fullName}</FieldError>
                </label>
                <label className="text-xs font-bold text-slate-600">{t("checkout.phone")} *
                  <input id="checkout-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" maxLength={30} className="input mt-2" placeholder={t("checkout.phonePlaceholder")} aria-invalid={errors.phone ? true : undefined} aria-describedby="err-phone" />
                  <FieldError id="err-phone">{errors.phone}</FieldError>
                </label>
                <label className="text-xs font-bold text-slate-600">{t("account.email")}
                  <input type="email" value={user?.email || ""} readOnly className="input mt-2 bg-slate-50 text-slate-500" />
                  <span className="mt-1.5 block text-[11px] font-normal text-slate-400">{t("checkout.emailHint")}</span>
                </label>
                <label className="text-xs font-bold text-slate-600 sm:col-span-2">{t("address.street")} *
                  <input id="checkout-address" value={form.address} onChange={set("address")} autoComplete="street-address" maxLength={200} className="input mt-2" placeholder={t("address.streetPlaceholder")} aria-invalid={errors.address ? true : undefined} aria-describedby="err-address" />
                  <FieldError id="err-address">{errors.address}</FieldError>
                </label>
                <label className="text-xs font-bold text-slate-600">{t("address.city")} *
                  <input id="checkout-city" value={form.city} onChange={set("city")} autoComplete="address-level2" maxLength={100} className="input mt-2" placeholder={t("address.city")} aria-invalid={errors.city ? true : undefined} aria-describedby="err-city" />
                  <FieldError id="err-city">{errors.city}</FieldError>
                </label>
                <label className="text-xs font-bold text-slate-600">{t("address.postalCode")}
                  <input value={form.postalCode} onChange={set("postalCode")} autoComplete="postal-code" maxLength={20} className="input mt-2" placeholder={t("address.postalCode")} />
                </label>
                <label className="text-xs font-bold text-slate-600 sm:col-span-2">{t("address.country")} *
                  <input id="checkout-country" value={form.country} onChange={set("country")} autoComplete="country-name" maxLength={60} list="checkout-countries" className="input mt-2" placeholder={t("address.country")} aria-invalid={errors.country ? true : undefined} aria-describedby="err-country" />
                  <datalist id="checkout-countries">
                    {countryNames.map((c) => <option key={c} value={c} />)}
                  </datalist>
                  <FieldError id="err-country">{errors.country}</FieldError>
                </label>
                <label className="text-xs font-bold text-slate-600 sm:col-span-2">{t("checkout.notes")}
                  <textarea value={form.notes} onChange={set("notes")} maxLength={500} className="input mt-2 min-h-24" placeholder={t("checkout.notesPlaceholder")} />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 accent-primary" />
                  {t("checkout.saveAddress")}
                </label>
              </div>
            </section>

            <section className="card p-5 sm:p-7" aria-labelledby="checkout-payment">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600"><CreditCard aria-hidden="true" /></span>
                <div>
                  <h2 id="checkout-payment" className="font-extrabold text-secondary">{t("checkout.payment")}</h2>
                  <p className="text-xs text-slate-400">{t("checkout.paymentText")}</p>
                </div>
              </div>
              <div className="space-y-3" role="radiogroup" aria-labelledby="checkout-payment">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-primary-300 bg-primary-50/50 p-4">
                  <input type="radio" name="payment" value="cash" defaultChecked className="accent-primary" />
                  <span className="flex-1">
                    <strong className="block text-sm text-secondary">{t("footer.cod")}</strong>
                    <span className="text-xs text-slate-500">{t("checkout.codText")}</span>
                  </span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 opacity-60">
                  <input type="radio" name="payment" value="card" disabled />
                  <span className="flex-1">
                    <strong className="block text-sm text-secondary">{t("checkout.card")}</strong>
                    <span className="text-xs text-slate-500">{t("checkout.comingSoon")}</span>
                  </span>
                </label>
              </div>
            </section>
          </div>

          <aside className="card h-fit p-5 sm:p-6 lg:sticky lg:top-28" aria-labelledby="checkout-summary">
            <h2 id="checkout-summary" className="text-lg font-black text-secondary">{t("checkout.yourOrder")}</h2>

            <ul className="mt-5 max-h-80 space-y-3 overflow-y-auto pe-1">
              {summaryItems.map((item) => {
                const cartItem = buyable.find((i) => String(i.id) === String(item.product));
                const image = item.image ? getImageUrl(item.image) : cartItem?.image;
                const fallback = item.image && isExternalUrl(item.image) ? item.image : cartItem?.imageFallback;
                return (
                  <li key={item.product} className="flex gap-3">
                    <ProductImage src={image} fallbackSrc={fallback} alt="" fit="contain" className="h-16 w-16 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold text-secondary">{getText(cartItem?.name) || getText(item.name) || cartItem?.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{t("checkout.qty", { count: item.quantity, price: quote ? lineMoney(item, "price") : formatPrice(item.price) })}</p>
                      {item.problem && <p className="mt-1 text-xs font-semibold text-rose-600">{translateServerMessage(item.problem)}</p>}
                    </div>
                    <strong className="text-sm tabular-nums text-secondary">{quote ? lineMoney(item, "subtotal") : formatPrice(item.subtotal)}</strong>
                  </li>
                );
              })}
            </ul>

            {/* Coupon */}
            <div className="mt-5 border-t border-slate-100 pt-5">
              {couponCode && quote?.coupon ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1 font-semibold">{couponNote?.ok
                    ? t("checkout.couponApplied", { code: couponNote.code, amount: money("discount") })
                    : t("checkout.couponAppliedShort", { code: quote.coupon.code })}</span>
                  <button type="button" onClick={removeCoupon} className="rounded-lg p-1 hover:bg-emerald-100" aria-label={t("checkout.removeCoupon")}>
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div>
                  <label htmlFor="checkout-coupon" className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <TicketPercent className="h-3.5 w-3.5" aria-hidden="true" /> {t("checkout.couponCode")}
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="checkout-coupon"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === "Enter") applyCoupon(e); }}
                      className="input font-mono uppercase"
                      placeholder={t("checkout.enterCode")}
                      maxLength={32}
                      aria-describedby="checkout-coupon-note"
                    />
                    <button type="button" onClick={applyCoupon} disabled={!couponInput.trim() || quoting} className="btn-outline shrink-0 px-4">
                      {t("checkout.apply")}
                    </button>
                  </div>
                  {couponNote && !couponNote.ok && (
                    <p id="checkout-coupon-note" className="mt-1.5 text-xs font-semibold text-rose-600" role="alert">{couponNote.text}</p>
                  )}
                </div>
              )}
            </div>

            <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm" aria-live="polite">
              <div className="flex justify-between text-slate-500">
                <dt>{t("checkout.subtotal")}</dt>
                <dd className="font-bold tabular-nums text-secondary">{quote ? money("subtotal") : "…"}</dd>
              </div>
              {quote?.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>{t("checkout.discount")}{quote.coupon ? ` (${quote.coupon.code})` : ""}</dt>
                  <dd className="font-bold tabular-nums"><bdi dir="ltr">−{money("discount")}</bdi></dd>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <dt>{t("cartPage.shipping")}</dt>
                <dd className="font-bold text-emerald-600">{quote && quote.shippingFee > 0 ? money("shippingFee") : t("cartPage.free")}</dd>
              </div>
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t border-slate-100 pt-5">
              <strong className="text-secondary">{t("productPage.total")}</strong>
              <strong className="text-2xl font-black tabular-nums text-primary-600">
                {quoting && !quote ? <Loader2 className="h-5 w-5 animate-spin" aria-label={t("checkout.calculating")} /> : money("total")}
              </strong>
            </div>

            {quoteError && (
              <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" role="alert">{quoteError}</p>
            )}
            {quote && !quote.ok && quote.problems?.length > 0 && (
              <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900" role="alert">
                <p className="font-bold">{t("checkout.attention")}</p>
                <ul className="mt-1 list-disc ps-4">
                  {quote.problems.map((p) => <li key={p.product}>{translateServerMessage(p.message)}</li>)}
                </ul>
                <Link to="/cart" className="mt-1 inline-block font-bold underline">{t("checkout.updateCart")}</Link>
              </div>
            )}

            <button type="submit" disabled={placing || quoting || !quote?.ok || lines.length === 0} className="btn-primary mt-6 w-full py-3.5">
              {placing ? <><Loader2 size={17} className="animate-spin" aria-hidden="true" /> {t("checkout.placing")}</> : <>{t("checkout.place", { total: money("total") })} <ChevronRight size={17} aria-hidden="true" /></>}
            </button>
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
              <LockKeyhole size={14} aria-hidden="true" /> {t("checkout.payOnArrival")}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={15} className="text-primary-500" aria-hidden="true" /> {t("checkout.protection")}
            </p>
          </aside>
        </form>
      </div>
    </main>
  );
}
