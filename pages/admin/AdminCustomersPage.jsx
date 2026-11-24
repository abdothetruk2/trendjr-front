import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Eye, ShieldCheck, ShieldOff, Ban, CircleCheck, Loader2, MapPin } from "lucide-react";
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

const PAGE_SIZE = 20;
const displayName = (c) => c.username || c.email || "Unnamed account";

export default function AdminCustomersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { get, update } = useUrlParams({ page: "1", sort: "newest" });
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
    ? { title: "Unblock this account?", message: <><strong className="text-secondary">{displayName(c)}</strong> will be able to sign in and order again.</>, confirmLabel: "Unblock", done: "Account unblocked" }
    : { title: "Block this account?", message: <><strong className="text-secondary">{displayName(c)}</strong> will be signed out everywhere and can't sign in or order until unblocked. Their orders stay as they are.</>, confirmLabel: "Block account", tone: "danger", done: "Account blocked" });

  const toggleAdmin = (c) => change(c, { role: c.role === "admin" ? "user" : "admin" }, c.role === "admin"
    ? { title: "Remove admin access?", message: <><strong className="text-secondary">{displayName(c)}</strong> will no longer be able to open this dashboard.</>, confirmLabel: "Remove access", tone: "danger", done: "Admin access removed" }
    : { title: "Make this customer an admin?", message: <><strong className="text-secondary">{displayName(c)}</strong> will get full access to this dashboard: products, orders, customers and coupons.</>, confirmLabel: "Make admin", done: "Admin access granted" });

  return (
    <div>
      <PageHeader
        title="Customers"
        description={total != null ? `${formatNumber(total)} account${total === 1 ? "" : "s"}${filtered ? " match your filters" : ""}` : "Everyone with an account"}
      />

      <Toolbar>
        <SearchBox value={filters.search} onSearch={setFilter("search")} placeholder="Username, email or phone" label="Search customers" />
        <FilterSelect label="Role" value={filters.role} onChange={setFilter("role")} options={[{ value: "user", label: "Customers" }, { value: "admin", label: "Admins" }]} />
        <FilterSelect label="Status" value={filters.status} onChange={setFilter("status")} options={[{ value: "active", label: "Active" }, { value: "blocked", label: "Blocked" }]} />
        <FilterSelect label="Sort" value={filters.sort} onChange={(v) => update({ sort: v, page: null })} allLabel={null}
          options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "name-asc", label: "Username A–Z" }]} />
      </Toolbar>

      <Panel>
        {loading && !data ? (
          <TableSkeleton rows={8} cols={6} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={retry} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtered ? "No customers match" : "No customers yet"}
            message={filtered ? "Try another search or clear a filter." : "Accounts appear here when people register."}
            action={filtered && <Link to="/admin/customers" className="btn-outline btn-sm">Clear filters</Link>}
          />
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[880px] text-sm">
                <caption className="sr-only">Customers</caption>
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">Customer</th>
                    <th scope="col" className="px-4 py-3 font-bold">Role</th>
                    <th scope="col" className="px-4 py-3 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Orders</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Spent</th>
                    <th scope="col" className="px-4 py-3 font-bold">Joined</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
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
                                {c.username || <span className="italic text-slate-400">No username</span>}
                                {self && <span className="ml-2 rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-700">You</span>}
                              </p>
                              <p className="truncate text-xs text-slate-400">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge kind="role" status={c.role} /></td>
                        <td className="px-4 py-3"><StatusBadge kind="customer" status={c.isBlocked ? "blocked" : "active"} /></td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(c.ordersCount)}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-secondary">{formatPrice(c.totalSpent)}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => setViewing(c)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label={`View ${displayName(c)}`} title="View">
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleAdmin(c)}
                              disabled={self || busy === c._id}
                              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-600 disabled:pointer-events-none disabled:opacity-30"
                              aria-label={c.role === "admin" ? `Remove admin access from ${displayName(c)}` : `Make ${displayName(c)} an admin`}
                              title={self ? "You can't change your own role" : c.role === "admin" ? "Remove admin access" : "Make admin"}
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
                              title={self ? "You can't block your own account" : undefined}
                            >
                              {busy === c._id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                : c.isBlocked ? <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <Ban className="h-3.5 w-3.5" aria-hidden="true" />}
                              {c.isBlocked ? "Unblock" : "Block"}
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

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing ? displayName(viewing) : ""} description={viewing?.email} size="md">
        {viewing && <CustomerDetail id={viewing._id} />}
      </Modal>
    </div>
  );
}

function CustomerDetail({ id }) {
  const { data, loading, error, retry } = useApi(`/api/admin/customers/${id}`);

  if (loading && !data) {
    return <div className="grid h-40 place-items-center" role="status"><Loader2 className="h-6 w-6 animate-spin text-primary-500" aria-hidden="true" /><span className="sr-only">Loading…</span></div>;
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
          ["Orders", formatNumber(data.ordersCount)],
          ["Total spent", formatPrice(data.totalSpent)],
          ["Last order", data.lastOrderAt ? formatDate(data.lastOrderAt) : "—"],
          ["Joined", formatDate(data.createdAt)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-3">
            <dt className="text-[11px] font-semibold text-slate-400">{label}</dt>
            <dd className="mt-0.5 text-sm font-extrabold text-secondary">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="text-sm">
        <p className="text-xs font-bold text-slate-500">Phone</p>
        <p className="text-slate-700">{data.phone || "—"}</p>
      </div>
      {data.addresses?.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-bold text-slate-500">Saved addresses</p>
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
        <p className="mb-2 text-xs font-bold text-slate-500">Recent orders</p>
        {data.recentOrders?.length ? (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {data.recentOrders.map((o) => (
              <li key={o._id}>
                <Link to={`/admin/orders?search=${encodeURIComponent(o.orderNumber)}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-sm font-bold text-secondary">{o.orderNumber}</span>
                    <span className="block text-xs text-slate-400">{formatDateTime(o.createdAt)} · {o.itemsCount} item{o.itemsCount === 1 ? "" : "s"}</span>
                  </span>
                  <StatusBadge kind="order" status={o.status} />
                  <span className="w-20 text-right text-sm font-extrabold tabular-nums text-secondary">{formatPrice(o.totalPrice)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
