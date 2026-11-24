import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, TicketPercent, Loader2, Shuffle, Copy } from "lucide-react";
import useApi from "../../src/hooks/useApi";
import useUrlParams from "../../src/hooks/useUrlParams";
import api, { getErrorMessage } from "../../src/services/api";
import { useToast } from "../../src/context/ToastContext";
import { useConfirm } from "../../src/components/admin/ConfirmDialog";
import Modal from "../../src/components/admin/Modal";
import {
  PageHeader, Panel, Toolbar, SearchBox, FilterSelect, StatusBadge, EmptyState, ErrorState, TableSkeleton, ListFooter, Field, Toggle,
} from "../../src/components/admin/AdminUI";
import { formatPrice } from "../../src/utils/product";
import { formatDate, formatNumber, fromDateInput, toDateInput } from "../../src/utils/format";

const PAGE_SIZE = 20;
const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "used-up", label: "Used up" },
  { value: "inactive", label: "Switched off" },
];

const discountLabel = (c) => (c.type === "percent" ? `${c.value}% off` : `${formatPrice(c.value)} off`);

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I look-alikes
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export default function AdminCouponsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { get, update } = useUrlParams({ page: "1" });
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(null);

  const page = Math.max(1, parseInt(get("page"), 10) || 1);
  const filters = { search: get("search"), status: get("status") };
  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (filters.search) query.set("search", filters.search);
  if (filters.status) query.set("status", filters.status);
  const { data, total, loading, error, retry } = useApi(`/api/coupons?${query}`);

  const coupons = Array.isArray(data) ? data : [];
  const filtered = Boolean(filters.search || filters.status);
  const setFilter = (key) => (value) => update({ [key]: value, page: null });

  async function toggleActive(coupon) {
    setBusy(coupon._id);
    try {
      await api.patch(`/api/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      toast.success(coupon.isActive ? `${coupon.code} switched off` : `${coupon.code} switched on`);
      retry();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove(coupon) {
    const ok = await confirm({
      title: `Delete coupon ${coupon.code}?`,
      message: "Customers won't be able to use it any more. Orders that already used it keep their discount.",
      confirmLabel: "Delete coupon",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(coupon._id);
    try {
      await api.delete(`/api/coupons/${coupon._id}`);
      toast.success("Coupon deleted");
      if (coupons.length === 1 && page > 1) update({ page: page - 1 });
      else retry();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error("Couldn't copy the code");
    }
  }

  return (
    <div>
      <PageHeader
        title="Coupons"
        description={total != null ? `${formatNumber(total)} coupon${total === 1 ? "" : "s"}${filtered ? " match your filters" : ""}` : "Discount codes for your customers"}
        actions={<button type="button" onClick={() => setEditing({})} className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> New coupon</button>}
      />

      <Toolbar>
        <SearchBox value={filters.search} onSearch={setFilter("search")} placeholder="Code or description" label="Search coupons" />
        <FilterSelect label="Status" value={filters.status} onChange={setFilter("status")} options={STATUS_OPTIONS} />
      </Toolbar>

      <Panel>
        {loading && !data ? (
          <TableSkeleton rows={6} cols={5} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={retry} />
        ) : coupons.length === 0 ? (
          <EmptyState
            icon={TicketPercent}
            title={filtered ? "No coupons match" : "No coupons yet"}
            message={filtered ? "Try another search or status." : "Create a code like WELCOME10 to reward new customers."}
            action={filtered
              ? <Link to="/admin/coupons" className="btn-outline btn-sm">Clear filters</Link>
              : <button type="button" onClick={() => setEditing({})} className="btn-primary btn-sm"><Plus className="h-4 w-4" aria-hidden="true" /> New coupon</button>}
          />
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[820px] text-sm">
                <caption className="sr-only">Coupons</caption>
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">Code</th>
                    <th scope="col" className="px-4 py-3 font-bold">Discount</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Used</th>
                    <th scope="col" className="px-4 py-3 font-bold">Valid</th>
                    <th scope="col" className="px-4 py-3 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-lg border border-dashed border-primary-300 bg-primary-50 px-2 py-1 font-mono text-xs font-bold tracking-wider text-primary-700">{c.code}</span>
                          <button type="button" onClick={() => copyCode(c.code)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Copy ${c.code}`} title="Copy code">
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        {c.description && <p className="mt-1 max-w-xs truncate text-xs text-slate-400">{c.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-secondary">{discountLabel(c)}</p>
                        <p className="text-xs text-slate-400">
                          {c.minOrderAmount > 0 ? `Orders from ${formatPrice(c.minOrderAmount)}` : "No minimum"}
                          {c.type === "percent" && c.maxDiscount ? ` · max ${formatPrice(c.maxDiscount)}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {formatNumber(c.usedCount)}{c.usageLimit ? ` / ${formatNumber(c.usageLimit)}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {c.startsAt ? `From ${formatDate(c.startsAt)}` : "From now"}<br />
                        {c.expiresAt ? `Until ${formatDate(c.expiresAt)}` : "No end date"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge kind="coupon" status={c.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => toggleActive(c)} disabled={busy === c._id} className="btn-outline btn-sm px-3">
                            {c.isActive ? "Switch off" : "Switch on"}
                          </button>
                          <button type="button" onClick={() => setEditing(c)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-600" aria-label={`Edit ${c.code}`} title="Edit">
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => remove(c)} disabled={busy === c._id} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40" aria-label={`Delete ${c.code}`} title="Delete">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ListFooter page={page} pageSize={PAGE_SIZE} total={total ?? 0} shown={coupons.length} onPage={(p) => update({ page: p }, { push: true })} />
          </>
        )}
      </Panel>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?._id ? `Edit ${editing.code}` : "New coupon"} size="md">
        {editing !== null && (
          <CouponForm
            key={editing._id || "new"}
            coupon={editing}
            onClose={() => setEditing(null)}
            onSaved={(message) => { setEditing(null); toast.success(message); retry(); }}
          />
        )}
      </Modal>
    </div>
  );
}

function CouponForm({ coupon, onClose, onSaved }) {
  const toast = useToast();
  const idBase = useId();
  const isEdit = Boolean(coupon._id);
  const [form, setForm] = useState(() => ({
    code: coupon.code || "",
    description: coupon.description || "",
    type: coupon.type || "percent",
    value: coupon.value != null ? String(coupon.value) : "",
    minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : "",
    maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
    startsAt: toDateInput(coupon.startsAt),
    expiresAt: toDateInput(coupon.expiresAt),
    usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
    isActive: coupon.isActive !== false,
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setText = (key) => (e) => set(key)(e.target.value);

  function validate() {
    const found = {};
    if (!CODE_PATTERN.test(form.code)) found.code = "3–32 characters: letters, numbers, - or _.";
    const value = Number(form.value);
    if (!form.value || !Number.isFinite(value) || value <= 0) found.value = "Enter an amount above 0.";
    else if (form.type === "percent" && value > 100) found.value = "A percentage can be at most 100.";
    if (form.minOrderAmount && !(Number(form.minOrderAmount) >= 0)) found.minOrderAmount = "Enter 0 or more.";
    if (form.maxDiscount && !(Number(form.maxDiscount) > 0)) found.maxDiscount = "Enter an amount above 0.";
    if (form.usageLimit && !(Number.isInteger(Number(form.usageLimit)) && Number(form.usageLimit) >= 1)) found.usageLimit = "Enter a whole number, 1 or more.";
    if (form.startsAt && form.expiresAt && form.expiresAt < form.startsAt) found.expiresAt = "The end date must be on or after the start date.";
    return found;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      code: form.code,
      description: form.description.trim(),
      type: form.type,
      value: Number(form.value),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
      maxDiscount: form.type === "percent" && form.maxDiscount ? Number(form.maxDiscount) : null,
      startsAt: fromDateInput(form.startsAt),
      expiresAt: fromDateInput(form.expiresAt, { endOfDay: true }),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (isEdit) await api.patch(`/api/coupons/${coupon._id}`, payload);
      else await api.post("/api/coupons", payload);
      onSaved(isEdit ? "Coupon saved" : `Coupon ${payload.code} created`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor={`${idBase}-code`} className="mb-1.5 block text-xs font-bold text-slate-600">
          Code<span className="text-rose-500"> *</span>
        </label>
        <div className="flex gap-2">
          <input
            id={`${idBase}-code`}
            value={form.code}
            onChange={(e) => set("code")(e.target.value.toUpperCase().replace(/\s+/g, ""))}
            className="input font-mono font-bold tracking-wider"
            maxLength={32}
            placeholder="WELCOME10"
            aria-invalid={errors.code ? true : undefined}
            aria-describedby={`${idBase}-code-help`}
            data-autofocus
          />
          <button type="button" onClick={() => set("code")(randomCode())} className="btn-outline shrink-0 px-3" title="Generate a random code">
            <Shuffle className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Generate</span>
          </button>
        </div>
        <p id={`${idBase}-code-help`} className={`mt-1.5 text-xs ${errors.code ? "font-semibold text-rose-600" : "text-slate-400"}`}>
          {errors.code || "What customers type at checkout."}
        </p>
      </div>
      <Field label="Description" hint="For your team only.">
        <input value={form.description} onChange={setText("description")} className="input" maxLength={300} placeholder="e.g. 10% off for newsletter sign-ups" />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-xs font-bold text-slate-600">Discount type</legend>
        <div className="grid grid-cols-2 gap-2">
          {[["percent", "Percentage", "e.g. 10% off"], ["fixed", "Fixed amount", "e.g. $5 off"]].map(([value, label, hint]) => (
            <label key={value} className={`cursor-pointer rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-300 ${form.type === value ? "border-primary-400 bg-primary-50" : "border-slate-200 hover:bg-slate-50"}`}>
              <input type="radio" name="coupon-type" value={value} checked={form.type === value} onChange={() => set("type")(value)} className="sr-only" />
              <span className="block text-sm font-bold text-secondary">{label}</span>
              <span className="block text-xs text-slate-500">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={form.type === "percent" ? "Percent off" : "Amount off (USD)"} required error={errors.value}>
          <input type="number" inputMode="decimal" min="0" step={form.type === "percent" ? "1" : "0.01"} value={form.value} onChange={setText("value")} className="input" />
        </Field>
        <Field label="Minimum order (USD)" error={errors.minOrderAmount}>
          <input type="number" inputMode="decimal" min="0" step="0.01" value={form.minOrderAmount} onChange={setText("minOrderAmount")} className="input" placeholder="None" />
        </Field>
        {form.type === "percent" && (
          <Field label="Max discount (USD)" error={errors.maxDiscount}>
            <input type="number" inputMode="decimal" min="0" step="0.01" value={form.maxDiscount} onChange={setText("maxDiscount")} className="input" placeholder="No limit" />
          </Field>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Starts" error={errors.startsAt}>
          <input type="date" value={form.startsAt} onChange={setText("startsAt")} className="input" />
        </Field>
        <Field label="Ends (inclusive)" error={errors.expiresAt}>
          <input type="date" value={form.expiresAt} min={form.startsAt || undefined} onChange={setText("expiresAt")} className="input" />
        </Field>
        <Field label="Total uses" hint={isEdit ? `Used ${coupon.usedCount || 0} times so far.` : "Empty = unlimited."} error={errors.usageLimit}>
          <input type="number" inputMode="numeric" min="1" step="1" value={form.usageLimit} onChange={setText("usageLimit")} className="input" placeholder="Unlimited" />
        </Field>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <Toggle checked={form.isActive} onChange={set("isActive")} label="Coupon is on" description="Switched-off coupons are refused at checkout." />
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onClose} className="btn-outline" disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isEdit ? "Save coupon" : "Create coupon"}
        </button>
      </div>
    </form>
  );
}
