import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, FolderTree, CornerDownRight, Loader2 } from "lucide-react";
import useApi from "../../src/hooks/useApi";
import useUrlParams from "../../src/hooks/useUrlParams";
import api, { getErrorMessage } from "../../src/services/api";
import { useToast } from "../../src/context/ToastContext";
import { useConfirm } from "../../src/components/admin/ConfirmDialog";
import Modal from "../../src/components/admin/Modal";
import ImageField from "../../src/components/admin/ImageField";
import ProductImage from "../../src/components/ProductImage";
import {
  PageHeader, Panel, Toolbar, SearchBox, FilterSelect, StatusBadge, EmptyState, ErrorState, TableSkeleton, ListFooter, Field, Toggle,
} from "../../src/components/admin/AdminUI";
import { getCategoryLabel, getImageUrl, getText, isExternalUrl } from "../../src/utils/product";
import { categoryTree } from "../../src/utils/categories";
import { formatNumber } from "../../src/utils/format";

const PAGE_SIZE = 15;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugify = (text) => String(text || "")
  .normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);

export default function AdminCategoriesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { get, update } = useUrlParams({ page: "1" });
  const { data, loading, error, retry } = useApi("/api/admin/categories");
  const [editing, setEditing] = useState(null); // null | {} (new) | category
  const [busy, setBusy] = useState(null);

  const page = Math.max(1, parseInt(get("page"), 10) || 1);
  const search = get("search").toLowerCase();
  const level = get("level");
  const status = get("status");

  const categories = Array.isArray(data) ? data : [];
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Parents followed by their sub-categories, then filtered
  const rows = useMemo(() => {
    const ordered = categoryTree(categories).flatMap((root) => [root, ...root.children]);
    return ordered.filter((c) => {
      const isSub = c.parent_id != null && byId.has(c.parent_id);
      if (level === "top" && isSub) return false;
      if (level === "sub" && !isSub) return false;
      if (status === "active" && !c.isActive) return false;
      if (status === "hidden" && c.isActive) return false;
      if (search) {
        const haystack = `${getCategoryLabel(c)} ${c.slug} ${getText(c.name, "de")} ${getText(c.name, "ar")}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [categories, byId, level, status, search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filtered = Boolean(search || level || status);
  const setFilter = (key) => (value) => update({ [key]: value, page: null });

  async function toggleVisibility(category) {
    setBusy(category._id);
    try {
      await api.patch(`/api/categories/${category._id}`, { isActive: !category.isActive });
      toast.success(category.isActive ? "Category hidden from the store" : "Category is visible in the store");
      retry();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove(category) {
    const ok = await confirm({
      title: "Delete this category?",
      message: (
        <>
          <strong className="text-secondary">{getCategoryLabel(category)}</strong> will be deleted.
          {category.productCount > 0 && <> It still has {category.productCount} product{category.productCount === 1 ? "" : "s"}, so the store will refuse until they are moved.</>}
        </>
      ),
      confirmLabel: "Delete category",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(category._id);
    try {
      await api.delete(`/api/categories/${category._id}`);
      toast.success("Category deleted");
      retry();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description={data ? `${formatNumber(categories.length)} categories · ${formatNumber(categories.filter((c) => c.parent_id == null).length)} top-level` : "Organize your catalog"}
        actions={<button type="button" onClick={() => setEditing({})} className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> Add category</button>}
      />

      <Toolbar>
        <SearchBox value={get("search")} onSearch={setFilter("search")} placeholder="Name or slug" label="Search categories" />
        <FilterSelect label="Level" value={level} onChange={setFilter("level")}
          options={[{ value: "top", label: "Top-level" }, { value: "sub", label: "Sub-categories" }]} />
        <FilterSelect label="Status" value={status} onChange={setFilter("status")}
          options={[{ value: "active", label: "Visible" }, { value: "hidden", label: "Hidden" }]} />
      </Toolbar>

      <Panel>
        {loading && !data ? (
          <TableSkeleton rows={8} cols={4} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={retry} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title={filtered ? "No categories match" : "No categories yet"}
            message={filtered ? "Try another search or clear a filter." : "Create your first category to group products."}
            action={filtered && <Link to="/admin/categories" className="btn-outline btn-sm">Clear filters</Link>}
          />
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[720px] text-sm">
                <caption className="sr-only">Categories</caption>
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">Category</th>
                    <th scope="col" className="px-4 py-3 font-bold">Slug</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Products</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Order</th>
                    <th scope="col" className="px-4 py-3 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((category) => {
                    const parent = category.parent_id != null ? byId.get(category.parent_id) : null;
                    return (
                      <tr key={category._id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-3 ${parent && !filtered ? "pl-6" : ""}`}>
                            {parent && !filtered && <CornerDownRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />}
                            <ProductImage
                              src={getImageUrl(category.image)}
                              fallbackSrc={isExternalUrl(category.image) ? category.image : ""}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-xl"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-secondary">{getCategoryLabel(category)}</p>
                              {parent && <p className="truncate text-xs text-slate-400">in {getCategoryLabel(parent)}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{category.slug}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {category.productCount > 0 ? (
                            <Link to={`/admin/products?category=${encodeURIComponent(category.slug)}`} className="font-bold text-primary-600 hover:underline">
                              {formatNumber(category.productCount)}
                            </Link>
                          ) : <span className="text-slate-400">0</span>}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">{category.sort_order ?? 0}</td>
                        <td className="px-4 py-3"><StatusBadge kind="visibility" status={category.isActive ? "active" : "hidden"} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => toggleVisibility(category)} disabled={busy === category._id} className="btn-outline btn-sm px-3">
                              {category.isActive ? "Hide" : "Show"}
                            </button>
                            <button type="button" onClick={() => setEditing(category)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-600" aria-label={`Edit ${getCategoryLabel(category)}`} title="Edit">
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button type="button" onClick={() => remove(category)} disabled={busy === category._id} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40" aria-label={`Delete ${getCategoryLabel(category)}`} title="Delete">
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
            <ListFooter page={currentPage} pageSize={PAGE_SIZE} total={rows.length} shown={pageRows.length} onPage={(p) => update({ page: p }, { push: true })} />
          </>
        )}
      </Panel>

      <CategoryFormModal
        category={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={(message) => { setEditing(null); toast.success(message); retry(); }}
      />
    </div>
  );
}

function CategoryFormModal({ category, categories, onClose, onSaved }) {
  const open = category !== null;
  const isEdit = Boolean(category?._id);
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit category" : "Add category"} size="lg">
      {open && <CategoryForm key={category?._id || "new"} category={category} categories={categories} isEdit={isEdit} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function CategoryForm({ category, categories, isEdit, onClose, onSaved }) {
  const toast = useToast();
  const hasChildren = isEdit && categories.some((c) => c.parent_id != null && c.parent_id === category.id);
  const parents = categories.filter((c) => c.parent_id == null && c._id !== category?._id);

  const [form, setForm] = useState(() => ({
    nameEn: getText(category?.name, "en") || "",
    nameDe: typeof category?.name === "object" ? category.name?.de || "" : "",
    nameAr: typeof category?.name === "object" ? category.name?.ar || "" : "",
    slug: category?.slug || "",
    parent_id: category?.parent_id != null ? String(category.parent_id) : "",
    sort_order: String(category?.sort_order ?? 0),
    description: typeof category?.description === "string" ? category.description : "",
    image: category?.image || "",
    isActive: category?.isActive !== false,
  }));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!form.nameEn.trim()) found.nameEn = "Enter a name.";
    if (!form.slug || !SLUG_PATTERN.test(form.slug)) found.slug = "Use lowercase letters, numbers and single hyphens.";
    if (!Number.isInteger(Number(form.sort_order))) found.sort_order = "Enter a whole number.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      name: { en: form.nameEn.trim(), de: form.nameDe.trim(), ar: form.nameAr.trim() },
      slug: form.slug,
      parent_id: form.parent_id === "" ? null : Number(form.parent_id),
      sort_order: Number(form.sort_order),
      description: form.description.trim(),
      image: form.image.trim(),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (isEdit) await api.patch(`/api/categories/${category._id}`, payload);
      else await api.post("/api/categories", payload);
      onSaved(isEdit ? "Category saved" : "Category created");
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={errors.nameEn}>
          <input
            value={form.nameEn}
            onChange={(e) => {
              const value = e.target.value;
              setForm((f) => ({ ...f, nameEn: value, slug: slugTouched ? f.slug : slugify(value) }));
            }}
            className="input"
            maxLength={100}
            data-autofocus
          />
        </Field>
        <Field label="Slug" required error={errors.slug} hint={isEdit ? "Products in this category follow the new slug." : "Used in the category's web address."}>
          <input value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug")(e.target.value.toLowerCase()); }} className="input font-mono text-xs" maxLength={120} />
        </Field>
        <Field label="Name (German)">
          <input value={form.nameDe} onChange={(e) => set("nameDe")(e.target.value)} className="input" lang="de" maxLength={100} />
        </Field>
        <Field label="Name (Arabic)">
          <input value={form.nameAr} onChange={(e) => set("nameAr")(e.target.value)} className="input" lang="ar" dir="rtl" maxLength={100} />
        </Field>
        <Field label="Parent category" hint={hasChildren ? "This category has sub-categories, so it stays top-level." : "Leave empty for a top-level category."}>
          <select value={form.parent_id} onChange={(e) => set("parent_id")(e.target.value)} className="input" disabled={hasChildren}>
            <option value="">None (top-level)</option>
            {parents.map((p) => <option key={p._id} value={p.id}>{getCategoryLabel(p)}</option>)}
          </select>
        </Field>
        <Field label="Display order" hint="Lower numbers come first." error={errors.sort_order}>
          <input type="number" step="1" value={form.sort_order} onChange={(e) => set("sort_order")(e.target.value)} className="input" />
        </Field>
      </div>
      <Field label="Description">
        <textarea value={form.description} onChange={(e) => set("description")(e.target.value)} className="input min-h-20" maxLength={1000} />
      </Field>
      <ImageField value={form.image} onChange={set("image")} label="Image (optional)" />
      <div className="rounded-2xl border border-slate-200 p-4">
        <Toggle checked={form.isActive} onChange={set("isActive")} label="Visible in the store" description="Hidden categories don't appear in the menus or filters." />
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onClose} className="btn-outline" disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isEdit ? "Save category" : "Create category"}
        </button>
      </div>
    </form>
  );
}
