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
import { CURRENCY_SYMBOL } from "../../src/config/site";
import { formatDate, formatNumber, fromDateInput, toDateInput } from "../../src/utils/format";
import useLanguage from "../../src/i18n/useLanguage";
import i18n from "../../src/i18n";

const tr = (key, options) => i18n.t(key, { ns: "admin", ...options });

const PAGE_SIZE = 20;
const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

const statusOptions = () => ["active", "scheduled", "expired", "used-up", "inactive"]
  .map((value) => ({ value, label: tr(value === "inactive" ? "coupons.switchedOff" : `status.coupon.${value}`) }));

const discountLabel = (c) => (c.type === "percent" ? tr("coupons.percentOff", { value: c.value }) : tr("coupons.amountOff", { amount: formatPrice(c.value) }));

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I look-alikes
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export default function AdminCouponsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { get, update } = useUrlParams({ page: "1" });
  const { t } = useLanguage("admin");
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
      toast.success(coupon.isActive ? t("coupons.turnedOff", { code: coupon.code }) : t("coupons.turnedOn", { code: coupon.code }));
      retry();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove(coupon) {
    const ok = await confirm({
      title: t("coupons.deleteTitle", { code: coupon.code }),
      message: t("coupons.deleteText"),
      confirmLabel: t("coupons.delete"),
      tone: "danger",
    });
    if (!ok) return;
    setBusy(coupon._id);
    try {
      await api.delete(`/api/coupons/${coupon._id}`);
      toast.success(t("coupons.deleted"));
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
      toast.success(t("coupons.copied", { code }));
    } catch {
      toast.error(t("coupons.copyFailed"));
    }
  }

  return (
    <div>
      <PageHeader
        title={t("layout.nav.coupons")}
        description={total != null ? t(filtered ? "coupons.countFiltered" : "coupons.count", { count: total, formatted: formatNumber(total) }) : t("coupons.intro")}
        actions={<button type="button" onClick={() => setEditing({})} className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> {t("coupons.new")}</button>}
      />

      <Toolbar>
        <SearchBox value={filters.search} onSearch={setFilter("search")} placeholder={t("coupons.searchPlaceholder")} label={t("coupons.search")} />
        <FilterSelect label={t("ui.status")} value={filters.status} onChange={setFilter("status")} options={statusOptions()} />
      </Toolbar>

      <Panel>
        {loading && !data ? (
          <TableSkeleton rows={6} cols={5} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={retry} />
        ) : coupons.length === 0 ? (
          <EmptyState
            icon={TicketPercent}
            title={filtered ? t("coupons.noMatch") : t("coupons.none")}
            message={filtered ? t("coupons.tryAnother") : t("coupons.noneText")}
            action={filtered
              ? <Link to="/admin/coupons" className="btn-outline btn-sm">{t("ui.clearFilters")}</Link>
              : <button type="button" onClick={() => setEditing({})} className="btn-primary btn-sm"><Plus className="h-4 w-4" aria-hidden="true" /> {t("coupons.new")}</button>}
          />
        ) : (
          <>
            <div className={`relative overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[820px] text-sm">
                <caption className="sr-only">{t("layout.nav.coupons")}</caption>
                <thead className="bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">{t("coupons.code")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("checkout.discount")}</th>
                    <th scope="col" className="px-4 py-3 text-end font-bold">{t("coupons.used")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("coupons.valid")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("ui.status")}</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">{t("ui.actions")}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-lg border border-dashed border-primary-300 bg-primary-50 px-2 py-1 font-mono text-xs font-bold tracking-wider text-primary-700">{c.code}</span>
                          <button type="button" onClick={() => copyCode(c.code)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={t("coupons.copyNamed", { code: c.code })} title={t("coupons.copyCode")}>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        {c.description && <p className="mt-1 max-w-xs truncate text-xs text-slate-400">{c.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-secondary">{discountLabel(c)}</p>
                        <p className="text-xs text-slate-400">
                          {c.minOrderAmount > 0 ? t("coupons.ordersFrom", { amount: formatPrice(c.minOrderAmount) }) : t("coupons.noMinimum")}
                          {c.type === "percent" && c.maxDiscount ? ` · ${t("coupons.max", { amount: formatPrice(c.maxDiscount) })}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-end tabular-nums text-slate-700">
                        {formatNumber(c.usedCount)}{c.usageLimit ? ` / ${formatNumber(c.usageLimit)}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {c.startsAt ? t("coupons.fromDate", { date: formatDate(c.startsAt) }) : t("coupons.fromNow")}<br />
                        {c.expiresAt ? t("coupons.untilDate", { date: formatDate(c.expiresAt) }) : t("coupons.noEnd")}
                      </td>
                      <td className="px-4 py-3"><StatusBadge kind="coupon" status={c.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => toggleActive(c)} disabled={busy === c._id} className="btn-outline btn-sm px-3">
                            {c.isActive ? t("coupons.switchOff") : t("coupons.switchOn")}
                          </button>
                          <button type="button" onClick={() => setEditing(c)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-600" aria-label={t("ui.editNamed", { name: c.code })} title={t("ui.edit")}>
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => remove(c)} disabled={busy === c._id} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40" aria-label={t("ui.deleteNamed", { name: c.code })} title={t("ui.delete")}>
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

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?._id ? t("ui.editNamed", { name: editing.code }) : t("coupons.new")} size="md">
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
  const { t } = useLanguage("admin");
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
    if (!CODE_PATTERN.test(form.code)) found.code = t("coupons.errors.code");
    const value = Number(form.value);
    if (!form.value || !Number.isFinite(value) || value <= 0) found.value = t("coupons.errors.above0");
    else if (form.type === "percent" && value > 100) found.value = t("coupons.errors.max100");
    if (form.minOrderAmount && !(Number(form.minOrderAmount) >= 0)) found.minOrderAmount = t("coupons.errors.min0");
    if (form.maxDiscount && !(Number(form.maxDiscount) > 0)) found.maxDiscount = t("coupons.errors.above0");
    if (form.usageLimit && !(Number.isInteger(Number(form.usageLimit)) && Number(form.usageLimit) >= 1)) found.usageLimit = t("coupons.errors.usage");
    if (form.startsAt && form.expiresAt && form.expiresAt < form.startsAt) found.expiresAt = t("coupons.errors.dates");
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
      onSaved(isEdit ? t("coupons.saved") : t("coupons.created", { code: payload.code }));
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor={`${idBase}-code`} className="mb-1.5 block text-xs font-bold text-slate-600">
          {t("coupons.code")}<span className="text-rose-500"> *</span>
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
          <button type="button" onClick={() => set("code")(randomCode())} className="btn-outline shrink-0 px-3" title={t("coupons.generateHint")}>
            <Shuffle className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">{t("coupons.generate")}</span>
          </button>
        </div>
        <p id={`${idBase}-code-help`} className={`mt-1.5 text-xs ${errors.code ? "font-semibold text-rose-600" : "text-slate-400"}`}>
          {errors.code || t("coupons.codeHint")}
        </p>
      </div>
      <Field label={t("productForm.description")} hint={t("coupons.descriptionHint")}>
        <input value={form.description} onChange={setText("description")} className="input" maxLength={300} placeholder={t("coupons.descriptionPlaceholder")} />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-xs font-bold text-slate-600">{t("coupons.type")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {[["percent", t("coupons.percentage"), t("coupons.percentageHint")], ["fixed", t("coupons.fixed"), t("coupons.fixedHint", { amount: formatPrice(5) })]].map(([value, label, hint]) => (
            <label key={value} className={`cursor-pointer rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-300 ${form.type === value ? "border-primary-400 bg-primary-50" : "border-slate-200 hover:bg-slate-50"}`}>
              <input type="radio" name="coupon-type" value={value} checked={form.type === value} onChange={() => set("type")(value)} className="sr-only" />
              <span className="block text-sm font-bold text-secondary">{label}</span>
              <span className="block text-xs text-slate-500">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={form.type === "percent" ? t("coupons.percentLabel") : t("coupons.amountLabel", { symbol: CURRENCY_SYMBOL })} required error={errors.value}>
          <input type="number" inputMode="decimal" min="0" step={form.type === "percent" ? "1" : "0.01"} value={form.value} onChange={setText("value")} className="input" />
        </Field>
        <Field label={t("coupons.minOrder", { symbol: CURRENCY_SYMBOL })} error={errors.minOrderAmount}>
          <input type="number" inputMode="decimal" min="0" step="0.01" value={form.minOrderAmount} onChange={setText("minOrderAmount")} className="input" placeholder={t("coupons.none_")} />
        </Field>
        {form.type === "percent" && (
          <Field label={t("coupons.maxDiscount", { symbol: CURRENCY_SYMBOL })} error={errors.maxDiscount}>
            <input type="number" inputMode="decimal" min="0" step="0.01" value={form.maxDiscount} onChange={setText("maxDiscount")} className="input" placeholder={t("coupons.noLimit")} />
          </Field>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("coupons.starts")} error={errors.startsAt}>
          <input type="date" value={form.startsAt} onChange={setText("startsAt")} className="input" />
        </Field>
        <Field label={t("coupons.ends")} error={errors.expiresAt}>
          <input type="date" value={form.expiresAt} min={form.startsAt || undefined} onChange={setText("expiresAt")} className="input" />
        </Field>
        <Field label={t("coupons.totalUses")} hint={isEdit ? t("coupons.usedSoFar", { count: coupon.usedCount || 0 }) : t("coupons.emptyUnlimited")} error={errors.usageLimit}>
          <input type="number" inputMode="numeric" min="1" step="1" value={form.usageLimit} onChange={setText("usageLimit")} className="input" placeholder={t("coupons.unlimited")} />
        </Field>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <Toggle checked={form.isActive} onChange={set("isActive")} label={t("coupons.isOn")} description={t("coupons.isOnText")} />
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onClose} className="btn-outline" disabled={saving}>{t("common.cancel")}</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isEdit ? t("coupons.save") : t("coupons.create")}
        </button>
      </div>
    </form>
  );
}
