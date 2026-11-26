import { useState } from "react";
import { Link } from "react-router-dom";
import { ReceiptText, Eye, Loader2, MapPin, UserRound, StickyNote, TicketPercent } from "lucide-react";
import useApi from "../../src/hooks/useApi";
import useUrlParams from "../../src/hooks/useUrlParams";
import api, { getErrorMessage } from "../../src/services/api";
import { useToast } from "../../src/context/ToastContext";
import { useConfirm } from "../../src/components/admin/ConfirmDialog";
import Modal from "../../src/components/admin/Modal";
import ProductImage from "../../src/components/ProductImage";
import {
  PageHeader, Panel, Toolbar, SearchBox, FilterSelect, StatusBadge, EmptyState, ErrorState, TableSkeleton, ListFooter,
  ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS,
} from "../../src/components/admin/AdminUI";
import { formatPrice, getImageUrl, getText, isExternalUrl, orderMoney } from "../../src/utils/product";
import { formatDateTime, formatNumber, fromDateInput } from "../../src/utils/format";
import useLanguage from "../../src/i18n/useLanguage";
import { statusLabel } from "../../src/components/StatusBadge";
import i18n from "../../src/i18n";

const PAGE_SIZE = 20;

const itemsCount = (order) => (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
const customerName = (order) => order.user?.username || order.user?.email || order.shippingAddress?.fullName || i18n.t("dashboard.deletedCustomer", { ns: "admin" });

export default function AdminOrdersPage() {
  const { get, update } = useUrlParams({ page: "1" });
  const { t } = useLanguage("admin");
  const [selected, setSelected] = useState(null);

  const page = Math.max(1, parseInt(get("page"), 10) || 1);
  const filters = { search: get("search"), status: get("status"), paymentStatus: get("payment"), from: get("from"), to: get("to") };

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (filters.search) query.set("search", filters.search);
  if (filters.status) query.set("status", filters.status);
  if (filters.paymentStatus) query.set("paymentStatus", filters.paymentStatus);
  if (filters.from) query.set("from", fromDateInput(filters.from) || "");
  if (filters.to) query.set("to", fromDateInput(filters.to, { endOfDay: true }) || "");
  const { data, total, loading, error, retry } = useApi(`/api/orders?${query}`);

  const orders = Array.isArray(data) ? data : [];
  const filtered = Object.values(filters).some(Boolean);
  const setFilter = (key) => (value) => update({ [key]: value, page: null });

  return (
    <div>
      <PageHeader
        title={t("layout.nav.orders")}
        description={total != null ? t(filtered ? "adminOrders.countFiltered" : "chart.ordersCount", { count: total, formatted: formatNumber(total) }) : t("adminOrders.intro")}
      />

      <Toolbar>
        <SearchBox value={filters.search} onSearch={setFilter("search")} placeholder={t("adminOrders.searchPlaceholder")} label={t("adminOrders.search")} />
        <FilterSelect label={t("ui.status")} value={filters.status} onChange={setFilter("status")} options={ORDER_STATUS_OPTIONS} />
        <FilterSelect label={t("orderDetail.payment")} value={filters.paymentStatus} onChange={setFilter("payment")} options={PAYMENT_STATUS_OPTIONS} />
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white ps-3 text-xs font-semibold text-slate-500 focus-within:border-primary-500">
          {t("adminOrders.from")}
          <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilter("from")(e.target.value)} className="rounded-e-xl bg-transparent py-2 pe-2 text-sm font-bold text-slate-800 outline-none" />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white ps-3 text-xs font-semibold text-slate-500 focus-within:border-primary-500">
          {t("adminOrders.to")}
          <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter("to")(e.target.value)} className="rounded-e-xl bg-transparent py-2 pe-2 text-sm font-bold text-slate-800 outline-none" />
        </label>
      </Toolbar>

      <Panel>
        {loading && !data ? (
          <TableSkeleton rows={8} cols={6} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={retry} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={filtered ? t("adminOrders.noMatch") : t("orders.none")}
            message={filtered ? t("adminOrders.noMatchText") : t("adminOrders.noneText")}
            action={filtered && <Link to="/admin/orders" className="btn-outline btn-sm">{t("ui.clearFilters")}</Link>}
          />
        ) : (
          <>
            <div className={`relative overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[820px] text-sm">
                <caption className="sr-only">{t("layout.nav.orders")}</caption>
                <thead className="bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">{t("orders.order")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("adminOrders.customer")}</th>
                    <th scope="col" className="px-4 py-3 text-end font-bold">{t("productPage.total")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("orderDetail.payment")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("ui.status")}</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">{t("ui.actions")}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-mono text-sm font-bold text-secondary">{order.orderNumber}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(order.createdAt)} · {t("orders.items", { count: itemsCount(order) })}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{customerName(order)}</p>
                        {order.user?.email && <p className="text-xs text-slate-400">{order.user.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-end font-extrabold tabular-nums text-secondary">
                        {formatPrice(order.totalPrice)}
                        {orderMoney(order).converted && <span className="block text-xs font-semibold text-slate-400">{orderMoney(order).total()}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge kind="payment" status={order.paymentStatus} />
                          <span className="text-xs text-slate-400">{order.paymentMethod === "card" ? t("orderDetail.card") : t("footer.cod")}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge kind="order" status={order.status} /></td>
                      <td className="px-4 py-3 text-end">
                        <button type="button" onClick={() => setSelected(order)} className="btn-outline btn-sm">
                          <Eye className="h-4 w-4" aria-hidden="true" /> {t("adminOrders.view")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ListFooter page={page} pageSize={PAGE_SIZE} total={total ?? 0} shown={orders.length} onPage={(p) => update({ page: p }, { push: true })} />
          </>
        )}
      </Panel>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? t("orderDetail.metaTitle", { number: selected.orderNumber }) : ""}
        description={selected ? t("orderDetail.placedAt", { date: formatDateTime(selected.createdAt) }) : ""}
        size="lg"
      >
        {selected && (
          <OrderDetail
            order={selected}
            onChanged={(updated) => { setSelected((prev) => ({ ...updated, user: prev.user })); retry(); }}
          />
        )}
      </Modal>
    </div>
  );
}

function OrderDetail({ order, onChanged }) {
  const toast = useToast();
  const { t } = useLanguage("admin");
  const confirm = useConfirm();
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [saving, setSaving] = useState("");

  async function saveStatus() {
    if (status === order.status) return;
    if (status === "cancelled" && !(await confirm({
      title: t("orderDetail.cancelTitle"),
      message: t("adminOrders.cancelText"),
      confirmLabel: t("orderDetail.cancel"),
      cancelLabel: t("orderDetail.keep"),
      tone: "danger",
    }))) return;
    setSaving("status");
    try {
      const res = await api.patch(`/api/orders/${order._id}/status`, { status });
      toast.success(t("adminOrders.markedAs", { status: statusLabel("order", status) }));
      onChanged(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setStatus(order.status);
    } finally {
      setSaving("");
    }
  }

  async function savePayment() {
    if (paymentStatus === order.paymentStatus) return;
    setSaving("payment");
    try {
      const res = await api.patch(`/api/orders/${order._id}/payment`, { paymentStatus });
      toast.success(t("adminOrders.paymentUpdated"));
      onChanged(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setPaymentStatus(order.paymentStatus);
    } finally {
      setSaving("");
    }
  }

  const address = order.shippingAddress || {};
  const addressLines = [address.fullName, address.address, [address.postalCode, address.city].filter(Boolean).join(" "), address.country, address.phone].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Status controls */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="order-status" className="text-xs font-bold text-slate-600">{t("adminOrders.orderStatus")}</label>
            <StatusBadge kind="order" status={order.status} />
          </div>
          <div className="flex gap-2">
            <select id="order-status" value={status} onChange={(e) => setStatus(e.target.value)} className="input">
              {ORDER_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button type="button" onClick={saveStatus} disabled={status === order.status || saving !== ""} className="btn-primary btn-sm shrink-0">
              {saving === "status" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : t("adminOrders.update")}
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="payment-status" className="text-xs font-bold text-slate-600">{t("orderDetail.payment")} ({order.paymentMethod === "card" ? t("orderDetail.card") : t("footer.cod")})</label>
            <StatusBadge kind="payment" status={order.paymentStatus} />
          </div>
          <div className="flex gap-2">
            <select id="payment-status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="input">
              {PAYMENT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button type="button" onClick={savePayment} disabled={paymentStatus === order.paymentStatus || saving !== ""} className="btn-primary btn-sm shrink-0">
              {saving === "payment" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : t("adminOrders.update")}
            </button>
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <h3 className="mb-2 text-sm font-extrabold text-secondary">{t("orderDetail.items")}</h3>
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {(order.items || []).map((item, index) => (
            <li key={`${item.product}-${index}`} className="flex items-center gap-3 p-3">
              <ProductImage src={getImageUrl(item.image)} fallbackSrc={isExternalUrl(item.image) ? item.image : ""} alt="" className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-secondary">{getText(item.name) || t("product.unnamed")}</p>
                <p className="text-xs text-slate-400">{item.quantity} × {formatPrice(item.price)}{item.sku ? ` · ${t("productPage.sku")} ${item.sku}` : ""}</p>
              </div>
              <p className="text-sm font-extrabold tabular-nums text-secondary">{formatPrice(item.subtotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="ms-auto mt-3 max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500"><dt>{t("checkout.subtotal")}</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
          <div className="flex justify-between text-slate-500"><dt>{t("cartPage.shipping")}</dt><dd className="tabular-nums">{order.shippingFee ? formatPrice(order.shippingFee) : t("cartPage.free")}</dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <dt className="inline-flex items-center gap-1"><TicketPercent className="h-3.5 w-3.5" aria-hidden="true" /> {t("checkout.discount")}{order.coupon?.code ? ` (${order.coupon.code})` : ""}</dt>
              <dd className="tabular-nums"><bdi dir="ltr">−{formatPrice(order.discount)}</bdi></dd>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-1.5 font-extrabold text-secondary"><dt>{t("productPage.total")}</dt><dd className="tabular-nums">{formatPrice(order.totalPrice)}</dd></div>
          {orderMoney(order).converted && (
            <div className="flex justify-between text-xs text-slate-500">
              <dt>{t("adminOrders.customerCurrency", { code: order.currency.code })}</dt>
              <dd className="tabular-nums">{orderMoney(order).total()}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Customer & delivery */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"><UserRound className="h-3.5 w-3.5" aria-hidden="true" /> {t("adminOrders.customer")}</p>
          <p className="font-bold text-secondary">{order.user?.username || "—"}</p>
          <p className="text-slate-500">{order.user?.email || t("adminOrders.accountDeleted")}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {t("account.address")}</p>
          {addressLines.length ? addressLines.map((line) => <p key={line} className="text-slate-700">{line}</p>) : <p className="text-slate-400">{t("adminOrders.noAddress")}</p>}
        </div>
      </div>

      {order.notes && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold"><StickyNote className="h-3.5 w-3.5" aria-hidden="true" /> {t("adminOrders.customerNote")}</p>
          <p className="whitespace-pre-line">{order.notes}</p>
        </div>
      )}

      {order.cancelledAt && <p className="text-xs text-slate-400">{t("adminOrders.cancelledAt", { date: formatDateTime(order.cancelledAt) })}</p>}
    </div>
  );
}
