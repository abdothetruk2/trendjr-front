import React from 'react';
import { Home, LayoutGrid, ShoppingBag, Heart, User } from 'lucide-react';

export default function MobileBottomNav() {
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 grid grid-cols-5">
      <button
        type="button"
        className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-700"
      >
        <Home className="w-5 h-5" />
        Home
      </button>
      <button
        type="button"
        className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-700"
      >
        <LayoutGrid className="w-5 h-5" />
        Categories
      </button>
      <button
        type="button"
        className="relative flex flex-col items-center gap-0.5 text-[10px] font-bold text-primary-600"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
        </div>
        Cart
      </button>
      <button
        type="button"
        className="relative flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-700"
      >
        <div className="relative">
          <Heart className="w-5 h-5" />
          <span className="count-badge -top-1 -right-2 min-w-[16px] h-4 text-[9px] bg-secondary">
            2
          </span>
        </div>
        Saved
      </button>
      <button
        type="button"
        className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-700"
      >
        <User className="w-5 h-5" />
        Account
      </button>
    </nav>
  );
}
