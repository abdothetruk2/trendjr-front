import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import ProductCard from './ProductCard';

const TABS = ['Explore All', 'Best-Selling', 'New Arrivals', 'Top Rated'];

export default function ProductGrid({ products,cat_id,filter }) {
  return (
    <section id="discover-grid" className="container-page py-5">
      {/* Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((label, i) => (
            <button key={label} type="button" className={`tab ${i === 0 ? 'tab-active' : 'tab-idle'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Price Cap */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Under $250</span>
            <input
              type="range"
              min="15"
              max="250"
              step="5"
              defaultValue="250"
              className="w-20 accent-primary cursor-pointer"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            defaultValue="featured"
            className="input w-auto px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="featured">Sort: Recommended</option>
            <option value="popular">Most Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="discount">Biggest Discount</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4 text-muted">
        <span>
          Showing <strong className="text-slate-800">{products.length}</strong> curated items
        </span>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard key={product._id || product.id} product={product} cat_id2={cat_id}  filter={filter}  />

        ))}
      </div>
    </section>
  );
}
