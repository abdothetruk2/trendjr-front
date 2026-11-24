import React, { useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Home, Store, BadgePercent, Info, Mail, CircleHelp, ChevronDown, UserRound, Package,
  Heart, ShoppingBag, LayoutDashboard, LogOut, LogIn, RotateCw,
} from 'lucide-react';
import Drawer from './Drawer';
import bagLogo from '../data/trend_gr_bag_icon.svg';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getCategoryLabel } from '../utils/product';

const MAIN_LINKS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/shop', label: 'Shop all products', icon: Store },
  { to: '/offers', label: 'Offers & deals', icon: BadgePercent },
  { to: '/about', label: 'About us', icon: Info },
  { to: '/contact', label: 'Contact', icon: Mail },
  { to: '/faq', label: 'Help & FAQ', icon: CircleHelp },
];

const rowClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500 ${
    isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
  }`;

function SectionTitle({ children }) {
  return <p className="px-3 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">{children}</p>;
}

function CountBadge({ value }) {
  if (!value) return null;
  return (
    <span className="ml-auto min-w-[22px] rounded-full bg-primary-500 px-1.5 py-0.5 text-center text-[11px] font-extrabold text-white">
      {value > 99 ? '99+' : value}
    </span>
  );
}

// Store navigation in a slide-in drawer (opened from the header's menu button)
export default function SideMenu({ open, onClose, id = 'site-menu' }) {
  const { user, logout } = useAuth();
  const { count: cartCount } = useCart();
  const { count: savedCount } = useWishlist();
  const [categoriesWanted, setCategoriesWanted] = useState(false);

  // Load the categories the first time the menu opens, not on every page view
  if (open && !categoriesWanted) setCategoriesWanted(true);

  async function handleLogout() {
    onClose();
    await logout();
  }

  const header = (
    <Link to="/" onClick={onClose} className="mr-auto flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-primary-500">
      <span className="logo-mark bg-white ring-1 ring-slate-100">
        <img src={bagLogo} alt="" className="h-8 w-8" />
      </span>
      <span className="text-lg font-extrabold tracking-tight text-secondary">
        Trend<span className="text-primary">Jr</span>
      </span>
    </Link>
  );

  const footer = user ? (
    <div className="p-3">
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-primary-500"
      >
        <LogOut className="h-4.5 w-4.5" aria-hidden="true" /> Sign out
      </button>
    </div>
  ) : null;

  return (
    <Drawer open={open} onClose={onClose} title="Menu" header={header} id={id} footer={footer} closeLabel="Close menu">
      {/* Who is signed in */}
      <div className="border-b border-slate-100 p-4">
        {user ? (
          <Link to="/profile" onClick={onClose} className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-primary-50 to-white p-3 ring-1 ring-primary-100 transition-colors hover:ring-primary-200">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-500 text-base font-extrabold uppercase text-white">
              {(user.username || user.email || '?').charAt(0)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold text-secondary">Hello, {user.username || 'there'}</span>
              <span className="block truncate text-xs text-slate-500">{user.email}</span>
            </span>
          </Link>
        ) : (
          <div className="rounded-2xl bg-secondary p-4 text-white">
            <p className="text-sm font-extrabold">Welcome to Trend Jr</p>
            <p className="mt-1 text-xs text-slate-300">Sign in to follow your orders and keep your favorites.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={onClose} className="btn-primary btn-sm justify-center">
                <LogIn className="h-4 w-4" aria-hidden="true" /> Sign in
              </Link>
              <Link to="/register" onClick={onClose} className="btn-sm inline-flex items-center justify-center rounded-xl bg-white/10 font-bold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20">
                Register
              </Link>
            </div>
          </div>
        )}
      </div>

      <nav aria-label="Menu" className="px-2 pb-4">
        <SectionTitle>Browse</SectionTitle>
        <ul className="space-y-0.5">
          {MAIN_LINKS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} onClick={onClose} className={rowClass}>
                <Icon className="h-4.5 w-4.5 shrink-0 text-slate-400" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <SectionTitle>Categories</SectionTitle>
        {categoriesWanted && <CategoryLinks onNavigate={onClose} />}

        <SectionTitle>Your account</SectionTitle>
        <ul className="space-y-0.5">
          {user && (
            <>
              <li>
                <NavLink to="/profile" onClick={onClose} className={rowClass}>
                  <UserRound className="h-4.5 w-4.5 shrink-0 text-slate-400" aria-hidden="true" /> My account
                </NavLink>
              </li>
              <li>
                <NavLink to="/orders" onClick={onClose} className={rowClass}>
                  <Package className="h-4.5 w-4.5 shrink-0 text-slate-400" aria-hidden="true" /> My orders
                </NavLink>
              </li>
            </>
          )}
          <li>
            <NavLink to="/wishlist" onClick={onClose} className={rowClass}>
              <Heart className="h-4.5 w-4.5 shrink-0 text-slate-400" aria-hidden="true" /> Wishlist
              <CountBadge value={savedCount} />
            </NavLink>
          </li>
          <li>
            <NavLink to="/cart" onClick={onClose} className={rowClass}>
              <ShoppingBag className="h-4.5 w-4.5 shrink-0 text-slate-400" aria-hidden="true" /> Cart
              <CountBadge value={cartCount} />
            </NavLink>
          </li>
          {user?.role === 'admin' && (
            <li>
              <NavLink to="/admin" onClick={onClose} className={rowClass}>
                <LayoutDashboard className="h-4.5 w-4.5 shrink-0 text-primary-500" aria-hidden="true" /> Admin dashboard
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </Drawer>
  );
}

// Top-level categories; the ones with sub-categories can be expanded
function CategoryLinks({ onNavigate }) {
  const { data, loading, error, retry } = useApi('/api/categories');
  const [expanded, setExpanded] = useState(null);

  const tree = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const byOrder = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      getCategoryLabel(a).localeCompare(getCategoryLabel(b));
    return list
      .filter((c) => c.parent_id == null)
      .sort(byOrder)
      .map((parent) => ({
        ...parent,
        children: list.filter((c) => c.parent_id != null && c.parent_id === parent.id).sort(byOrder),
      }));
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-2 px-3 py-1" aria-busy="true" aria-label="Loading categories">
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />)}
      </div>
    );
  }
  if (error) {
    return (
      <button type="button" onClick={retry} className="mx-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700">
        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Couldn&apos;t load categories — retry
      </button>
    );
  }

  return (
    <ul className="space-y-0.5">
      {tree.map((category) => {
        const isOpen = expanded === category.slug;
        const listId = `menu-sub-${category.slug}`;
        return (
          <li key={category._id ?? category.slug}>
            <div className="flex items-center gap-1">
              <NavLink to={`/category/${category.slug}`} onClick={onNavigate} className={(state) => `${rowClass(state)} min-w-0 flex-1`}>
                <span className="truncate">{getCategoryLabel(category)}</span>
              </NavLink>
              {category.children.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : category.slug)}
                  aria-expanded={isOpen}
                  aria-controls={listId}
                  aria-label={`${isOpen ? 'Hide' : 'Show'} ${getCategoryLabel(category)} sub-categories`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-primary-500"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
              )}
            </div>
            {category.children.length > 0 && (
              <div
                id={listId}
                inert={isOpen ? undefined : ''}
                className={`grid motion-reduce:transition-none ${
                  isOpen
                    ? 'visible grid-rows-[1fr] opacity-100 [transition:grid-template-rows_200ms_ease-out,opacity_200ms_ease-out,visibility_0s_linear_0s]'
                    : 'invisible grid-rows-[0fr] opacity-0 [transition:grid-template-rows_200ms_ease-out,opacity_200ms_ease-out,visibility_0s_linear_200ms]'
                }`}
              >
                <ul className="ml-4 min-h-0 overflow-hidden border-l border-slate-100 pl-2">
                  {category.children.map((child) => (
                    <li key={child._id ?? child.slug}>
                      <NavLink
                        to={`/category/${child.slug}`}
                        onClick={onNavigate}
                        className={({ isActive }) => `block truncate rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                          isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {getCategoryLabel(child)}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
