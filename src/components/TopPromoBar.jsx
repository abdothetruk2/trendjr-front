import React from 'react';
import { Truck, ShieldCheck, TicketPercent, PackageSearch, HelpCircle, Smartphone, Store } from 'lucide-react';

export default function TopPromoBar() {
  return (
    <div className="bg-secondary text-slate-200 text-xs border-b border-white/10">
      <div className="container-page py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left value promises */}
        <div className="flex items-center flex-wrap gap-x-5 gap-y-1">
          <button
            type="button"
            className="flex items-center gap-1.5 link-muted"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-white">Free Shipping</span>
            <span className="hidden sm:inline text-slate-400">on all orders ›</span>
          </button>

          <button
            type="button"
            className="hidden md:flex items-center gap-1.5 link-muted"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-white">Buyer Protected</span>
            <span className="text-slate-400">100% guarantee</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-400/40 text-primary-200 px-2.5 py-0.5 rounded-full transition-colors"
          >
            <TicketPercent className="w-3.5 h-3.5 text-primary-400" />
            <span className="font-semibold text-white">10% OFF</span>
            <span className="hidden sm:inline">Code: TRENDJR10</span>
          </button>
        </div>

        {/* Right utility links */}
        <div className="hidden lg:flex items-center gap-4 text-slate-300">
          <button
            type="button"
            className="flex items-center gap-1 link-muted"
          >
            <PackageSearch className="w-3.5 h-3.5" />
            Track Order
          </button>
          <button
            type="button"
            className="flex items-center gap-1 link-muted"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Help Center
          </button>
          <button
            type="button"
            className="flex items-center gap-1 link-muted"
          >
            <Store className="w-3.5 h-3.5" />
            Sell on Trend Jr
          </button>
          <button
            type="button"
            className="flex items-center gap-1 link-muted"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Get the App
            <span className="ml-0.5 px-1.5 py-0.5 bg-emerald-500 text-secondary font-bold text-[10px] rounded">
              NEW
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
