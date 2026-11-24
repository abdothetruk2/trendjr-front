import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Trash2, Languages, ExternalLink } from "lucide-react";
import useApi from "../../src/hooks/useApi";
import api, { getErrorMessage } from "../../src/services/api";
import { useToast } from "../../src/context/ToastContext";
import { useConfirm } from "../../src/components/admin/ConfirmDialog";
import ImageField from "../../src/components/admin/ImageField";
import GalleryField from "../../src/components/admin/GalleryField";
import { Field, Panel, Toggle, ErrorState } from "../../src/components/admin/AdminUI";
import { categoryOptions } from "../../src/utils/categories";
import { formatPrice, toNumber } from "../../src/utils/product";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const EMPTY = {
  name: { en: "", de: "", ar: "" },
  description: { en: "", de: "", ar: "" },
  brand: "",
  slug: "",
  sku: "",
  price: "",
  old_price: "",
  stock: "0",
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

const localized = (value) => ({
  en: typeof value === "string" ? value : value?.en || "",
  de: value?.de || "",
  ar: value?.ar || "",
});

// API product -> form values (all strings, so the inputs stay controlled)
function toForm(product) {
  const oldPrice = toNumber(product.old_price);
  return {
    name: localized(product.name),
    description: localized(product.description),
    brand: product.brand || "",
    slug: product.slug || "",
    sku: product.sku || "",
    price: product.price != null ? String(toNumber(product.price)) : "",
    old_price: oldPrice > 0 ? String(oldPrice) : "",
    stock: String(toNumber(product.stock)),
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
  if (!form.name.en.trim()) errors.name = "Enter the product name.";
  const price = Number(form.price);
  if (form.price === "" || !Number.isFinite(price) || price < 0) errors.price = "Enter a price of 0 or more.";
  if (form.old_price !== "") {
    const oldPrice = Number(form.old_price);
    if (!Number.isFinite(oldPrice) || oldPrice < 0) errors.old_price = "Enter a valid amount, or leave it empty.";
    else if (!errors.price && oldPrice <= price) errors.old_price = "The compare-at price must be higher than the price.";
  }
  const stock = Number(form.stock);
  if (form.stock === "" || !Number.isInteger(stock) || stock < 0) errors.stock = "Enter a whole number, 0 or more.";
  if (form.slug && !SLUG_PATTERN.test(form.slug)) errors.slug = "Use lowercase letters, numbers and single hyphens.";
  if (form.sku.length > 64) errors.sku = "At most 64 characters.";
  return errors;
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const confirm = useConfirm();
  const backTo = `/admin/products${location.state?.from || ""}`;

  const productReq = useApi(isEdit ? `/api/admin/products/${encodeURIComponent(id)}` : null);
  const categories = useApi("/api/admin/categories");
  const catOptions = useMemo(() => categoryOptions(categories.data), [categories.data]);

  const [form, setForm] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [showTranslations, setShowTranslations] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  // Fill the form once the product has loaded
  useEffect(() => {
    if (!productReq.data) return;
    const values = toForm(productReq.data);
    setForm(values);
    setInitial(values);
    if (values.name.de || values.name.ar || values.description.de || values.description.ar) setShowTranslations(true);
  }, [productReq.data]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const price = Number(form.price);
  const oldPrice = Number(form.old_price);
  const discount = form.old_price !== "" && oldPrice > price && price >= 0 ? Math.round((1 - price / oldPrice) * 100) : 0;

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setText = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setLocalized = (key, lang) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: { ...f[key], [lang]: value } };
      if (key === "name" && lang === "en" && !slugTouched) next.slug = slugify(value);
      return next;
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const payload = {
      name: { en: form.name.en.trim(), de: form.name.de.trim(), ar: form.name.ar.trim() },
      description: { en: form.description.en.trim(), de: form.description.de.trim(), ar: form.description.ar.trim() },
      brand: form.brand.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      old_price: form.old_price === "" ? null : Number(form.old_price),
      discount,
      stock: Number(form.stock),
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
        toast.success("Changes saved");
      } else {
        await api.post("/api/products", payload);
        toast.success("Product created");
      }
      setInitial(form);
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
      title: "Delete this product?",
      message: "It will be removed from the catalog. Past orders keep their own copy of it. If you might sell it again, hide it instead.",
      confirmLabel: "Delete product",
      tone: "danger",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await api.delete(`/api/products/${encodeURIComponent(id)}`);
      toast.success("Product deleted");
      navigate(backTo);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (dirty && !(await confirm({ title: "Discard your changes?", message: "The changes you made on this page will be lost.", confirmLabel: "Discard", tone: "danger" }))) return;
    navigate(backTo);
  }

  if (isEdit && productReq.loading && !productReq.data) {
    return (
      <div className="grid min-h-[50vh] place-items-center" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-primary-500" aria-hidden="true" />
        <span className="sr-only">Loading product…</span>
      </div>
    );
  }
  if (isEdit && productReq.error) {
    return (
      <div className="card">
        <ErrorState
          message={productReq.status === 404 ? "This product doesn't exist (it may have been deleted)." : productReq.error}
          onRetry={productReq.status === 404 ? undefined : productReq.retry}
        />
        <div className="pb-8 text-center"><Link to={backTo} className="link-primary text-sm">Back to products</Link></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={handleCancel} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Back to products">
            <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-tight text-secondary">
              {isEdit ? form.name.en || "Edit product" : "Add product"}
            </h1>
            <p className="text-sm text-slate-500">{isEdit ? `Product #${id}` : "Fill in the details and save to publish it."}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEdit && initial.is_active && (
            <a href={`/product/${id}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> View in store
            </a>
          )}
          <button type="button" onClick={handleCancel} className="btn-outline">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {isEdit ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>

      {serverError && (
        <div className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{serverError}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Basic information" bodyClassName="space-y-4 p-5">
            <Field label="Product name" required error={errors.name}>
              <input value={form.name.en} onChange={setLocalized("name", "en")} className="input" maxLength={200} placeholder="e.g. Gold-plated stainless steel necklace" />
            </Field>
            <Field label="Description" hint="Shown on the product page. Line breaks are kept.">
              <textarea value={form.description.en} onChange={setLocalized("description", "en")} className="input min-h-36" maxLength={5000} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand">
                <input value={form.brand} onChange={setText("brand")} className="input" maxLength={100} />
              </Field>
              <Field label="SKU" hint="Optional, must be unique." error={errors.sku}>
                <input value={form.sku} onChange={setText("sku")} className="input" maxLength={64} />
              </Field>
            </div>
            <Field label="URL slug" hint={isEdit ? "Changing it doesn't break old links: product pages use the numeric id." : "Filled in from the name; you can change it."} error={errors.slug}>
              <input
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); set("slug")(e.target.value.toLowerCase()); }}
                className="input font-mono text-xs"
                maxLength={120}
                placeholder="gold-plated-necklace"
              />
            </Field>

            <div className="rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setShowTranslations((v) => !v)}
                aria-expanded={showTranslations}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-slate-700"
              >
                <span className="inline-flex items-center gap-2"><Languages className="h-4 w-4 text-slate-400" aria-hidden="true" /> Translations (German, Arabic)</span>
                <span className="text-xs font-semibold text-primary-600">{showTranslations ? "Hide" : "Show"}</span>
              </button>
              {showTranslations && (
                <div className="grid gap-4 border-t border-slate-100 p-4 sm:grid-cols-2">
                  <Field label="Name (German)">
                    <input value={form.name.de} onChange={setLocalized("name", "de")} className="input" lang="de" maxLength={200} />
                  </Field>
                  <Field label="Name (Arabic)">
                    <input value={form.name.ar} onChange={setLocalized("name", "ar")} className="input" lang="ar" dir="rtl" maxLength={200} />
                  </Field>
                  <Field label="Description (German)">
                    <textarea value={form.description.de} onChange={setLocalized("description", "de")} className="input min-h-28" lang="de" maxLength={5000} />
                  </Field>
                  <Field label="Description (Arabic)">
                    <textarea value={form.description.ar} onChange={setLocalized("description", "ar")} className="input min-h-28" lang="ar" dir="rtl" maxLength={5000} />
                  </Field>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Pricing & stock" bodyClassName="grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Price (USD)" required error={errors.price}>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={form.price} onChange={setText("price")} className="input" placeholder="0.00" />
            </Field>
            <Field label="Compare-at price" hint="The old price, shown crossed out." error={errors.old_price}>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={form.old_price} onChange={setText("old_price")} className="input" placeholder="Optional" />
            </Field>
            <Field label="Stock" hint="0 = not specified (still for sale)." error={errors.stock}>
              <input type="number" inputMode="numeric" min="0" step="1" value={form.stock} onChange={setText("stock")} className="input" />
            </Field>
            <p className="text-xs text-slate-500 sm:col-span-3" aria-live="polite">
              {discount > 0
                ? <>Customers see <strong className="text-emerald-600">−{discount}%</strong> and save {formatPrice(oldPrice - price)}.</>
                : "No discount shown (add a compare-at price higher than the price to show one)."}
            </p>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Visibility" bodyClassName="space-y-4 p-5">
            <Toggle checked={form.is_active} onChange={set("is_active")} label="Visible in the store" description="Hidden products can't be found or bought." />
            <Toggle checked={form.featured} onChange={set("featured")} label="Featured" description="Marks the product as a highlight." />
            <Toggle checked={form.flash_sale} onChange={set("flash_sale")} label="Flash sale" description="Shows it in Flash Deals on the homepage." />
          </Panel>

          <Panel title="Category" bodyClassName="p-5">
            <Field label="Category" hint={categories.error ? `Couldn't load categories: ${categories.error}` : "Products of a sub-category also appear in its parent."}>
              <select value={form.category} onChange={setText("category")} className="input" disabled={categories.loading}>
                <option value="">No category</option>
                {catOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
          </Panel>

          <Panel title="Images" bodyClassName="space-y-6 p-5">
            <ImageField value={form.image} onChange={set("image")} label="Main image" />
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
            <Panel title="Danger zone" bodyClassName="p-5">
              <p className="text-sm text-slate-500">Deleting removes the product for good. Hiding it is usually the better choice.</p>
              <button type="button" onClick={handleDelete} disabled={saving} className="btn mt-4 bg-rose-50 text-rose-700 hover:bg-rose-100">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete product
              </button>
            </Panel>
          )}
        </div>
      </div>
    </form>
  );
}
