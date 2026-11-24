import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import ProductGrid from "../src/components/ProductGrid";

// /search?q=... — results come from GET /api/products?search=
export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="mb-6">
          <p className="eyebrow">Find your next favorite</p>
          <h1 className="mt-2 text-3xl font-black text-secondary">Search results</h1>
        </div>
        <SearchForm key={q} initial={q} />
        <p className="mb-2 text-sm text-slate-500">
          {q ? <>Results for <strong className="text-secondary">“{q}”</strong></> : "Type what you are looking for above."}
        </p>
      </div>
      {q && <ProductGrid id="search-results" search={q} />}
    </main>
  );
}

function SearchForm({ initial }) {
  const navigate = useNavigate();
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
          placeholder="Search products..."
          aria-label="Search term"
        />
      </div>
      <button type="submit" className="btn-primary">Search</button>
    </form>
  );
}
