import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, MapPin, PartyPopper, RotateCw, StickyNote, TicketPercent, Wallet, XCircle } from "lucide-react";
import api, { getErrorMessage } from "../src/services/api";
import useApi from "../src/hooks/useApi";
import { useToast } from "../src/context/ToastContext";
import { useConfirm } from "../src/components/admin/ConfirmDialog";
import ProductImage from "../src/components/ProductImage";
import StatusBadge from "../src/components/StatusBadge";
import { getImageUrl, getText, isExternalUrl, orderMoney, productPath } from "../src/utils/product";
import { formatDateTime } from "../src/utils/format";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta } from "../src/i18n/seo";
import { statusLabel } from "../src/components/StatusBadge";

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"].map((status) => ({ status }));
const CANCELLABLE = ["pending", "confirmed"];

function Progress({ status }) {
  const { t } = useLanguage();
  if (status === "cancelled") return null;
  const current = Math.max(0, STEPS.findIndex((step) => step.status === status));
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label={t("orderDetail.progress")}>
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.status} className="flex flex-col items-center text-center" aria-current={i === current ? "step" : undefined}>
            <span className={`h-1.5 w-full rounded-full ${done ? "bg-primary-500" : "bg-slate-200"}`} aria-hidden="true" />
            <span className={`mt-2 whitespace-nowrap text-xs font-bold ${i === current ? "" : "max-sm:sr-only"} ${done ? "text-secondary" : "text-slate-400"}`}>
              {done && <CheckCircle2 className="me-0.5 inline h-3.5 w-3.5 text-primary-500" aria-hidden="true" />}
              {step.status === "pending" ? t("orderDetail.placed") : statusLabel("order", step.status)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const justPlaced = params.get("placed") === "1";
  const { data, loading, error, status, retry } = useApi(`/api/orders/${encodeURIComponent(id)}`);
  const [updated, setUpdated] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const order = updated || data;
  const { t } = useLanguage();
  usePageMeta({ title: order?.orderNumber ? t("orderDetail.metaTitle", { number: order.orderNumber }) : t("orders.order") });

  async function cancel() {
    const ok = await confirm({
      title: t("orderDetail.cancelTitle"),
      message: t("orderDetail.cancelText"),
      confirmLabel: t("orderDetail.cancel"),
      cancelLabel: t("orderDetail.keep"),
      tone: "danger",
    });
    if (!ok) return;
    setCancelling(true);
    try {
      const res = await api.patch(`/api/orders/${order._id}/cancel`);
      setUpdated(res.data);
      toast.success(t("orderDetail.cancelled"));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  if (loading && !data) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-surface" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-primary-500" aria-hidden="true" />
        <span className="sr-only">{t("orderDetail.loading")}</span>
      </main>
    );
  }

  if (error || !order) {
    const notFound = status === 404 || status === 400 || status === 403;
    return (
      <main className="min-h-[60vh] bg-surface py-16">
        <div className="container-page">
          <div className="card mx-auto max-w-lg p-8 text-center" role="alert">
            <h1 className="text-xl font-black text-secondary">{notFound ? t("orderDetail.notFound") : t("orderDetail.loadError")}</h1>
            <p className="mt-2 text-sm text-slate-500">{notFound ? t("orderDetail.notFoundText") : error}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {!notFound && <button type="button" onClick={retry} className="btn-primary"><RotateCw size={16} aria-hidden="true" /> {t("common.retry")}</button>}
              <Link to="/orders" className="btn-outline">{t("nav.myOrders")}</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const money = orderMoney(order);
  const address = order.shippingAddress || {};
  const addressLines = [address.fullName, address.address, [address.postalCode, address.city].filter(Boolean).join(" "), address.country, address.phone].filter(Boolean);

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page max-w-4xl">
        <Link to="/orders" className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-primary-600">
          <ArrowLeft size={16} aria-hidden="true" /> {t("nav.myOrders")}
        </Link>

        {justPlaced && order.status !== "cancelled" && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900" role="status">
            <PartyPopper className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" />
            <div>
              <p className="font-extrabold">{t("orderDetail.thanks")}</p>
              <p className="mt-1 text-sm">{t("orderDetail.thanksText", { phone: address.phone || t("orderDetail.yourPhone") })}</p>
            </div>
          </div>
        )}

        <div className="card p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs text-slate-400">{t("orders.number")}</p>
              <h1 className="mt-1 font-mono text-xl font-black text-secondary sm:text-2xl">{order.orderNumber}</h1>
              <p className="mt-1 text-xs text-slate-500">{t("orderDetail.placedAt", { date: formatDateTime(order.createdAt) })}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
              <StatusBadge kind="order" status={order.status} />
              <StatusBadge kind="payment" status={order.paymentStatus} />
            </div>
          </div>

          <div className="py-6">
            {order.status === "cancelled" ? (
              <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                <XCircle className="h-4 w-4" aria-hidden="true" /> {order.cancelledAt ? t("orderDetail.wasCancelledOn", { date: formatDateTime(order.cancelledAt) }) : t("orderDetail.wasCancelled")}
              </p>
            ) : (
              <Progress status={order.status} />
            )}
          </div>

          <h2 className="mb-3 text-sm font-extrabold text-secondary">{t("orderDetail.items")}</h2>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {(order.items || []).map((item, index) => {
              const title = getText(item.name) || t("orderDetail.product");
              const link = item.productId ? productPath({ id: item.productId, slug: item.slug }) : null;
              return (
                <li key={`${item.product}-${index}`} className="flex items-center gap-3 p-3 sm:p-4">
                  <ProductImage src={getImageUrl(item.image)} fallbackSrc={isExternalUrl(item.image) ? item.image : ""} alt="" fit="contain" className="h-16 w-16 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    {link
                      ? <Link to={link} className="line-clamp-2 text-sm font-bold text-secondary hover:text-primary-600">{title}</Link>
                      : <p className="line-clamp-2 text-sm font-bold text-secondary">{title}</p>}
                    <p className="mt-1 text-xs text-slate-400">{item.quantity} × {money.unit(item.price)}</p>
                  </div>
                  <strong className="text-sm tabular-nums text-secondary">{money.line(item)}</strong>
                </li>
              );
            })}
          </ul>

          <dl className="ms-auto mt-4 max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-slate-500"><dt>{t("checkout.subtotal")}</dt><dd className="tabular-nums">{money.subtotal()}</dd></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt className="inline-flex items-center gap-1"><TicketPercent className="h-3.5 w-3.5" aria-hidden="true" /> {t("checkout.discount")}{order.coupon?.code ? ` (${order.coupon.code})` : ""}</dt>
                <dd className="tabular-nums"><bdi dir="ltr">−{money.discount()}</bdi></dd>
              </div>
            )}
            <div className="flex justify-between text-slate-500"><dt>{t("cartPage.shipping")}</dt><dd>{order.shippingFee ? money.shipping() : t("cartPage.free")}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-black text-secondary"><dt>{t("productPage.total")}</dt><dd className="tabular-nums">{money.total()}</dd></div>
          </dl>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm">
              <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {t("account.address")}</p>
              {addressLines.map((line) => <p key={line} className="text-slate-700">{line}</p>)}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm">
              <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"><Wallet className="h-3.5 w-3.5" aria-hidden="true" /> {t("orderDetail.payment")}</p>
              <p className="text-slate-700">{order.paymentMethod === "card" ? t("orderDetail.card") : t("footer.cod")}</p>
            </div>
          </div>

          {order.notes && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold"><StickyNote className="h-3.5 w-3.5" aria-hidden="true" /> {t("orderDetail.note")}</p>
              <p className="whitespace-pre-line">{order.notes}</p>
            </div>
          )}

          {CANCELLABLE.includes(order.status) && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <p className="text-xs text-slate-500">{t("orderDetail.cancelHint")}</p>
              <button type="button" onClick={cancel} disabled={cancelling} className="btn bg-rose-50 text-rose-700 hover:bg-rose-100">
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
                {t("orderDetail.cancel")}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
