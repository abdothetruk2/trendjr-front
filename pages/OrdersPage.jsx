import { Link } from "react-router-dom";
import { Package, ChevronRight, RotateCw, ShoppingBag } from "lucide-react";
import useApi from "../src/hooks/useApi";
import useUrlParams from "../src/hooks/useUrlParams";
import ProductImage from "../src/components/ProductImage";
import StatusBadge from "../src/components/StatusBadge";
import { Pagination } from "../src/components/ProductGrid";
import { getImageUrl, getText, isExternalUrl, orderMoney } from "../src/utils/product";
import { formatDate } from "../src/utils/format";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta } from "../src/i18n/seo";
import { statusLabel } from "../src/components/StatusBadge";

const PAGE_SIZE = 10;
const FILTERS = ["", "pending", "processing", "shipped", "delivered", "cancelled"];

const itemsCount = (order) => (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

export default function OrdersPage() {
  const { get, update } = useUrlParams({ page: "1" });
  const status = get("status");
  const page = Math.max(1, parseInt(get("page"), 10) || 1);

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (status) query.set("status", status);
  const { data, total, loading, error, retry } = useApi(`/api/orders/my-orders?${query}`);
  const orders = Array.isArray(data) ? data : [];
  const totalPages = total ? Math.ceil(total / PAGE_SIZE) : 1;
  const { t } = useLanguage();
  usePageMeta({ title: t("nav.myOrders") });

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="mb-8">
          <p className="eyebrow">{t("orders.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black text-secondary">{t("nav.myOrders")}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("orders.intro")}</p>
        </div>

        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={t("orders.filter")}>
          {FILTERS.map((value) => {
            const filter = { value, label: value ? statusLabel("order", value) : t("orders.all") };
            const active = status === filter.value;
            return (
              <button
                key={filter.value || "all"}
                type="button"
                onClick={() => update({ status: filter.value, page: null })}
                aria-pressed={active}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  active ? "bg-primary-500 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-primary-300"
                }`}
              >
                {filter.label}{active && total != null ? ` (${total})` : ""}
              </button>
            );
          })}
        </div>

        {loading && !data ? (
          <div className="space-y-4" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => <div key={i} className="card h-40 animate-pulse bg-white" />)}
          </div>
        ) : error && !data ? (
          <div className="card p-8 text-center" role="alert">
            <p className="font-bold text-secondary">{t("orders.loadError")}</p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button type="button" onClick={retry} className="btn-primary btn-sm mt-4"><RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> {t("common.retry")}</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="card mx-auto max-w-lg p-10 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-black text-secondary">{status ? t("orders.noneStatus") : t("orders.none")}</h2>
            <p className="mt-2 text-sm text-slate-500">{status ? t("orders.tryFilter") : t("orders.noneText")}</p>
            {!status && <Link to="/shop" className="btn-primary mt-6"><ShoppingBag size={17} aria-hidden="true" /> {t("cartPage.startShopping")}</Link>}
          </div>
        ) : (
          <>
            <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
              {orders.map((order) => {
                const first = order.items?.[0];
                const more = (order.items?.length || 0) - 1;
                return (
                  <article key={order._id} className="card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-xs text-slate-400">{t("orders.number")}</p>
                        <h2 className="mt-1 font-mono font-extrabold text-secondary">{order.orderNumber}</h2>
                      </div>
                      <StatusBadge kind="order" status={order.status} />
                    </div>
                    <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center">
                      <ProductImage
                        src={getImageUrl(first?.image)}
                        fallbackSrc={isExternalUrl(first?.image) ? first.image : ""}
                        alt=""
                        fit="contain"
                        className="h-20 w-20 shrink-0 rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-1 font-bold text-secondary">
                          {getText(first?.name) || t("orders.order")}{more > 0 && <span className="font-semibold text-slate-400"> {t("orders.andMore", { count: more })}</span>}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">{t("orders.placedOn", { date: formatDate(order.createdAt) })} · {t("orders.items", { count: itemsCount(order) })}</p>
                        <strong className="mt-2 block text-primary-600">{orderMoney(order).total()}</strong>
                      </div>
                      <Link to={`/orders/${order._id}`} className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline">
                        {t("orders.viewDetails")} <ChevronRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
            {totalPages > 1 && (
              <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={(p) => update({ page: p }, { push: true })} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
