import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Boxes, PackageX, AlertTriangle, CheckCircle2, Infinity as InfinityIcon, Loader2, Info } from "lucide-react";
import useApi from "../../src/hooks/useApi";
import useUrlParams from "../../src/hooks/useUrlParams";
import api, { getErrorMessage } from "../../src/services/api";
import { useToast } from "../../src/context/ToastContext";
import ProductImage from "../../src/components/ProductImage";
import {
  PageHeader, Panel, Toolbar, SearchBox, FilterSelect, StatusBadge, EmptyState, ErrorState, TableSkeleton, ListFooter,
} from "../../src/components/admin/AdminUI";
import { getCategoryLabel, getProductView, isStockTracked, toNumber, LOW_STOCK } from "../../src/utils/product";
import { categoryOptions } from "../../src/utils/categories";
import { formatNumber } from "../../src/utils/format";

const PAGE_SIZE = 20;
const MAX_STOCK = 1000000;

const STOCK_OPTIONS = [
  { value: "out", label: "Out of stock" },
  { value: "low", label: `Low (1–${LOW_STOCK})` },
  { value: "in", label: "In stock" },
  { value: "tracked", label: "Tracked" },
  { value: "untracked", label: "Not tracked" },
];

const SORT_OPTIONS = [
  { value: "id-desc", label: "Newest first" },
  { value: "stock-asc", label: "Stock: low to high" },
  { value: "stock-desc", label: "Stock: high to low" },
  { value: "sold-desc", label: "Best-selling" },
  { value: "name-asc", label: "Name A–Z" },
];

// Same rules as the server (utils/inventory.js)
function stockState(product) {
  if (!isStockTracked(product)) return "untracked";
  const stock = toNumber(product.stock);
  if (stock <= 0) return "out";
  return stock <= LOW_STOCK ? "low" : "in";
}

