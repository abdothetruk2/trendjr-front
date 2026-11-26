import React, { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Boxes, FolderTree, ShoppingCart, Users, TicketPercent, Settings,
  Menu, Store, LogOut, Loader2,
} from 'lucide-react';
import Drawer from '../Drawer';
import bagLogo from '../../data/trend_gr_bag_icon.svg';
import { useAuth } from '../../context/AuthContext';
import useLanguage from '../../i18n/useLanguage';
import LanguageSwitcher from '../LanguageSwitcher';

const SECTIONS = [
  { title: 'overview', items: [{ to: '/admin', label: 'dashboard', icon: LayoutDashboard, end: true }] },
  {
    title: 'catalog',
    items: [
      { to: '/admin/products', label: 'products', icon: Package },
      { to: '/admin/inventory', label: 'inventory', icon: Boxes },
      { to: '/admin/categories', label: 'categories', icon: FolderTree },
    ],
  },
  {
    title: 'sales',
    items: [
      { to: '/admin/orders', label: 'orders', icon: ShoppingCart },
      { to: '/admin/coupons', label: 'coupons', icon: TicketPercent },
    ],
  },
  { title: 'people', items: [{ to: '/admin/customers', label: 'customers', icon: Users }] },
  { title: 'account', items: [{ to: '/admin/settings', label: 'settings', icon: Settings }] },
];

const ALL_ITEMS = SECTIONS.flatMap((section) => section.items);

function Brand() {
  const { t } = useLanguage('admin');
  return (
    <Link to="/admin" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-primary-500">
      <span className="logo-mark bg-white ring-1 ring-slate-200">
        <img src={bagLogo} alt="" className="h-8 w-8" />
      </span>
      <span className="leading-none">
        <span className="block text-lg font-extrabold tracking-tight text-secondary">Trend<span className="text-primary">Jr</span></span>
        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{t('layout.admin')}</span>
      </span>
    </Link>
  );
}

function NavSections({ onNavigate }) {
  const { t } = useLanguage('admin');
  return (
    <nav aria-label={t('layout.admin')} className="space-y-5 px-3 py-4">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t(`layout.sections.${section.title}`)}</p>
          <ul className="space-y-0.5">
            {section.items.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) => `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 before:absolute before:inset-y-2 before:start-0 before:w-1 before:rounded-e-full before:bg-primary-500'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                  {t(`layout.nav.${label}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserCard({ onSignOut }) {
  const { user } = useAuth();
  const { t } = useLanguage('admin');
  return (
    <div className="space-y-1 p-3">
      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-500 text-sm font-extrabold uppercase text-white">
          {(user?.username || user?.email || '?').charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-secondary">{user?.username || t('layout.admin')}</span>
          <span className="block truncate text-xs text-slate-500">{user?.email}</span>
        </span>
      </div>
      <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950">
        <Store className="h-4.5 w-4.5" aria-hidden="true" /> {t('layout.viewStore')}
      </Link>
      <button type="button" onClick={onSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">
        <LogOut className="h-4.5 w-4.5" aria-hidden="true" /> {t('nav.signOut')}
      </button>
    </div>
  );
}

function PageLoading() {
  const { t } = useLanguage('admin');
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-live="polite">
      <Loader2 className="h-7 w-7 animate-spin text-primary-500" aria-hidden="true" />
      <span className="sr-only">{t('app.loadingPage')}</span>
    </div>
  );
}

// Shell of every /admin page: sidebar (a drawer on small screens), top bar, content
export default function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage('admin');

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Browser tab title follows the section
  const current = [...ALL_ITEMS].sort((a, b) => b.to.length - a.to.length)
    .find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
  const sectionLabel = current ? t(`layout.nav.${current.label}`) : t('layout.admin');
  useEffect(() => {
    const previous = document.title;
    document.title = t('layout.tabTitle', { section: sectionLabel });
    return () => { document.title = previous; };
  }, [sectionLabel, t]);

  async function handleSignOut() {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  }

  return (
        <div className="min-h-screen bg-surface lg:ps-64">
          {/* Desktop sidebar */}
          <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-slate-200 bg-white lg:flex">
            <div className="border-b border-slate-100 px-5 py-4"><Brand /></div>
            <div className="min-h-0 flex-1 overflow-y-auto"><NavSections /></div>
            <div className="border-t border-slate-100"><UserCard onSignOut={handleSignOut} /></div>
          </aside>

          {/* Phone / tablet: same navigation in a slide-in drawer */}
          <Drawer
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            title={t('layout.menu')}
            header={<Brand />}
            id="admin-menu"
            closeLabel={t('layout.closeMenu')}
            footer={<UserCard onSignOut={handleSignOut} />}
            panelClassName="max-w-[18rem]"
          >
            <NavSections onNavigate={() => setMenuOpen(false)} />
          </Drawer>

          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ms-1.5 grid h-10 w-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-primary-500 lg:hidden"
              aria-label={t('layout.openMenu')}
              aria-expanded={menuOpen}
              aria-controls="admin-menu"
              aria-haspopup="dialog"
            >
              <Menu className="h-5.5 w-5.5" aria-hidden="true" />
            </button>
            <div className="lg:hidden"><Brand /></div>
            <p className="hidden text-sm font-semibold text-slate-500 lg:block">
              {sectionLabel}
            </p>
            <div className="ms-auto flex items-center gap-2">
              <LanguageSwitcher />
              <Link to="/" className="btn-outline btn-sm hidden sm:inline-flex">
                <Store className="h-4 w-4" aria-hidden="true" /> {t('layout.viewStore')}
              </Link>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
  );
}
