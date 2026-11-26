import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, LayoutGrid, ChevronDown, LogOut, Menu, LayoutDashboard } from 'lucide-react';
import bagLogo from "../data/trend_gr_bag_icon.svg";
import SideMenu from './SideMenu';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatMoney } from '../utils/product';
import { convertLines, displayCurrency } from '../currency';
import useLanguage from '../i18n/useLanguage';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySwitcher from './CurrencySwitcher';

export const NAV_LINKS = [
  { to: '/', label: 'nav.home', end: true },
  { to: '/shop', label: 'nav.shop' },
  { to: '/offers', label: 'nav.offers' },
  { to: '/about', label: 'nav.about' },
  { to: '/contact', label: 'nav.contact' },
  { to: '/faq', label: 'nav.faq' },
];

const navClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
    isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
  }`;

export default function Header() {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { count, buyable } = useCart();
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
          aria-label={t('header.openMenu')}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-haspopup="dialog"
          className="-ms-1.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <Menu className="h-5.5 w-5.5" aria-hidden="true" />
        </button>

        {/* Brand Wordmark */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group" aria-label={t('header.homeLink')}>
          <div className="logo-mark bg-white group-hover:scale-105 transition-transform">
            <img src={bagLogo} alt="" className="w-9 h-9" />
          </div>
          <div className="hidden min-[400px]:block text-start leading-none">
            <div className="text-xl font-extrabold tracking-tight text-secondary">
              Trend<span className="text-primary">Jr</span>
            </div>
            <div className="eyebrow text-[10px] tracking-wider">{t('header.tagline')}</div>
          </div>
        </Link>

        {/* Categories: opens the side menu, which lists every category */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-haspopup="dialog"
          aria-controls="site-menu"
          className="btn-light hidden lg:inline-flex gap-2 px-3.5 font-semibold shrink-0"
        >
          <LayoutGrid className="w-4 h-4 text-primary" aria-hidden="true" />
          {t('nav.categories')}
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
        </button>

        {/* Search Bar */}
        <div className="relative min-w-0 flex-1 max-w-2xl">
          <form className="relative flex items-center" role="search" onSubmit={handleSearch}>
            <Search className="input-icon" aria-hidden="true" />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t('header.searchPlaceholder')}
              aria-label={t('header.searchLabel')}
              enterKeyHint="search"
              className="input-with-icon pe-16 rounded-full bg-slate-100 border-2 border-transparent focus:bg-white [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="submit"
              className="btn-secondary btn-sm absolute end-1.5 px-3.5 py-1.5 rounded-full"
            >
              {t('header.go')}
            </button>
          </form>
        </div>

        {/* Right User Actions */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <CurrencySwitcher />
          {/* Account */}
          <Link
            to={user ? '/profile' : '/login'}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-start"
          >
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
              user ? 'bg-primary-500 border-primary-500 text-white text-xs font-extrabold uppercase' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              {user ? (user.username || user.email || '?').charAt(0) : <User className="w-4 h-4" />}
            </div>
            <div className="hidden lg:block leading-tight">
              <div className="text-[11px] text-slate-500">{user ? t('header.helloName', { name: user.username || t('header.there') }) : t('header.hello')}</div>
              <div className="text-xs font-bold text-slate-900">{user ? t('nav.myAccount') : t('header.signInRegister')}</div>
            </div>
          </Link>

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
              aria-label={t('nav.signOut')}
              title={t('nav.signOut')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}

          {/* Admin dashboard (admins only; the server checks the role again) */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="p-2.5 rounded-xl hover:bg-primary-50 text-primary-600 transition-colors"
              aria-label={t('nav.adminDashboard')}
              title={t('nav.adminDashboard')}
            >
              <LayoutDashboard className="w-5 h-5" />
            </Link>
          )}

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
            aria-label={savedCount ? t('header.wishlistCount', { count: savedCount }) : t('nav.wishlist')}
          >
            <Heart className={`w-5 h-5 ${savedCount ? 'fill-rose-500 text-rose-500' : ''}`} />
            {savedCount > 0 && (
              <span className="count-badge top-0.5 end-0.5 bg-rose-500">{savedCount > 99 ? '99+' : savedCount}</span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="btn-secondary gap-2.5 ps-3 pe-3.5 py-2 hover:bg-primary-600 shadow-sm"
            aria-label={count ? t('header.cartCount', { count }) : t('header.cartEmpty')}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="count-badge -top-1.5 -end-2 border-2 border-secondary">{count > 99 ? '99+' : count}</span>
            </div>
            <div className="hidden lg:block text-start leading-tight">
              <div className="text-[10px] font-normal text-slate-300">{t('nav.cart')}</div>
              <div className="text-xs font-bold">{count ? formatMoney(convertLines(buyable), displayCurrency()) : t('header.empty')}</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Page links */}
      <div className="border-t border-slate-100">
        <nav className="container-page flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5" aria-label={t('header.mainNav')}>
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
              {t(link.label)}
            </NavLink>
          ))}

          {/* Phones: the account buttons above are hidden, so sign in/out lives here */}
          <div className="ms-auto flex items-center ps-2 sm:hidden">
            <LanguageSwitcher />
            <CurrencySwitcher />
            {user ? (
              <button type="button" onClick={handleLogout} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 whitespace-nowrap">
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> {t('nav.signOut')}
              </button>
            ) : (
              <NavLink to="/login" className={navClass}>{t('nav.signIn')}</NavLink>
            )}
          </div>
        </nav>
      </div>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} id="site-menu" />
    </header>
  );
}