const TILES = [
  { key: "out", label: "Out of stock", icon: PackageX, tone: "text-rose-600 bg-rose-50", value: (s) => s.outOfStock, detail: () => "Tracked products with none left" },
  { key: "low", label: "Low stock", icon: AlertTriangle, tone: "text-amber-600 bg-amber-50", value: (s) => s.lowStock, detail: () => `${LOW_STOCK} or fewer left` },
  { key: "in", label: "In stock", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50", value: (s) => s.inStock, detail: (s) => `${formatNumber(s.unitsInStock)} units on hand` },
  { key: "untracked", label: "Not tracked", icon: InfinityIcon, tone: "text-slate-600 bg-slate-100", value: (s) => s.untracked, detail: () => "Always for sale, no limit" },
];

function SummaryTiles({ summary, active, onPick }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {TILES.map(({ key, label, icon: Icon, tone, value, detail }) => {
        const pressed = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onPick(pressed ? null : key)}
            aria-pressed={pressed}
            className={`card flex items-start gap-3 p-4 text-left transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${pressed ? "ring-2 ring-primary-500" : ""}`}
          >
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-slate-500">{label}</span>
              {summary.data ? (
                <>
                  <span className="mt-0.5 block text-2xl font-black tracking-tight text-secondary tabular-nums">{formatNumber(value(summary.data))}</span>
                  <span className="block truncate text-xs text-slate-500">{detail(summary.data)}</span>
                </>
              ) : (
                <span className="mt-1.5 block h-7 w-14 animate-pulse rounded bg-slate-100" aria-hidden="true" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// One product: tracking switch and stock count, saved straight away
function InventoryRow({ product, categoryLabel, from, onSaved }) {
  const toast = useToast();
  const view = getProductView(product);
  const tracked = isStockTracked(product);
  const state = stockState(product);
  const current = String(Math.max(0, toNumber(product.stock)));
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);
  const number = Number(value);
  const valid = value !== "" && Number.isInteger(number) && number >= 0 && number <= MAX_STOCK;
  const dirty = value !== current;

  async function save(changes, message) {
    setSaving(true);
    try {
      await api.patch(`/api/products/${product.id}`, changes);
      toast.success(message);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function saveStock() {
    if (!dirty || saving) return;
    if (!valid) {
      toast.error(`Enter a whole number from 0 to ${formatNumber(MAX_STOCK)}.`);
      return;
    }
    save({ stock: number }, number === 0 ? `${view.title} is now out of stock` : `Stock set to ${formatNumber(number)}`);
  }

  function toggleTracking() {
    if (tracked) {
      save({ track_inventory: false }, "Stock no longer tracked: the product stays for sale without a limit");
    } else {
      save({ track_inventory: true }, toNumber(product.stock) > 0
        ? "Stock tracking on: orders now reduce the stock"
        : "Stock tracking on: it shows as sold out until you add stock");
    }
  }

  const inputId = `stock-${product.id}`;
  return (
    <tr className="align-middle hover:bg-slate-50/60">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <ProductImage src={view.image} fallbackSrc={view.imageFallback} alt="" className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <Link to={`/admin/products/${product.id}/edit`} state={{ back: `/admin/inventory${from}` }} className="line-clamp-1 font-bold text-secondary hover:text-primary-600">
              {view.title}
            </Link>
            <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-400">
              <span>#{product.id}</span>
              {product.sku && <span>SKU {product.sku}</span>}
              {product.is_active === false && <span className="font-semibold text-slate-500">Hidden</span>}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-600">{categoryLabel || <span className="text-slate-400">—</span>}</td>
      <td className="px-4 py-3"><StatusBadge kind="stock" status={state} /></td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(toNumber(product.sold_count))}</td>
      <td className="px-4 py-3">
        <label className={`inline-flex items-center gap-2 ${saving ? "opacity-60" : "cursor-pointer"}`}>
          <span className="relative inline-flex shrink-0">
            <input
              type="checkbox"
              role="switch"
              checked={tracked}
              disabled={saving}
              onChange={toggleTracking}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-primary-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-500" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </span>
          <span className="text-xs font-semibold text-slate-600">
            {tracked ? "Tracked" : "Off"}
            <span className="sr-only"> stock tracking for {view.title}</span>
          </span>
        </label>
      </td>
      <td className="px-4 py-3">
        <form
          className="flex items-center justify-end gap-2"
          onSubmit={(e) => { e.preventDefault(); saveStock(); }}
        >
          <label htmlFor={inputId} className="sr-only">Units in stock for {view.title}</label>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min="0"
            max={MAX_STOCK}
            step="1"
            value={tracked ? value : ""}
            placeholder={tracked ? "" : "—"}
            disabled={!tracked || saving}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setValue(current); }}
            aria-invalid={tracked && dirty && !valid ? true : undefined}
            className={`input h-9 w-24 px-3 py-1.5 text-right tabular-nums disabled:bg-slate-50 ${tracked && dirty && !valid ? "border-rose-400" : ""}`}
          />
          <button
            type="submit"
            disabled={!tracked || !dirty || saving}
            className={`btn-primary btn-sm w-16 justify-center ${tracked && dirty ? "" : "invisible"}`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Save"}
          </button>
        </form>
      </td>
    </tr>
  );
}

export default function AdminInventoryPage() {
  const location = useLocation();
  const { get, update } = useUrlParams({ page: "1", sort: "id-desc" });
  const page = Math.max(1, parseInt(get("page"), 10) || 1);
  const filters = { search: get("search"), category: get("category"), stock: get("stock"), sort: get("sort") };

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
  const list = useApi(`/api/admin/products?${query}`);
  const summary = useApi("/api/admin/inventory/summary");
  const categories = useApi("/api/admin/categories");

  const products = Array.isArray(list.data) ? list.data : [];
  const catOptions = useMemo(() => categoryOptions(categories.data), [categories.data]);
  const catLabel = useMemo(() => {
    const map = new Map();
    (categories.data || []).forEach((c) => map.set(c.slug, getCategoryLabel(c)));
    return map;
  }, [categories.data]);
  const filtered = Object.entries(filters).some(([key, value]) => value && key !== "sort");
  const setFilter = (key) => (value) => update({ [key]: value, page: null });

  function refresh() {
    list.retry();
    summary.retry();
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={summary.data
          ? `${formatNumber(summary.data.tracked)} tracked · ${formatNumber(summary.data.untracked)} not tracked · ${formatNumber(summary.data.unitsSold)} units sold in total`
          : "Stock levels, tracking and units sold"}
      />

      <SummaryTiles summary={summary} active={filters.stock} onPick={setFilter("stock")} />

      <Toolbar>
        <SearchBox value={filters.search} onSearch={setFilter("search")} placeholder="Name, brand, SKU or ID" label="Search products" />
        <FilterSelect label="Stock" value={filters.stock} onChange={setFilter("stock")} options={STOCK_OPTIONS} />
        <FilterSelect label="Category" value={filters.category} onChange={setFilter("category")}
          options={[{ value: "none", label: "No category" }, ...catOptions]} />
        <FilterSelect label="Sort" value={filters.sort} onChange={(v) => update({ sort: v, page: null })} options={SORT_OPTIONS} allLabel={null} />
      </Toolbar>

      <Panel>
        {list.loading && !list.data ? (
          <TableSkeleton rows={8} cols={6} />
        ) : list.error && !list.data ? (
          <ErrorState message={list.error} onRetry={list.retry} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title={filtered ? "No products match these filters" : "No products yet"}
            message={filters.stock === "out" ? "Nothing is sold out right now." : filtered ? "Try another search or clear a filter." : "Products you add show up here with their stock."}
            action={filtered ? <Link to="/admin/inventory" className="btn-outline btn-sm">Clear filters</Link> : null}
          />
        ) : (
          <>
            <div className={`relative overflow-x-auto transition-opacity ${list.loading ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[860px] text-sm">
                <caption className="sr-only">Stock per product</caption>
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="min-w-64 px-4 py-3 font-bold">Product</th>
                    <th scope="col" className="px-4 py-3 font-bold">Category</th>
                    <th scope="col" className="px-4 py-3 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Sold</th>
                    <th scope="col" className="px-4 py-3 font-bold">Tracking</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">In stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <InventoryRow
                      key={`${product.id}:${product.stock}:${product.track_inventory}`}
                      product={product}
                      categoryLabel={product.category_slug ? (catLabel.get(product.category_slug) || product.category_slug) : ""}
                      from={location.search}
                      onSaved={refresh}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <ListFooter page={page} pageSize={PAGE_SIZE} total={list.total ?? 0} shown={products.length} onPage={(p) => update({ page: p }, { push: true })} />
          </>
        )}
      </Panel>

      <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Tracked products can't be ordered beyond their stock, and every order reduces it (cancelling gives it back).
        Products that aren't tracked stay for sale without a limit.
      </p>
    </div>
  );
}
