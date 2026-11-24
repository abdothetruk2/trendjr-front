import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, Pencil, Trash2, PackageSearch, ExternalLink, Zap, Star } from "lucide-react";
import useApi from "../../src/hooks/useApi";
import useUrlParams from "../../src/hooks/useUrlParams";
import api, { getErrorMessage } from "../../src/services/api";
import { useToast } from "../../src/context/ToastContext";
import { useConfirm } from "../../src/components/admin/ConfirmDialog";
import ProductImage from "../../src/components/ProductImage";
import {
  PageHeader, Panel, Toolbar, SearchBox, FilterSelect, StatusBadge, EmptyState, ErrorState, TableSkeleton, ListFooter,
} from "../../src/components/admin/AdminUI";
import { formatPrice, getCategoryLabel, getProductView, toNumber } from "../../src/utils/product";
import { categoryOptions } from "../../src/utils/categories";
import { formatNumber } from "../../src/utils/format";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "id-desc", label: "Newest first" },
  { value: "id-asc", label: "Oldest first" },
  { value: "updated", label: "Recently updated" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "stock-asc", label: "Stock: low to high" },
  { value: "stock-desc", label: "Stock: high to low" },
];

export default function AdminProductsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const location = useLocation();
  const { get, update } = useUrlParams({ page: "1", sort: "id-desc" });
  const [busy, setBusy] = useState(null);

  const page = Math.max(1, parseInt(get("page"), 10) || 1);
  const filters = {
    search: get("search"), category: get("category"), status: get("status"),
    stock: get("stock"), flag: get("flag"), sort: get("sort"),
  };

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
  const { data, total, loading, error, retry } = useApi(`/api/admin/products?${query}`);
  const categories = useApi("/api/admin/categories");

  const products = Array.isArray(data) ? data : [];
  const catOptions = useMemo(() => categoryOptions(categories.data), [categories.data]);
  const catLabel = useMemo(() => {
    const map = new Map();
    (categories.data || []).forEach((c) => map.set(c.slug, getCategoryLabel(c)));
    return map;
  }, [categories.data]);
  const filtered = Object.entries(filters).some(([key, value]) => value && key !== "sort");

  const setFilter = (key) => (value) => update({ [key]: value, page: null });

  async function toggleVisibility(product) {
    const visible = product.is_active !== false;
    setBusy(product.id);
    try {
      await api.patch(`/api/products/${product.id}`, { is_active: !visible });
      toast.success(visible ? "Product hidden from the store" : "Product is visible in the store");
      retry();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove(product) {
    const { title } = getProductView(product);
    const ok = await confirm({
      title: "Delete this product?",
      message: (
        <>
          <strong className="text-secondary">{title}</strong> will be removed from the catalog. Past orders keep their own copy of it.
          If you might sell it again, hide it instead.
        </>
      ),
      confirmLabel: "Delete product",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(product.id);
    try {
      await api.delete(`/api/products/${product.id}`);
      toast.success("Product deleted");
      if (products.length === 1 && page > 1) update({ page: page - 1 });
      else retry();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description={total != null ? `${formatNumber(total)} product${total === 1 ? "" : "s"}${filtered ? " match your filters" : " in the catalog"}` : "Your catalog"}
        actions={<Link to="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> Add product</Link>}
      />

      <Toolbar>
        <SearchBox value={filters.search} onSearch={setFilter("search")} placeholder="Name, brand, SKU or ID" label="Search products" />
        <FilterSelect label="Category" value={filters.category} onChange={setFilter("category")}
          options={[{ value: "none", label: "No category" }, ...catOptions]} />
        <FilterSelect label="Status" value={filters.status} onChange={setFilter("status")}
          options={[{ value: "active", label: "Visible" }, { value: "inactive", label: "Hidden" }]} />
        <FilterSelect label="Stock" value={filters.stock} onChange={setFilter("stock")}
          options={[{ value: "in", label: "In stock" }, { value: "low", label: "Low (1–5)" }, { value: "none", label: "0 / not set" }]} />
        <FilterSelect label="Show" value={filters.flag} onChange={setFilter("flag")}
          options={[{ value: "featured", label: "Featured" }, { value: "flash", label: "Flash sale" }, { value: "discounted", label: "Discounted" }]} />
        <FilterSelect label="Sort" value={filters.sort} onChange={(v) => update({ sort: v, page: null })} options={SORT_OPTIONS} allLabel={null} />
      </Toolbar>

      <Panel>
        {loading && !data ? (
          <TableSkeleton rows={8} cols={5} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={retry} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={filtered ? "No products match these filters" : "No products yet"}
            message={filtered ? "Try another search or clear a filter." : "Add your first product to start selling."}
            action={filtered
              ? <Link to="/admin/products" className="btn-outline btn-sm">Clear filters</Link>
              : <Link to="/admin/products/new" className="btn-primary btn-sm"><Plus className="h-4 w-4" aria-hidden="true" /> Add product</Link>}
          />
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[760px] text-sm">
                <caption className="sr-only">Products</caption>
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="min-w-72 px-4 py-3 font-bold">Product</th>
                    <th scope="col" className="px-4 py-3 font-bold">Category</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Price</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Stock</th>
                    <th scope="col" className="px-4 py-3 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => {
                    const view = getProductView(product);
                    const visible = product.is_active !== false;
                    const slug = product.category_slug;
                    return (
                      <tr key={product.id} className="align-middle hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ProductImage src={view.image} fallbackSrc={view.imageFallback} alt="" className="h-12 w-12 shrink-0 rounded-xl" />
                            <div className="min-w-0">
                              <Link
                                to={`/admin/products/${product.id}/edit`}
                                state={{ from: location.search }}
                                className="line-clamp-1 font-bold text-secondary hover:text-primary-600"
                              >
                                {view.title}
                              </Link>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                                <span>#{product.id}</span>
                                {product.sku && <span>SKU {product.sku}</span>}
                                {product.featured && <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600"><Star className="h-3 w-3 fill-current" aria-hidden="true" />Featured</span>}
                                {product.flash_sale && <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600"><Zap className="h-3 w-3 fill-current" aria-hidden="true" />Flash</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {slug ? (catLabel.get(slug) || slug) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className="font-bold text-secondary">{formatPrice(view.price)}</span>
                          {view.oldPrice > 0 && <span className="block text-xs text-slate-400 line-through">{formatPrice(view.oldPrice)}</span>}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={toNumber(product.stock) > 0 && toNumber(product.stock) <= 5 ? "font-bold text-amber-600" : "text-slate-700"}>
                            {formatNumber(product.stock)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge kind="visibility" status={visible ? "active" : "hidden"} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {visible && (
                              <a href={`/product/${product.id}`} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="View in store" aria-label={`View ${view.title} in the store`}>
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleVisibility(product)}
                              disabled={busy === product.id}
                              className="btn-outline btn-sm px-3"
                            >
                              {visible ? "Hide" : "Show"}
                            </button>
                            <Link
                              to={`/admin/products/${product.id}/edit`}
                              state={{ from: location.search }}
                              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-600"
                              aria-label={`Edit ${view.title}`}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => remove(product)}
                              disabled={busy === product.id}
                              className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                              aria-label={`Delete ${view.title}`}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ListFooter page={page} pageSize={PAGE_SIZE} total={total ?? 0} shown={products.length} onPage={(p) => update({ page: p }, { push: true })} />
          </>
        )}
      </Panel>
    </div>
  );
}
