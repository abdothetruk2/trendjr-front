import useCategories from "../src/hooks/useCategories";
import useCategoryParam from "../src/hooks/useCategoryParam";
import CategoryStrip from "../src/components/CategoryStrip";
import CategorySidebar from "../src/components/CategorySidebar";
import ProductGrid from "../src/components/ProductGrid";
import { getCategoryLabel, getText } from "../src/utils/product";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta, toMetaDescription } from "../src/i18n/seo";

const shopHref = (slug) => (slug === "all" ? "/shop" : `/shop?category=${encodeURIComponent(slug)}`);

export default function ShopPage() {
  const categories = useCategories();
  const [category, setCategory] = useCategoryParam();
  const current = Array.isArray(categories.data)
    ? categories.data.find((c) => c.slug === category)
    : null;
  const { t } = useLanguage();
  const title = current ? getCategoryLabel(current) : t("shop.title");
  usePageMeta({
    title,
    description: current ? toMetaDescription(getText(current.description) || getText(current.subtitle) || t("shop.text")) : t("shop.metaDescription"),
  });

  return (
    <main className="min-h-screen bg-surface pb-8">
      {/* Phones/tablets keep the category pills; wide screens use the sidebar */}
      <div className="lg:hidden">
        <CategoryStrip
          categories={categories.data}
          loading={categories.loading}
          error={categories.error}
          onRetry={categories.retry}
          cat={category}
          setCat={setCategory}
        />
      </div>
      <div className="container-page pt-6 sm:pt-8">
        <div className="mb-3 rounded-3xl bg-secondary px-6 py-8 text-white sm:px-10 sm:py-9">
          <p className="eyebrow text-primary-200!">{t("shop.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
            {t("shop.text")}
          </p>
        </div>
        <div className="mt-4 grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <CategorySidebar active={category} hrefFor={shopHref} />
          <ProductGrid id="shop-products" category={category} embedded />
        </div>
      </div>
    </main>
  );
}
