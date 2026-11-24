import useApi from "../src/hooks/useApi";
import useCategoryParam from "../src/hooks/useCategoryParam";
import CategoryStrip from "../src/components/CategoryStrip";
import ProductGrid from "../src/components/ProductGrid";
import { getCategoryLabel } from "../src/utils/product";

export default function ShopPage() {
  const categories = useApi("/api/categories");
  const [category, setCategory] = useCategoryParam();
  const current = Array.isArray(categories.data)
    ? categories.data.find((c) => c.slug === category)
    : null;

  return (
    <main className="min-h-screen bg-surface pb-8">
      <CategoryStrip
        categories={categories.data}
        loading={categories.loading}
        error={categories.error}
        onRetry={categories.retry}
        cat={category}
        setCat={setCategory}
      />
      <div className="container-page pt-8">
        <div className="mb-3 rounded-3xl bg-secondary px-6 py-9 text-white sm:px-10">
          <p className="eyebrow text-primary-200!">Discover something good</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {current ? getCategoryLabel(current) : "Shop all products"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
            Browse our collection of everyday essentials, trending finds, and products worth keeping.
          </p>
        </div>
      </div>
      <ProductGrid id="shop-products" category={category} />
    </main>
  );
}
