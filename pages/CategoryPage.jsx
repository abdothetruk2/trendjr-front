import { Link, useParams } from "react-router-dom";
import { ArrowRight, RotateCw } from "lucide-react";
import useApi from "../src/hooks/useApi";
import ProductGrid from "../src/components/ProductGrid";
import { getCategoryLabel, getText } from "../src/utils/product";

// /category/:id — :id can be the category slug, numeric id or MongoDB _id
export default function CategoryPage() {
  const { id } = useParams();
  const { data, loading, error, retry } = useApi("/api/categories");
  const category = Array.isArray(data)
    ? data.find((c) => c.slug === id || c._id === id || String(c.id) === id)
    : null;

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
              {error ? "We couldn't load this category" : "Category not found"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{error || "It may have been removed or the link is wrong."}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {error && (
                <button type="button" onClick={retry} className="btn-primary">
                  <RotateCw size={16} /> Try again
                </button>
              )}
              <Link to="/shop" className="btn-outline">Browse all products</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const description = getText(category.description) || getText(category.subtitle);

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="relative mb-3 overflow-hidden rounded-3xl bg-secondary px-7 py-12 text-white sm:px-12">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(160,82,201,0.35),transparent_60%)] md:block" />
          <p className="eyebrow text-primary-200!">Explore collection</p>
          <h1 className="mt-2 text-4xl font-black">{getCategoryLabel(category)}</h1>
          {description && (
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">{description}</p>
          )}
          <Link to="/shop" className="relative mt-5 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">
            Browse all products <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      <ProductGrid id="category-products" category={category.slug} />
    </main>
  );
}
