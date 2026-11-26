import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Trash2, ExternalLink, Search as SearchIcon } from "lucide-react";
import useApi from "../../src/hooks/useApi";
import api, { getErrorMessage } from "../../src/services/api";
import { useToast } from "../../src/context/ToastContext";
import { useConfirm } from "../../src/components/admin/ConfirmDialog";
import ImageField from "../../src/components/admin/ImageField";
import GalleryField from "../../src/components/admin/GalleryField";
import { Field, Panel, Toggle, ErrorState } from "../../src/components/admin/AdminUI";
import { categoryOptions } from "../../src/utils/categories";
import { formatPrice, isStockTracked, productPath, toNumber } from "../../src/utils/product";
import { CURRENCY_SYMBOL } from "../../src/config/site";
import TranslationEditor, { LANGS, toLocalized, emptyLocalized, missingTranslations } from "../../src/components/admin/TranslationEditor";
import useLanguage from "../../src/i18n/useLanguage";
import i18n from "../../src/i18n";

const tr = (key, options) => i18n.t(key, { ns: "admin", ...options });

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const EMPTY = {
  name: emptyLocalized(),
  description: emptyLocalized(),
  seoTitle: emptyLocalized(),
  seoDescription: emptyLocalized(),
  brand: "",
  slug: "",
  sku: "",
  price: "",
  old_price: "",
  stock: "",
  track_inventory: true,
  category: "",
  image: "",
  images: [],
  is_active: true,
  featured: false,
  flash_sale: false,
};

const slugify = (text) => String(text || "")
  .normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);

const localized = toLocalized;


// API product -> form values (all strings, so the inputs stay controlled)
function toForm(product) {
  const oldPrice = toNumber(product.old_price);
  return {
    name: localized(product.name),
    description: localized(product.description),
    seoTitle: localized(product.seo?.title),
    seoDescription: localized(product.seo?.description),
    brand: product.brand || "",
    slug: product.slug || "",
    sku: product.sku || "",
    price: product.price != null ? String(toNumber(product.price)) : "",
    old_price: oldPrice > 0 ? String(oldPrice) : "",
    stock: String(Math.max(0, toNumber(product.stock))),
    track_inventory: isStockTracked(product),
    category: product.category_slug || "",
    image: product.image || "",
    images: Array.isArray(product.images) ? product.images.filter((p) => typeof p === "string" && p) : [],
    is_active: product.is_active !== false,
    featured: Boolean(product.featured),
    flash_sale: Boolean(product.flash_sale),
  };
}

