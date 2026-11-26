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
import { formatPrice, getCategoryLabel, getProductView, isStockTracked, productPath, toNumber, LOW_STOCK } from "../../src/utils/product";
import { categoryOptions } from "../../src/utils/categories";
import { formatNumber } from "../../src/utils/format";
import useLanguage from "../../src/i18n/useLanguage";
import { TranslationStatus } from "../../src/components/admin/TranslationEditor";

const PAGE_SIZE = 20;

const SORT_OPTIONS = ["id-desc", "id-asc", "updated", "name-asc", "price-asc", "price-desc", "stock-asc", "stock-desc", "sold-desc"];

export default function AdminProductsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const location = useLocation();
  const { t, lang } = useLanguage("admin");
  const { get, update } = useUrlParams({ page: "1", sort: "id-desc" });
  const [busy, setBusy] = useState(null);

  const page = Math.max(1, parseInt(get("page"), 10) || 1);
  const filters = {
    search: get("search"), category: get("category"), status: get("status"),
    stock: get("stock"), flag: get("flag"), translation: get("translation"), sort: get("sort"),
  };

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
  const { data, total, loading, error, retry } = useApi(`/api/admin/products?${query}`);
  const categories = useApi("/api/admin/categories");

  const products = Array.isArray(data) ? data : [];
  const catOptions = useMemo(() => categoryOptions(categories.data), [categories.data, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const catLabel = useMemo(() => {
    const map = new Map();
    (categories.data || []).forEach((c) => map.set(c.slug, getCategoryLabel(c)));
    return map;
  }, [categories.data, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = Object.entries(filters).some(([key, value]) => value && key !== "sort");

  const setFilter = (key) => (value) => update({ [key]: value, page: null });

  async function toggleVisibility(product) {
    const visible = product.is_active !== false;
    setBusy(product.id);
    try {
      await api.patch(`/api/products/${product.id}`, { is_active: !visible });
      toast.success(visible ? t("products.hidden") : t("products.shown"));
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
      title: t("productForm.deleteTitle"),
      message: t("products.deleteText", { name: title }),
      confirmLabel: t("productForm.delete"),
      tone: "danger",
    });
    if (!ok) return;
    setBusy(product.id);
    try {
      await api.delete(`/api/products/${product.id}`);
      toast.success(t("productForm.deleted"));
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
        title={t("layout.nav.products")}
        description={total != null ? t(filtered ? "products.countFiltered" : "products.count", { count: total, formatted: formatNumber(total) }) : t("products.intro")}
        actions={<Link to="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> {t("productForm.add")}</Link>}
      />

      <Toolbar>
        <SearchBox value={filters.search} onSearch={setFilter("search")} placeholder={t("products.searchPlaceholder")} label={t("products.search")} />
        <FilterSelect label={t("productPage.category")} value={filters.category} onChange={setFilter("category")}
          options={[{ value: "none", label: t("productForm.noCategory") }, ...catOptions]} />
        <FilterSelect label={t("ui.status")} value={filters.status} onChange={setFilter("status")}
          options={[{ value: "active", label: t("status.visibility.active") }, { value: "inactive", label: t("status.visibility.hidden") }]} />
        <FilterSelect label={t("products.stock")} value={filters.stock} onChange={setFilter("stock")}
          options={[{ value: "in", label: t("status.stock.in") }, { value: "low", label: t("products.lowRange", { max: LOW_STOCK }) }, { value: "out", label: t("status.stock.out") }, { value: "untracked", label: t("status.stock.untracked") }]} />
        <FilterSelect label={t("products.show")} value={filters.flag} onChange={setFilter("flag")}
          options={[{ value: "featured", label: t("productPage.featured") }, { value: "flash", label: t("productForm.flash") }, { value: "discounted", label: t("products.discounted") }]} />
        <FilterSelect label={t("categories.translations")} value={filters.translation} onChange={setFilter("translation")}
          options={[{ value: "missing", label: t("products.missingAny") }, { value: "missing-de", label: t("products.missingDe") }, { value: "missing-ar", label: t("products.missingAr") }, { value: "missing-fr", label: t("products.missingFr") }, { value: "missing-es", label: t("products.missingEs") }, { value: "complete", label: t("products.translationsComplete") }]} />
        <FilterSelect label={t("products.sort")} value={filters.sort} onChange={(v) => update({ sort: v, page: null })} options={SORT_OPTIONS.map((value) => ({ value, label: t(`products.sorts.${value}`) }))} allLabel={null} />
      </Toolbar>

      <Panel>
        {loading && !data ? (
          <TableSkeleton rows={8} cols={5} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={retry} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={filtered ? t("products.noMatch") : t("products.none")}
            message={filtered ? t("ui.tryAnother") : t("products.noneText")}
            action={filtered
              ? <Link to="/admin/products" className="btn-outline btn-sm">{t("ui.clearFilters")}</Link>
              : <Link to="/admin/products/new" className="btn-primary btn-sm"><Plus className="h-4 w-4" aria-hidden="true" /> {t("productForm.add")}</Link>}
          />
        ) : (
          <>
            <div className={`relative overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[760px] text-sm">
                <caption className="sr-only">{t("layout.nav.products")}</caption>
                <thead className="bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="min-w-72 px-4 py-3 font-bold">{t("orderDetail.product")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("categories.translations")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("productPage.category")}</th>
                    <th scope="col" className="px-4 py-3 text-end font-bold">{t("products.price")}</th>
                    <th scope="col" className="px-4 py-3 text-end font-bold">{t("products.stock")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("ui.status")}</th>
                    <th scope="col" className="px-4 py-3 text-end font-bold"><span className="sr-only">{t("ui.actions")}</span></th>
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
                                {product.sku && <span dir="ltr">{t("productPage.sku")} {product.sku}</span>}
                                {product.featured && <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600"><Star className="h-3 w-3 fill-current" aria-hidden="true" />{t("productPage.featured")}</span>}
                                {product.flash_sale && <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600"><Zap className="h-3 w-3 fill-current" aria-hidden="true" />{t("product.flash")}</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><TranslationStatus value={product.name} /></td>
                        <td className="px-4 py-3 text-slate-600">
                          {slug ? (catLabel.get(slug) || slug) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-end tabular-nums">
                          <span className="font-bold text-secondary">{formatPrice(view.price)}</span>
                          {view.oldPrice > 0 && <span className="block text-xs text-slate-400 line-through">{formatPrice(view.oldPrice)}</span>}
                        </td>
                        <td className="px-4 py-3 text-end tabular-nums">
                          {isStockTracked(product) ? (
                            <span className={toNumber(product.stock) <= 0 ? "font-bold text-rose-600" : toNumber(product.stock) <= LOW_STOCK ? "font-bold text-amber-600" : "text-slate-700"}>
                              {formatNumber(Math.max(0, toNumber(product.stock)))}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400" title={t("products.untrackedHint")}>{t("status.stock.untracked")}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge kind="visibility" status={visible ? "active" : "hidden"} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {visible && (
                              <a href={productPath(product)} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" title={t("productForm.viewInStore")} aria-label={t("products.viewNamed", { name: view.title })}>
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleVisibility(product)}
                              disabled={busy === product.id}
                              className="btn-outline btn-sm px-3"
                            >
                              {visible ? t("ui.hide") : t("ui.show")}
                            </button>
                            <Link
                              to={`/admin/products/${product.id}/edit`}
                              state={{ from: location.search }}
                              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-600"
                              aria-label={t("ui.editNamed", { name: view.title })}
                              title={t("ui.edit")}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => remove(product)}
                              disabled={busy === product.id}
                              className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                              aria-label={t("ui.deleteNamed", { name: view.title })}
                              title={t("ui.delete")}
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
