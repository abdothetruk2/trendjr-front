import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Eye, ShieldCheck, ShieldOff, Ban, CircleCheck, Loader2, MapPin, Mail, Trash2, Copy } from "lucide-react";
import useApi from "../../src/hooks/useApi";
import useUrlParams from "../../src/hooks/useUrlParams";
import api, { getErrorMessage } from "../../src/services/api";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { useConfirm } from "../../src/components/admin/ConfirmDialog";
import Modal from "../../src/components/admin/Modal";
import {
  PageHeader, Panel, Toolbar, SearchBox, FilterSelect, StatusBadge, EmptyState, ErrorState, TableSkeleton, ListFooter,
} from "../../src/components/admin/AdminUI";
import { formatPrice } from "../../src/utils/product";
import { formatDate, formatDateTime, formatNumber } from "../../src/utils/format";
import useLanguage from "../../src/i18n/useLanguage";
import i18n from "../../src/i18n";

const PAGE_SIZE = 20;
const displayName = (c) => c.username || c.email || i18n.t("customers.unnamed", { ns: "admin" });

export default function AdminCustomersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { get, update } = useUrlParams({ page: "1", sort: "newest" });
  const { t } = useLanguage("admin");
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(null);

  const page = Math.max(1, parseInt(get("page"), 10) || 1);
  const filters = { search: get("search"), role: get("role"), status: get("status"), sort: get("sort") };
  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
  const { data, total, loading, error, retry } = useApi(`/api/admin/customers?${query}`);

  const customers = Array.isArray(data) ? data : [];
  const filtered = Boolean(filters.search || filters.role || filters.status);
  const setFilter = (key) => (value) => update({ [key]: value, page: null });
  const isSelf = (c) => String(c._id) === String(user?.id);

  async function change(customer, changes, { title, message, confirmLabel, tone, done }) {
    if (!(await confirm({ title, message, confirmLabel, tone }))) return;
    setBusy(customer._id);
    try {
      await api.patch(`/api/admin/customers/${customer._id}`, changes);
      toast.success(done);
      retry();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const toggleBlock = (c) => change(c, { isBlocked: !c.isBlocked }, c.isBlocked
    ? { title: t("customers.unblockTitle"), message: t("customers.unblockText", { name: displayName(c) }), confirmLabel: t("customers.unblock"), done: t("customers.unblocked") }
    : { title: t("customers.blockTitle"), message: t("customers.blockText", { name: displayName(c) }), confirmLabel: t("customers.blockAccount"), tone: "danger", done: t("customers.blocked") });

  const toggleAdmin = (c) => change(c, { role: c.role === "admin" ? "user" : "admin" }, c.role === "admin"
    ? { title: t("customers.removeAdminTitle"), message: t("customers.removeAdminText", { name: displayName(c) }), confirmLabel: t("customers.removeAccess"), tone: "danger", done: t("customers.adminRemoved") }
    : { title: t("customers.makeAdminTitle"), message: t("customers.makeAdminText", { name: displayName(c) }), confirmLabel: t("customers.makeAdmin"), done: t("customers.adminGranted") });

  return (
    <div>
      <PageHeader
        title={t("layout.nav.customers")}
        description={total != null ? t(filtered ? "customers.countFiltered" : "customers.count", { count: total, formatted: formatNumber(total) }) : t("customers.intro")}
      />

      <Toolbar>
        <SearchBox value={filters.search} onSearch={setFilter("search")} placeholder={t("customers.searchPlaceholder")} label={t("customers.search")} />
        <FilterSelect label={t("settings.role")} value={filters.role} onChange={setFilter("role")} options={[{ value: "user", label: t("layout.nav.customers") }, { value: "admin", label: t("customers.admins") }]} />
        <FilterSelect label={t("ui.status")} value={filters.status} onChange={setFilter("status")} options={[{ value: "active", label: t("status.customer.active") }, { value: "blocked", label: t("status.customer.blocked") }]} />
        <FilterSelect label={t("products.sort")} value={filters.sort} onChange={(v) => update({ sort: v, page: null })} allLabel={null}
          options={[{ value: "newest", label: t("products.sorts.id-desc") }, { value: "oldest", label: t("products.sorts.id-asc") }, { value: "name-asc", label: t("customers.usernameAz") }]} />
      </Toolbar>

      <Panel>
        {loading && !data ? (
          <TableSkeleton rows={8} cols={6} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={retry} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtered ? t("customers.noMatch") : t("customers.none")}
            message={filtered ? t("ui.tryAnother") : t("customers.noneText")}
            action={filtered && <Link to="/admin/customers" className="btn-outline btn-sm">{t("ui.clearFilters")}</Link>}
          />
        ) : (
          <>
            <div className={`relative overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[880px] text-sm">
                <caption className="sr-only">{t("layout.nav.customers")}</caption>
                <thead className="bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">{t("adminOrders.customer")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("settings.role")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("ui.status")}</th>
                    <th scope="col" className="px-4 py-3 text-end font-bold">{t("chart.orders")}</th>
                    <th scope="col" className="px-4 py-3 text-end font-bold">{t("customers.spent")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("customers.joined")}</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">{t("ui.actions")}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const self = isSelf(c);
                    return (
                      <tr key={c._id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold uppercase ${c.role === "admin" ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                              {displayName(c).charAt(0)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-secondary">
                                {c.username || <span className="italic text-slate-400">{t("customers.noUsername")}</span>}
                                {self && <span className="ms-2 rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-700">{t("customers.you")}</span>}
                              </p>
                              <p className="truncate text-xs text-slate-400">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge kind="role" status={c.role} /></td>
                        <td className="px-4 py-3"><StatusBadge kind="customer" status={c.isBlocked ? "blocked" : "active"} /></td>
                        <td className="px-4 py-3 text-end tabular-nums text-slate-700">{formatNumber(c.ordersCount)}</td>
                        <td className="px-4 py-3 text-end font-bold tabular-nums text-secondary">{formatPrice(c.totalSpent)}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => setViewing(c)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label={t("customers.viewNamed", { name: displayName(c) })} title={t("adminOrders.view")}>
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleAdmin(c)}
                              disabled={self || busy === c._id}
                              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-600 disabled:pointer-events-none disabled:opacity-30"
                              aria-label={c.role === "admin" ? t("customers.removeAdminNamed", { name: displayName(c) }) : t("customers.makeAdminNamed", { name: displayName(c) })}
                              title={self ? t("customers.ownRole") : c.role === "admin" ? t("customers.removeAdminTitleShort") : t("customers.makeAdmin")}
                            >
                              {c.role === "admin" ? <ShieldOff className="h-4 w-4" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleBlock(c)}
                              disabled={self || busy === c._id}
                              className={`btn-sm inline-flex items-center gap-1.5 rounded-xl px-3 font-bold transition-colors disabled:pointer-events-none disabled:opacity-30 ${
                                c.isBlocked ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                              }`}
                              title={self ? t("customers.ownBlock") : undefined}
                            >
                              {busy === c._id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                : c.isBlocked ? <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <Ban className="h-3.5 w-3.5" aria-hidden="true" />}
                              {c.isBlocked ? t("customers.unblock") : t("customers.block")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ListFooter page={page} pageSize={PAGE_SIZE} total={total ?? 0} shown={customers.length} onPage={(p) => update({ page: p }, { push: true })} />
          </>
        )}
      </Panel>

      <SubscribersPanel />

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing ? displayName(viewing) : ""} description={viewing?.email} size="md">
        {viewing && <CustomerDetail id={viewing._id} />}
      </Modal>
    </div>
  );
}

const SUB_PAGE_SIZE = 10;

// People who signed up with the footer newsletter form (they may not have an account)
function SubscribersPanel() {
  const toast = useToast();
  const { t } = useLanguage("admin");
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const [copying, setCopying] = useState(false);

  const query = new URLSearchParams({ page: String(page), limit: String(SUB_PAGE_SIZE) });
  if (search) query.set("search", search);
  const { data, total, loading, error, retry } = useApi(`/api/admin/subscribers?${query}`);
  const subscribers = Array.isArray(data) ? data : [];

  async function remove(sub) {
    const ok = await confirm({
      title: t("subscribers.removeTitle"),
      message: t("subscribers.removeText", { email: sub.email }),
      confirmLabel: t("cartPage.remove"),
      tone: "danger",
    });
    if (!ok) return;
    setBusy(sub._id);
    try {
      await api.delete(`/api/admin/subscribers/${sub._id}`);
      toast.success(t("subscribers.removed"));
      if (subscribers.length === 1 && page > 1) setPage(page - 1);
      else retry();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  // Copies every address (all pages), ready to paste into an email tool
  async function copyAll() {
    setCopying(true);
    try {
      const emails = [];
      for (let p = 1; p <= 50; p++) {
        const res = await api.get("/api/admin/subscribers", { params: { page: p, limit: 200 } });
        emails.push(...res.data.map((s) => s.email));
        if (res.data.length < 200) break;
      }
      await navigator.clipboard.writeText(emails.join(", "));
      toast.success(t("subscribers.copied", { count: emails.length, formatted: formatNumber(emails.length) }));
    } catch (err) {
      toast.error(err?.name === "NotAllowedError" ? t("subscribers.copyBlocked") : getErrorMessage(err));
    } finally {
      setCopying(false);
    }
  }

  return (
    <Panel
      className="mt-6"
      title={t("subscribers.title")}
      description={total != null ? t("subscribers.count", { count: total, formatted: formatNumber(total) }) : t("subscribers.intro")}
      actions={(
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SearchBox value={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder={t("subscribers.searchPlaceholder")} label={t("subscribers.search")} />
          <button type="button" onClick={copyAll} disabled={copying || !total} className="btn-outline btn-sm">
            {copying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {t("subscribers.copyAll")}
          </button>
        </div>
      )}
    >
      {loading && !data ? (
        <TableSkeleton rows={4} cols={3} />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={retry} />
      ) : subscribers.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={search ? t("subscribers.noMatch") : t("subscribers.none")}
          message={search ? t("subscribers.tryAnother") : t("subscribers.noneText")}
        />
      ) : (
        <>
          <ul className={`divide-y divide-slate-100 transition-opacity ${loading ? "opacity-60" : ""}`}>
            {subscribers.map((sub) => (
              <li key={sub._id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-600">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <a href={`mailto:${sub.email}`} className="block truncate text-sm font-bold text-secondary hover:text-primary-600">{sub.email}</a>
                  <span className="block text-xs text-slate-500">{t("subscribers.signedUp", { date: formatDate(sub.createdAt) })}</span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(sub)}
                  disabled={busy === sub._id}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                  aria-label={t("cartPage.removeNamed", { name: sub.email })}
                  title={t("cartPage.remove")}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <ListFooter page={page} pageSize={SUB_PAGE_SIZE} total={total ?? 0} shown={subscribers.length} onPage={setPage} />
        </>
      )}
    </Panel>
  );
}

function CustomerDetail({ id }) {
  const { data, loading, error, retry } = useApi(`/api/admin/customers/${id}`);
  const { t } = useLanguage("admin");

  if (loading && !data) {
    return <div className="grid h-40 place-items-center" role="status"><Loader2 className="h-6 w-6 animate-spin text-primary-500" aria-hidden="true" /><span className="sr-only">{t("common.loading")}</span></div>;
  }
  if (error) return <ErrorState message={error} onRetry={retry} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <StatusBadge kind="role" status={data.role} />
        <StatusBadge kind="customer" status={data.isBlocked ? "blocked" : "active"} />
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t("chart.orders"), formatNumber(data.ordersCount)],
          [t("customers.totalSpent"), formatPrice(data.totalSpent)],
          [t("customers.lastOrder"), data.lastOrderAt ? formatDate(data.lastOrderAt) : "—"],
          [t("customers.joined"), formatDate(data.createdAt)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-3">
            <dt className="text-[11px] font-semibold text-slate-400">{label}</dt>
            <dd className="mt-0.5 text-sm font-extrabold text-secondary">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="text-sm">
        <p className="text-xs font-bold text-slate-500">{t("account.phone")}</p>
        <p className="text-slate-700" dir="ltr">{data.phone || "—"}</p>
      </div>
      {data.addresses?.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-bold text-slate-500">{t("customers.savedAddresses")}</p>
          <ul className="space-y-1.5">
            {data.addresses.map((a, i) => (
              <li key={a._id || i} className="flex items-start gap-2 text-sm text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                {[a.street, a.city, a.postalCode, a.country].filter(Boolean).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="mb-2 text-xs font-bold text-slate-500">{t("dashboard.recentOrders")}</p>
        {data.recentOrders?.length ? (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {data.recentOrders.map((o) => (
              <li key={o._id}>
                <Link to={`/admin/orders?search=${encodeURIComponent(o.orderNumber)}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-sm font-bold text-secondary">{o.orderNumber}</span>
                    <span className="block text-xs text-slate-400">{formatDateTime(o.createdAt)} · {t("orders.items", { count: o.itemsCount })}</span>
                  </span>
                  <StatusBadge kind="order" status={o.status} />
                  <span className="w-20 text-end text-sm font-extrabold tabular-nums text-secondary">{formatPrice(o.totalPrice)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{t("orders.none")}</p>
        )}
      </div>
    </div>
  );
}
