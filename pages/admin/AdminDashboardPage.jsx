import { Link } from "react-router-dom";
import { CircleDollarSign, ShoppingCart, Package, Users, RotateCw, ArrowRight, Trophy, Receipt, PackageX, AlertTriangle, Infinity as InfinityIcon } from "lucide-react";
import useApi from "../../src/hooks/useApi";
import useUrlParams from "../../src/hooks/useUrlParams";
import SalesChart from "../../src/components/admin/SalesChart";
import ProductImage from "../../src/components/ProductImage";
import { PageHeader, Panel, StatusBadge, EmptyState, ErrorState } from "../../src/components/admin/AdminUI";
import { formatPrice, getImageUrl, getText, isExternalUrl } from "../../src/utils/product";
import { formatDateTime, formatNumber } from "../../src/utils/format";
import useLanguage from "../../src/i18n/useLanguage";

const PERIODS = ["7", "30", "90"];
const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

function StatCard({ icon: Icon, label, value, detail, loading }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-600">
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
      </div>
      {loading ? (
        <div className="mt-3 space-y-2" aria-hidden="true">
          <div className="h-8 w-28 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <>
          <p className="mt-2 text-3xl font-black tracking-tight text-secondary">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </>
      )}
    </div>
  );
}

// Stock alerts: each links to the Inventory page with that filter
function StockLink({ to, icon: Icon, tone, label, value, detail, loading }) {
  return (
    <Link to={to} className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-slate-500">{label}</span>
        <span className="block truncate text-xs text-slate-400">{detail}</span>
      </span>
      {loading
        ? <span className="h-6 w-10 animate-pulse rounded bg-slate-100" aria-hidden="true" />
        : <span className="text-xl font-black tabular-nums text-secondary">{formatNumber(value)}</span>}
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { get, update } = useUrlParams({ days: "30" });
  const { t } = useLanguage("admin");
  const days = PERIODS.includes(get("days")) ? get("days") : "30";
  const { data, loading, error, retry } = useApi(`/api/admin/stats?days=${days}&tz=${encodeURIComponent(TIME_ZONE)}`);

  const firstLoad = loading && !data;
  const refreshing = loading && Boolean(data);
  const totals = data?.totals;
  const period = data?.period;

  return (
    <div>
      <PageHeader
        title={t("layout.nav.dashboard")}
        description={t("dashboard.intro")}
        actions={(
          <>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label={t("dashboard.period")}>
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => update({ days: p })}
                  aria-pressed={days === p}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    days === p ? "bg-secondary text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t("dashboard.lastDays", { count: Number(p) })}
                </button>
              ))}
            </div>
            <button type="button" onClick={retry} className="btn-outline btn-sm" disabled={loading}>
              <RotateCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" /> {t("dashboard.refresh")}
            </button>
          </>
        )}
      />

      {error && !data ? (
        <div className="card"><ErrorState message={error} onRetry={retry} /></div>
      ) : (
        <div className={`space-y-6 transition-opacity ${refreshing ? "opacity-60" : ""}`}>
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={CircleDollarSign}
              label={t("dashboard.totalSales")}
              loading={firstLoad}
              value={formatPrice(totals?.revenue)}
              detail={t("dashboard.salesDetail", { amount: formatPrice(period?.revenue), count: Number(days), paid: formatPrice(totals?.paidRevenue) })}
            />
            <StatCard
              icon={ShoppingCart}
              label={t("dashboard.totalOrders")}
              loading={firstLoad}
              value={formatNumber(totals?.orders)}
              detail={t("dashboard.ordersDetail", { placed: formatNumber(period?.ordersPlaced), count: Number(days), pending: formatNumber(totals?.pendingOrders) })}
            />
            <StatCard
              icon={Package}
              label={t("dashboard.totalProducts")}
              loading={firstLoad}
              value={formatNumber(totals?.products)}
              detail={t("dashboard.productsDetail", { visible: formatNumber(totals?.activeProducts), hidden: formatNumber(totals?.hiddenProducts) })}
            />
            <StatCard
              icon={Users}
              label={t("dashboard.totalCustomers")}
              loading={firstLoad}
              value={formatNumber(totals?.customers)}
              detail={t("dashboard.customersDetail", { added: formatNumber(period?.newCustomers), count: Number(days) })}
            />
          </div>

          {/* Stock alerts */}
          <div className="grid gap-3 sm:grid-cols-3">
            <StockLink to="/admin/inventory?stock=out" icon={PackageX} tone="bg-rose-50 text-rose-600" label={t("status.stock.out")} detail={t("dashboard.outDetail")} value={totals?.outOfStockProducts} loading={firstLoad} />
            <StockLink to="/admin/inventory?stock=low" icon={AlertTriangle} tone="bg-amber-50 text-amber-600" label={t("status.stock.low")} detail={t("dashboard.lowDetail", { count: 5 })} value={totals?.lowStockProducts} loading={firstLoad} />
            <StockLink to="/admin/inventory?stock=untracked" icon={InfinityIcon} tone="bg-slate-100 text-slate-600" label={t("status.stock.untracked")} detail={t("dashboard.untrackedDetail")} value={totals?.untrackedProducts} loading={firstLoad} />
          </div>

          {/* Sales analytics */}
          <Panel
            title={t("dashboard.revenuePerDay")}
            description={t("dashboard.revenueText", { count: Number(days) })}
            actions={!firstLoad && (
              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-end">
                <div>
                  <dt className="text-[11px] font-semibold text-slate-400">{t("chart.revenue")}</dt>
                  <dd className="text-sm font-extrabold text-secondary">{formatPrice(period?.revenue)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold text-slate-400">{t("chart.orders")}</dt>
                  <dd className="text-sm font-extrabold text-secondary">{formatNumber(period?.orders)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold text-slate-400">{t("dashboard.avgOrder")}</dt>
                  <dd className="text-sm font-extrabold text-secondary">{formatPrice(period?.averageOrderValue)}</dd>
                </div>
              </dl>
            )}
            bodyClassName="p-5"
          >
            {firstLoad ? (
              <div className="h-[268px] animate-pulse rounded-xl bg-slate-50" aria-hidden="true" />
            ) : (
              <SalesChart data={data?.sales || []} refreshing={refreshing} />
            )}
          </Panel>

          <div className="grid gap-6 xl:grid-cols-5">
            {/* Recent orders */}
            <Panel
              className="xl:col-span-3"
              title={t("dashboard.recentOrders")}
              actions={<Link to="/admin/orders" className="link-primary text-sm">{t("orders.all")} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
            >
              {firstLoad ? (
                <div className="space-y-3 p-5" aria-hidden="true">
                  {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-50" />)}
                </div>
              ) : data?.recentOrders?.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.recentOrders.map((order) => (
                    <li key={order._id}>
                      <Link
                        to={`/admin/orders?search=${encodeURIComponent(order.orderNumber)}`}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-slate-50"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-sm font-bold text-secondary">{order.orderNumber}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {order.customer?.username || order.customer?.email || t("dashboard.deletedCustomer")} · {formatDateTime(order.createdAt)} · {t("orders.items", { count: order.itemsCount })}
                          </span>
                        </span>
                        <StatusBadge kind="order" status={order.status} />
                        <span className="w-24 text-end text-sm font-extrabold tabular-nums text-secondary">{formatPrice(order.totalPrice)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Receipt} title={t("orders.none")} message={t("dashboard.noOrdersText")} />
              )}
            </Panel>

            {/* Best sellers */}
            <Panel className="xl:col-span-2" title={t("dashboard.bestSellers")} description={t("dashboard.bestSellersText", { count: Number(days) })}>
              {firstLoad ? (
                <div className="space-y-3 p-5" aria-hidden="true">
                  {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-50" />)}
                </div>
              ) : data?.bestSellers?.length ? (
                <ol className="space-y-4 p-5">
                  {data.bestSellers.map((item, index) => {
                    const top = data.bestSellers[0].units || 1;
                    const title = getText(item.name) || t("product.unnamed");
                    const content = (
                      <>
                        <span className="w-4 text-xs font-extrabold text-slate-400">{index + 1}</span>
                        <ProductImage
                          src={getImageUrl(item.image)}
                          fallbackSrc={isExternalUrl(item.image) ? item.image : ""}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-xl"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-secondary">{title}</span>
                          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-primary-50">
                            <span className="block h-full rounded-full bg-primary-400" style={{ width: `${Math.max(4, (item.units / top) * 100)}%` }} />
                          </span>
                        </span>
                        <span className="text-end">
                          <span className="block text-sm font-extrabold tabular-nums text-secondary">{t("product.soldCount", { count: item.units, formatted: formatNumber(item.units) })}</span>
                          <span className="block text-xs tabular-nums text-slate-500">{formatPrice(item.revenue)}</span>
                        </span>
                      </>
                    );
                    return (
                      <li key={`${item.productId}-${index}`}>
                        {item.productId != null ? (
                          <Link to={`/admin/products/${item.productId}/edit`} className="flex items-center gap-3 rounded-xl transition-colors hover:bg-slate-50">
                            {content}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3" title={t("dashboard.productDeleted")}>{content}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <EmptyState icon={Trophy} title={t("dashboard.noSales")} message={t("dashboard.noSalesText")} />
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
