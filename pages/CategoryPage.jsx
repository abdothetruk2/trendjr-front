import { Link, useParams } from "react-router-dom";
import { ArrowRight, RotateCw } from "lucide-react";
import useCategories from "../src/hooks/useCategories";
import CategorySidebar from "../src/components/CategorySidebar";
import ProductGrid from "../src/components/ProductGrid";
import { getCategoryLabel, getText } from "../src/utils/product";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta, toMetaDescription } from "../src/i18n/seo";

const categoryHref = (slug) => (slug === "all" ? "/shop" : `/category/${encodeURIComponent(slug)}`);

// /category/:id — :id can be the category slug, numeric id or MongoDB _id
export default function CategoryPage() {
  const { id } = useParams();
  const { data, loading, error, retry } = useCategories();
  const category = Array.isArray(data)
    ? data.find((c) => c.slug === id || c._id === id || String(c.id) === id)
    : null;
  const { t } = useLanguage();
  const description = category ? getText(category.description) || getText(category.subtitle) : "";
  usePageMeta({
    title: category ? getCategoryLabel(category) : loading ? "" : t("categoryPage.notFound"),
    description: category ? toMetaDescription(description || t("categoryPage.metaDescription", { name: getCategoryLabel(category) })) : "",
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-surface py-8" aria-busy="true">
        <div className="container-page">
          <div className="h-48 rounded-3xl bg-slate-200 animate-pulse" />
        </div>
      </main>
    );
  }

  if (error || !category) {
    return (
      <main className="min-h-[60vh] bg-surface py-16">
        <div className="container-page">
          <div className="card mx-auto max-w-lg p-8 text-center" role="alert">
            <h1 className="text-xl font-black text-secondary">
              {error ? t("categoryPage.loadError") : t("categoryPage.notFound")}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{error || t("categoryPage.notFoundText")}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {error && (
                <button type="button" onClick={retry} className="btn-primary">
                  <RotateCw size={16} aria-hidden="true" /> {t("common.retry")}
                </button>
              )}
              <Link to="/shop" className="btn-outline">{t("categoryPage.browseAll")}</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface py-6 sm:py-8">
      <div className="container-page">
        <div className="relative mb-3 overflow-hidden rounded-3xl bg-secondary px-7 py-10 text-white sm:px-12 sm:py-12">
          <div className="absolute inset-y-0 end-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(160,82,201,0.35),transparent_60%)] md:block" aria-hidden="true" />
          <p className="eyebrow text-primary-200!">{t("categoryPage.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">{getCategoryLabel(category)}</h1>
          {description && (
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">{description}</p>
          )}
          <Link to="/shop" className="relative mt-5 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">
            {t("categoryPage.browseAll")} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-4 grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <CategorySidebar active={category.slug} hrefFor={categoryHref} />
          <ProductGrid id="category-products" category={category.slug} embedded />
        </div>
      </div>
    </main>
  );
}
