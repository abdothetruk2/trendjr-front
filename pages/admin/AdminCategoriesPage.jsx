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
import TranslationEditor, { LANGS, toLocalized, missingTranslations, TranslationStatus } from "../../src/components/admin/TranslationEditor";
import useLanguage from "../../src/i18n/useLanguage";

const PAGE_SIZE = 15;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugify = (text) => String(text || "")
  .normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);

export default function AdminCategoriesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { t, lang } = useLanguage("admin");
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
  }, [categories, byId, level, status, search, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filtered = Boolean(search || level || status);
  const setFilter = (key) => (value) => update({ [key]: value, page: null });

  async function toggleVisibility(category) {
    setBusy(category._id);
    try {
      await api.patch(`/api/categories/${category._id}`, { isActive: !category.isActive });
      toast.success(category.isActive ? t("categories.hidden") : t("categories.shown"));
      retry();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove(category) {
    const ok = await confirm({
      title: t("categories.deleteTitle"),
      message: (
        <>
          {t("categories.deleteText", { name: getCategoryLabel(category) })}
          {category.productCount > 0 && <> {t("categories.deleteHasProducts", { count: category.productCount })}</>}
        </>
      ),
      confirmLabel: t("categories.delete"),
      tone: "danger",
    });
    if (!ok) return;
    setBusy(category._id);
    try {
      await api.delete(`/api/categories/${category._id}`);
      toast.success(t("categories.deleted"));
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
        title={t("layout.nav.categories")}
        description={data ? t("categories.summary", { count: categories.length, formatted: formatNumber(categories.length), top: formatNumber(categories.filter((c) => c.parent_id == null).length) }) : t("categories.intro")}
        actions={<button type="button" onClick={() => setEditing({})} className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> {t("categories.add")}</button>}
      />

      <Toolbar>
        <SearchBox value={get("search")} onSearch={setFilter("search")} placeholder={t("categories.searchPlaceholder")} label={t("categories.search")} />
        <FilterSelect label={t("categories.level")} value={level} onChange={setFilter("level")}
          options={[{ value: "top", label: t("categories.topLevel") }, { value: "sub", label: t("categories.subCategories") }]} />
        <FilterSelect label={t("ui.status")} value={status} onChange={setFilter("status")}
          options={[{ value: "active", label: t("status.visibility.active") }, { value: "hidden", label: t("status.visibility.hidden") }]} />
      </Toolbar>

      <Panel>
        {loading && !data ? (
          <TableSkeleton rows={8} cols={4} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={retry} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title={filtered ? t("categories.noMatch") : t("categories.none")}
            message={filtered ? t("ui.tryAnother") : t("categories.noneText")}
            action={filtered && <Link to="/admin/categories" className="btn-outline btn-sm">{t("ui.clearFilters")}</Link>}
          />
        ) : (
          <>
            <div className={`relative overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[720px] text-sm">
                <caption className="sr-only">{t("layout.nav.categories")}</caption>
                <thead className="bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">{t("productPage.category")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("categories.translations")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("categories.slug")}</th>
                    <th scope="col" className="px-4 py-3 text-end font-bold">{t("layout.nav.products")}</th>
                    <th scope="col" className="px-4 py-3 text-end font-bold">{t("categories.order")}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t("ui.status")}</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">{t("ui.actions")}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((category) => {
                    const parent = category.parent_id != null ? byId.get(category.parent_id) : null;
                    return (
                      <tr key={category._id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-3 ${parent && !filtered ? "ps-6" : ""}`}>
                            {parent && !filtered && <CornerDownRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />}
                            <ProductImage
                              src={getImageUrl(category.image)}
                              fallbackSrc={isExternalUrl(category.image) ? category.image : ""}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-xl"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-secondary">{getCategoryLabel(category)}</p>
                              {parent && <p className="truncate text-xs text-slate-400">{t("categories.inParent", { name: getCategoryLabel(parent) })}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><TranslationStatus value={category.name} /></td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{category.slug}</td>
                        <td className="px-4 py-3 text-end tabular-nums">
                          {category.productCount > 0 ? (
                            <Link to={`/admin/products?category=${encodeURIComponent(category.slug)}`} className="font-bold text-primary-600 hover:underline">
                              {formatNumber(category.productCount)}
                            </Link>
                          ) : <span className="text-slate-400">0</span>}
                        </td>
                        <td className="px-4 py-3 text-end tabular-nums text-slate-500">{category.sort_order ?? 0}</td>
                        <td className="px-4 py-3"><StatusBadge kind="visibility" status={category.isActive ? "active" : "hidden"} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => toggleVisibility(category)} disabled={busy === category._id} className="btn-outline btn-sm px-3">
                              {category.isActive ? t("ui.hide") : t("ui.show")}
                            </button>
                            <button type="button" onClick={() => setEditing(category)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-600" aria-label={t("ui.editNamed", { name: getCategoryLabel(category) })} title={t("ui.edit")}>
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button type="button" onClick={() => remove(category)} disabled={busy === category._id} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40" aria-label={t("ui.deleteNamed", { name: getCategoryLabel(category) })} title={t("ui.delete")}>
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
  const { t } = useLanguage("admin");
  const open = category !== null;
  const isEdit = Boolean(category?._id);
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t("categories.edit") : t("categories.add")} size="lg">
      {open && <CategoryForm key={category?._id || "new"} category={category} categories={categories} isEdit={isEdit} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function CategoryForm({ category, categories, isEdit, onClose, onSaved }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useLanguage("admin");
  const [aiDrafts, setAiDrafts] = useState(() => new Set());
  const hasChildren = isEdit && categories.some((c) => c.parent_id != null && c.parent_id === category.id);
  const parents = categories.filter((c) => c.parent_id == null && c._id !== category?._id);

  const [form, setForm] = useState(() => ({
    name: toLocalized(category?.name),
    subtitle: toLocalized(category?.subtitle),
    description: toLocalized(category?.description),
    slug: category?.slug || "",
    parent_id: category?.parent_id != null ? String(category.parent_id) : "",
    sort_order: String(category?.sort_order ?? 0),
    image: category?.image || "",
    isActive: category?.isActive !== false,
  }));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const textFields = [
    { key: "name", label: t("categories.name"), required: true, maxLength: 100 },
    { key: "subtitle", label: t("categories.subtitle"), maxLength: 200, hint: t("categories.subtitleHint") },
    { key: "description", label: t("productForm.description"), multiline: true, maxLength: 1000, hint: t("categories.descriptionHint") },
  ];
  const changeText = (key, language, value) => setForm((f) => {
    const next = { ...f, [key]: { ...f[key], [language]: value } };
    if (key === "name" && language === "en" && !slugTouched) next.slug = slugify(value);
    return next;
  });

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!form.name.en.trim()) found.name = t("categories.nameRequired");
    if (!form.slug || !SLUG_PATTERN.test(form.slug)) found.slug = t("productForm.errors.slug");
    if (!Number.isInteger(Number(form.sort_order))) found.sort_order = t("categories.wholeNumber");
    setErrors(found);
    if (Object.keys(found).length) return;
    if (aiDrafts.size > 0 && !(await confirm({
      title: t("productForm.unreviewedTitle"),
      message: t("productForm.unreviewedText", { count: aiDrafts.size }),
      confirmLabel: t("productForm.publishAnyway"),
      cancelLabel: t("productForm.reviewFirst"),
    }))) return;
    const missing = LANGS.filter((l) => l !== "en").filter((l) => missingTranslations(textFields.slice(0, 1), form, l).length > 0);
    if (missing.length && !(await confirm({
      title: t("productForm.missingTitle"),
      message: t("productForm.missingText", { languages: missing.map((l) => l.toUpperCase()).join(", ") }),
      confirmLabel: t("productForm.saveAnyway"),
      cancelLabel: t("productForm.addTranslations"),
    }))) return;

    const clean = (key) => Object.fromEntries(LANGS.map((l) => [l, form[key][l].trim()]));
    const payload = {
      name: clean("name"),
      subtitle: clean("subtitle"),
      description: clean("description"),
      slug: form.slug,
      parent_id: form.parent_id === "" ? null : Number(form.parent_id),
      sort_order: Number(form.sort_order),
      image: form.image.trim(),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (isEdit) await api.patch(`/api/categories/${category._id}`, payload);
      else await api.post("/api/categories", payload);
      onSaved(isEdit ? t("categories.saved") : t("categories.created"));
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <TranslationEditor fields={textFields} values={form} onChange={changeText} drafts={aiDrafts} onDrafts={setAiDrafts} errors={{ name: errors.name }} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("categories.slug")} required error={errors.slug} hint={isEdit ? t("categories.slugHintEdit") : t("categories.slugHintNew")}>
          <input value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug")(e.target.value.toLowerCase()); }} className="input font-mono text-xs" maxLength={120} dir="ltr" />
        </Field>
        <Field label={t("categories.parent")} hint={hasChildren ? t("categories.parentHintChildren") : t("categories.parentHint")}>
          <select value={form.parent_id} onChange={(e) => set("parent_id")(e.target.value)} className="input" disabled={hasChildren}>
            <option value="">{t("categories.noParent")}</option>
            {parents.map((p) => <option key={p._id} value={p.id}>{getCategoryLabel(p)}</option>)}
          </select>
        </Field>
        <Field label={t("categories.displayOrder")} hint={t("categories.displayOrderHint")} error={errors.sort_order}>
          <input type="number" step="1" value={form.sort_order} onChange={(e) => set("sort_order")(e.target.value)} className="input" />
        </Field>
      </div>
      <ImageField value={form.image} onChange={set("image")} label={t("categories.image")} />
      <div className="rounded-2xl border border-slate-200 p-4">
        <Toggle checked={form.isActive} onChange={set("isActive")} label={t("productForm.visible")} description={t("categories.visibleText")} />
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onClose} className="btn-outline" disabled={saving}>{t("common.cancel")}</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isEdit ? t("categories.save") : t("categories.create")}
        </button>
      </div>
    </form>
  );
}
