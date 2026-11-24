import React from 'react';
import { Flame, Star, ShoppingCart, Heart, ChevronRight } from 'lucide-react';

export default function FlashDeals({ products }) {
  return (
    <section id="flash-deals" className="container-page py-5">
      <div className="card p-5 sm:p-6">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="icon-box-primary w-8 h-8">
                <Flame className="w-5 h-5 fill-primary text-primary" />
              </div>
              <div>
                <h2 className="heading text-lg sm:text-xl leading-none">Flash Deals</h2>
                <p className="text-muted mt-0.5">Today&apos;s lightning drops</p>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-1.5 pl-1">
              <span className="text-xs font-semibold text-slate-500 mr-1">Ends in</span>
              <span className="min-w-[28px] text-center px-1.5 py-1 rounded-lg bg-secondary text-white font-mono text-xs font-bold">02</span>
              <span className="font-bold text-slate-400">:</span>
              <span className="min-w-[28px] text-center px-1.5 py-1 rounded-lg bg-secondary text-white font-mono text-xs font-bold">47</span>
              <span className="font-bold text-slate-400">:</span>
              <span className="min-w-[28px] text-center px-1.5 py-1 rounded-lg bg-secondary text-white font-mono text-xs font-bold">33</span>
            </div>
          </div>

          <a href="#discover-grid" className="link-primary text-xs sm:text-sm">
            See all deals <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {products.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-md bg-white overflow-hidden flex flex-col transition-all"
            >
              <div className="relative aspect-square bg-slate-100 overflow-hidden">
                <img src={item.image} alt={item.title} loading="lazy" className="product-img" />
                <span className="badge-primary absolute top-2 left-2">-{item.discount}%</span>
                <button
                  type="button"
                  className="btn-wish top-2 right-2 w-7 h-7"
                  aria-label="Toggle wishlist"
                >
                  <Heart className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-left text-xs font-semibold text-slate-800 line-clamp-2 hover:text-primary-600 leading-snug cursor-pointer">
                    {item.title}
                  </h3>

                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="price text-base">${item.price.toFixed(2)}</span>
                    <span className="price-old text-[11px]">${item.originalPrice.toFixed(2)}</span>
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-slate-700">{item.rating}</span>
                    <span>· {item.sold} sold</span>
                  </div>
                </div>

                {/* Claimed Stock Progress */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                    <span>{item.claimedPercent}% claimed</span>
                    <span className="text-primary-600">Fast selling</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                      style={{ width: `${item.claimedPercent}%` }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-light btn-sm mt-2.5 w-full py-1.5 rounded-lg hover:bg-secondary hover:text-white"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
