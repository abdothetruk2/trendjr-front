import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, Heart, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import useLanguage from '../i18n/useLanguage';

const ITEMS = [
  { to: '/', label: 'nav.home', icon: Home, end: true },
  { to: '/shop', label: 'nav.categories', icon: LayoutGrid },
  { to: '/cart', label: 'nav.cart', icon: ShoppingBag },
  { to: '/wishlist', label: 'nav.saved', icon: Heart },
  { to: '/login', label: 'nav.account', icon: User },
];

// Phone-only bottom navigation (the footer leaves room for it with pb-20)
export default function MobileBottomNav() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { count } = useCart();
  const { count: savedCount } = useWishlist();

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 grid grid-cols-5"
      aria-label={t('nav.mobileNav')}
    >
      {ITEMS.map(({ to: path, label, icon: Icon, end }) => {
        const to = path === '/login' && user ? '/profile' : path; // signed in: Account opens the account page
        return (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
              isActive ? 'text-primary-600' : 'text-slate-700 hover:text-slate-950'
            }`
          }
        >
          <span className="relative">
            <Icon className="w-5 h-5" aria-hidden="true" />
            {path === '/cart' && count > 0 && (
              <span className="count-badge -top-1.5 -end-2.5 min-w-[16px] h-4 text-[9px]">{count > 99 ? '99+' : count}</span>
            )}
            {path === '/wishlist' && savedCount > 0 && (
              <span className="count-badge -top-1.5 -end-2.5 min-w-[16px] h-4 text-[9px] bg-rose-500">{savedCount > 99 ? '99+' : savedCount}</span>
            )}
          </span>
          {t(label)}
        </NavLink>
        );
      })}
    </nav>
  );
}