function validate(form) {
  const errors = {};
  if (!form.name.en.trim()) errors.name = tr("productForm.errors.name");
  const price = Number(form.price);
  if (form.price === "" || !Number.isFinite(price) || price < 0) errors.price = tr("productForm.errors.price");
  if (form.old_price !== "") {
    const oldPrice = Number(form.old_price);
    if (!Number.isFinite(oldPrice) || oldPrice < 0) errors.old_price = tr("productForm.errors.oldPriceInvalid");
    else if (!errors.price && oldPrice <= price) errors.old_price = tr("productForm.errors.oldPriceLow");
  }
  const stock = Number(form.stock);
  if (form.track_inventory && (form.stock === "" || !Number.isInteger(stock) || stock < 0 || stock > 1000000)) {
    errors.stock = tr("productForm.errors.stock");
  }
  if (form.slug && !SLUG_PATTERN.test(form.slug)) errors.slug = tr("productForm.errors.slug");
  if (form.sku.length > 64) errors.sku = tr("productForm.errors.sku");
  return errors;
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const confirm = useConfirm();
  const backTo = location.state?.back || `/admin/products${location.state?.from || ""}`;
  const { t, lang } = useLanguage("admin");

  const productReq = useApi(isEdit ? `/api/admin/products/${encodeURIComponent(id)}` : null);
  const categories = useApi("/api/admin/categories");
  const catOptions = useMemo(() => categoryOptions(categories.data), [categories.data, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [aiDrafts, setAiDrafts] = useState(() => new Set()); // "name.de" etc. filled by AI, not reviewed yet
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  // Fill the form once the product has loaded
  useEffect(() => {
    if (!productReq.data) return;
    const values = toForm(productReq.data);
    setForm(values);
    setInitial(values);
  }, [productReq.data]);

  const textFields = [
    { key: "name", label: t("productForm.name"), required: true, maxLength: 200, placeholder: t("productForm.namePlaceholder") },
    { key: "description", label: t("productForm.description"), multiline: true, maxLength: 5000, hint: t("productForm.descriptionHint") },
    { key: "seoTitle", label: t("productForm.seoTitle"), maxLength: 120, hint: t("productForm.seoTitleHint") },
    { key: "seoDescription", label: t("productForm.seoDescription"), multiline: true, maxLength: 300, hint: t("productForm.seoDescriptionHint") },
  ];
  const changeText = (key, language, value) => setForm((f) => {
    const next = { ...f, [key]: { ...f[key], [language]: value } };
    if (key === "name" && language === "en" && !slugTouched) next.slug = slugify(value);
    return next;
  });

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const price = Number(form.price);
  const oldPrice = Number(form.old_price);
  const discount = form.old_price !== "" && oldPrice > price && price >= 0 ? Math.round((1 - price / oldPrice) * 100) : 0;

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setText = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length) {
      toast.error(t("productForm.fixFields"));
      return;
    }
    // AI translations are drafts: the admin confirms them before they go live
    if (aiDrafts.size > 0 && !(await confirm({
      title: t("productForm.unreviewedTitle"),
      message: t("productForm.unreviewedText", { count: aiDrafts.size }),
      confirmLabel: t("productForm.publishAnyway"),
      cancelLabel: t("productForm.reviewFirst"),
    }))) return;
    const missing = LANGS.filter((l) => l !== "en").filter((l) => missingTranslations(textFields.slice(0, 2), form, l).length > 0);
    if (missing.length && !(await confirm({
      title: t("productForm.missingTitle"),
      message: t("productForm.missingText", { languages: missing.map((l) => l.toUpperCase()).join(", ") }),
      confirmLabel: t("productForm.saveAnyway"),
      cancelLabel: t("productForm.addTranslations"),
    }))) return;

    const clean = (key) => Object.fromEntries(LANGS.map((l) => [l, form[key][l].trim()]));
    const payload = {
      name: clean("name"),
      description: clean("description"),
      seo: { title: clean("seoTitle"), description: clean("seoDescription") },
      brand: form.brand.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      old_price: form.old_price === "" ? null : Number(form.old_price),
      discount,
      // Untracked products keep their last count (or 0): it only matters again if tracking is turned back on
      stock: form.stock !== "" && Number.isInteger(Number(form.stock)) && Number(form.stock) >= 0 ? Number(form.stock) : 0,
      track_inventory: form.track_inventory,
      category: form.category || null,
      image: form.image.trim(),
      images: form.images,
      is_active: form.is_active,
      featured: form.featured,
      flash_sale: form.flash_sale,
    };
    if (form.slug) payload.slug = form.slug;

    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/api/products/${encodeURIComponent(id)}`, payload);
        toast.success(t("productForm.saved"));
      } else {
        await api.post("/api/products", payload);
        toast.success(t("productForm.created"));
      }
      setInitial(form);
      setAiDrafts(new Set());
      navigate(backTo);
    } catch (err) {
      const message = getErrorMessage(err);
      setServerError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: t("productForm.deleteTitle"),
      message: t("productForm.deleteText"),
      confirmLabel: t("productForm.delete"),
      tone: "danger",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await api.delete(`/api/products/${encodeURIComponent(id)}`);
      toast.success(t("productForm.deleted"));
      navigate(backTo);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (dirty && !(await confirm({ title: t("form.discardTitle"), message: t("form.discardText"), confirmLabel: t("form.discard"), tone: "danger" }))) return;
    navigate(backTo);
  }

  if (isEdit && productReq.loading && !productReq.data) {
    return (
      <div className="grid min-h-[50vh] place-items-center" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-primary-500" aria-hidden="true" />
        <span className="sr-only">{t("productForm.loading")}</span>
      </div>
    );
  }
  if (isEdit && productReq.error) {
    return (
      <div className="card">
        <ErrorState
          message={productReq.status === 404 ? t("productForm.notFound") : productReq.error}
          onRetry={productReq.status === 404 ? undefined : productReq.retry}
        />
        <div className="pb-8 text-center"><Link to={backTo} className="link-primary text-sm">{t("productForm.back")}</Link></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={handleCancel} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label={t("productForm.back")}>
            <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-tight text-secondary">
              {isEdit ? form.name[lang] || form.name.en || t("productForm.edit") : t("productForm.add")}
            </h1>
            <p className="text-sm text-slate-500">{isEdit ? t("productForm.number", { id }) : t("productForm.addIntro")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEdit && initial.is_active && (
            <a href={productPath({ id, slug: initial.slug })} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> {t("productForm.viewInStore")}
            </a>
          )}
          <button type="button" onClick={handleCancel} className="btn-outline">{t("common.cancel")}</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {isEdit ? t("form.saveChanges") : t("productForm.create")}
          </button>
        </div>
      </div>

      {serverError && (
        <div className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{serverError}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title={t("productForm.basic")} bodyClassName="space-y-4 p-5">
            <TranslationEditor
              fields={textFields}
              values={form}
              onChange={changeText}
              drafts={aiDrafts}
              onDrafts={setAiDrafts}
              errors={{ name: errors.name }}
            />
            <p className="flex items-start gap-1.5 text-xs text-slate-400">
              <SearchIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {t("productForm.specsHint")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("productForm.brand")}>
                <input value={form.brand} onChange={setText("brand")} className="input" maxLength={100} />
              </Field>
              <Field label={t("productForm.sku")} hint={t("productForm.skuHint")} error={errors.sku}>
                <input value={form.sku} onChange={setText("sku")} className="input" maxLength={64} dir="ltr" />
              </Field>
            </div>
            <Field label={t("productForm.slug")} hint={isEdit ? t("productForm.slugHintEdit") : t("productForm.slugHintNew")} error={errors.slug}>
              <input
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); set("slug")(e.target.value.toLowerCase()); }}
                className="input font-mono text-xs"
                maxLength={120}
                dir="ltr"
                placeholder="gold-plated-necklace"
              />
            </Field>
          </Panel>

          <Panel title={t("productForm.pricing")} bodyClassName="grid gap-4 p-5 sm:grid-cols-3">
            <Field label={t("productForm.price", { symbol: CURRENCY_SYMBOL })} required error={errors.price}>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={form.price} onChange={setText("price")} className="input" placeholder="0.00" />
            </Field>
            <Field label={t("productForm.oldPrice")} hint={t("productForm.oldPriceHint")} error={errors.old_price}>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={form.old_price} onChange={setText("old_price")} className="input" placeholder={t("account.optional")} />
            </Field>
            <Field
              label={t("productForm.stock")}
              required={form.track_inventory}
              hint={form.track_inventory ? t("productForm.stockHint") : t("productForm.stockUntracked")}
              error={errors.stock}
            >
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.track_inventory ? form.stock : ""}
                placeholder={form.track_inventory ? t("productForm.stockPlaceholder") : t("status.stock.untracked")}
                disabled={!form.track_inventory}
                onChange={setText("stock")}
                className="input disabled:bg-slate-50"
              />
            </Field>
            <p className="text-xs text-slate-500 sm:col-span-3" aria-live="polite">
              {discount > 0
                ? t("productForm.discountNote", { discount, amount: formatPrice(oldPrice - price) })
                : t("productForm.noDiscount")}
            </p>
            <div className="border-t border-slate-100 pt-4 sm:col-span-3">
              <Toggle
                checked={form.track_inventory}
                onChange={set("track_inventory")}
                label={t("productForm.trackStock")}
                description={t("productForm.trackStockText")}
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={t("productForm.visibility")} bodyClassName="space-y-4 p-5">
            <Toggle checked={form.is_active} onChange={set("is_active")} label={t("productForm.visible")} description={t("productForm.visibleText")} />
            <Toggle checked={form.featured} onChange={set("featured")} label={t("productPage.featured")} description={t("productForm.featuredText")} />
            <Toggle checked={form.flash_sale} onChange={set("flash_sale")} label={t("productForm.flash")} description={t("productForm.flashText")} />
          </Panel>

          <Panel title={t("productPage.category")} bodyClassName="p-5">
            <Field label={t("productPage.category")} hint={categories.error ? t("productForm.categoriesError", { error: categories.error }) : t("productForm.categoryHint")}>
              <select value={form.category} onChange={setText("category")} className="input" disabled={categories.loading}>
                <option value="">{t("productForm.noCategory")}</option>
                {catOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
          </Panel>

          <Panel title={t("productForm.images")} bodyClassName="space-y-6 p-5">
            <ImageField value={form.image} onChange={set("image")} label={t("productForm.mainImage")} />
            <GalleryField
              value={form.images}
              onChange={set("images")}
              onMakeMain={(path) => setForm((f) => ({
                ...f,
                image: path,
                images: f.images.map((p) => (p === path ? f.image : p)).filter(Boolean),
              }))}
            />
          </Panel>

          {isEdit && (
            <Panel title={t("form.dangerZone")} bodyClassName="p-5">
              <p className="text-sm text-slate-500">{t("productForm.dangerText")}</p>
              <button type="button" onClick={handleDelete} disabled={saving} className="btn mt-4 bg-rose-50 text-rose-700 hover:bg-rose-100">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> {t("productForm.delete")}
              </button>
            </Panel>
          )}
        </div>
      </div>
    </form>
  );
}
