import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, Camera, ShoppingBag, Heart, User, LayoutGrid, ChevronDown, LogOut, Menu, LayoutDashboard } from 'lucide-react';
import bagLogo from "../data/trend_gr_bag_icon.svg";
import SideMenu from './SideMenu';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice } from '../utils/product';

export const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/offers', label: 'Offers' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
];

const navClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
    isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
  }`;

export default function Header() {

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { count, subtotal } = useCart();
  const { count: savedCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the side menu whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  // Keep the box in sync with the search page's ?q=
  const urlQuery = location.pathname === '/search'
    ? new URLSearchParams(location.search).get('q') || ''
    : '';
  const [term, setTerm] = useState(urlQuery);

  useEffect(() => {
    setTerm(urlQuery);
  }, [urlQuery]);

  function handleSearch(e) {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="container-page py-3 flex items-center gap-3 sm:gap-5">
        {/* Side menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-haspopup="dialog"
          className="-ml-1.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <Menu className="h-5.5 w-5.5" aria-hidden="true" />
        </button>

        {/* Brand Wordmark */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group" aria-label="Trend Jr Home">
          <div className="logo-mark bg-white group-hover:scale-105 transition-transform">
            <img src={bagLogo} alt="" className="w-9 h-9" />
          </div>
          <div className="hidden min-[400px]:block text-left leading-none">
            <div className="text-xl font-extrabold tracking-tight text-secondary">
              Trend<span className="text-primary">Jr</span>
            </div>
            <div className="eyebrow text-[10px] tracking-wider">Direct Market</div>
          </div>
        </Link>

        {/* Categories Button */}
        <Link
          to="/shop"
          className="btn-light hidden md:inline-flex gap-2 px-3.5 font-semibold shrink-0"
        >
          <LayoutGrid className="w-4 h-4 text-primary" />
          Categories
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </Link>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-2xl">
          <form className="relative flex items-center" role="search" onSubmit={handleSearch}>
            <Search className="input-icon" />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search gadgets, fashion, smart home, deals..."
              aria-label="Search products"
              className="input-with-icon pr-24 rounded-full bg-slate-100 border-2 border-transparent focus:bg-white [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="button"
              title="Search by image"
              className="btn-icon absolute right-11 hover:text-primary-600 hover:bg-primary-50"
              aria-label="Search by image"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="btn-secondary btn-sm absolute right-1.5 px-3.5 py-1.5 rounded-full"
            >
              Go
            </button>
          </form>
        </div>

        {/* Right User Actions */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {/* Account */}
          <Link
            to={user ? '/profile' : '/login'}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-left"
          >
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
              user ? 'bg-primary-500 border-primary-500 text-white text-xs font-extrabold uppercase' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              {user ? (user.username || user.email || '?').charAt(0) : <User className="w-4 h-4" />}
            </div>
            <div className="hidden lg:block leading-tight">
              <div className="text-[11px] text-slate-500">{user ? `Hello, ${user.username || 'there'}` : 'Hello'}</div>
              <div className="text-xs font-bold text-slate-900">{user ? 'My account' : 'Sign in / Register'}</div>
            </div>
          </Link>

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}

          {/* Admin dashboard (admins only; the server checks the role again) */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="p-2.5 rounded-xl hover:bg-primary-50 text-primary-600 transition-colors"
              aria-label="Admin dashboard"
              title="Admin dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Link>
          )}

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
            aria-label={savedCount ? `Wishlist, ${savedCount} saved` : 'Wishlist'}
          >
            <Heart className={`w-5 h-5 ${savedCount ? 'fill-rose-500 text-rose-500' : ''}`} />
            {savedCount > 0 && (
              <span className="count-badge top-0.5 right-0.5 bg-rose-500">{savedCount > 99 ? '99+' : savedCount}</span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="btn-secondary gap-2.5 pl-3 pr-3.5 py-2 hover:bg-primary-600 shadow-sm"
            aria-label={count ? `Cart, ${count} items` : 'Cart (empty)'}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="count-badge -top-1.5 -right-2 border-2 border-secondary">{count > 99 ? '99+' : count}</span>
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <div className="text-[10px] font-normal text-slate-300">Cart</div>
              <div className="text-xs font-bold">{count ? formatPrice(subtotal) : 'Empty'}</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Page links */}
      <div className="border-t border-slate-100">
        <nav className="container-page flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
              {link.label}
            </NavLink>
          ))}

          {/* Phones: the account buttons above are hidden, so sign in/out lives here */}
          <div className="ml-auto pl-2 sm:hidden">
            {user ? (
              <button type="button" onClick={handleLogout} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 whitespace-nowrap">
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Sign out
              </button>
            ) : (
              <NavLink to="/login" className={navClass}>Sign in</NavLink>
            )}
          </div>
        </nav>
      </div>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} id="site-menu" />
    </header>
  );
}
