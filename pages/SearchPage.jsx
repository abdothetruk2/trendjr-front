import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import ProductGrid from "../src/components/ProductGrid";
import useLanguage from "../src/i18n/useLanguage";
import { usePageMeta } from "../src/i18n/seo";

// /search?q=... — results come from GET /api/products?search=
export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const { t } = useLanguage();
  usePageMeta({ title: q ? t("search.metaTitle", { q }) : t("search.title") });

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="mb-6">
          <p className="eyebrow">{t("search.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black text-secondary">{t("search.title")}</h1>
        </div>
        <SearchForm key={q} initial={q} />
        <p className="mb-2 text-sm text-slate-500">
          {q ? <>{t("search.resultsFor")} <strong className="text-secondary">“<bdi>{q}</bdi>”</strong></> : t("search.hint")}
        </p>
      </div>
      {q && <ProductGrid id="search-results" search={q} />}
    </main>
  );
}

function SearchForm({ initial }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [term, setTerm] = useState(initial);

  function handleSubmit(e) {
    e.preventDefault();
    const value = term.trim();
    if (value) navigate(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="mb-4 flex gap-3">
      <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-primary-500">
        <Search className="text-primary-500" size={18} aria-hidden="true" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="w-full bg-transparent py-3 text-sm outline-none"
          placeholder={t("search.placeholder")}
          aria-label={t("search.term")}
        />
      </div>
      <button type="submit" className="btn-primary">{t("search.button")}</button>
    </form>
  );
}
