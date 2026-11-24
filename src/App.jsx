import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useLocation, useParams } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import AdminRoute, { FullPageSpinner } from './components/admin/AdminRoute';
import RequireAuth from './components/RequireAuth';
import ErrorBoundary from './components/ErrorBoundary';
import { ConfirmProvider } from './components/admin/ConfirmDialog';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';

// The homepage is part of the main bundle; every other page is downloaded when
// it's first opened (the common ones are fetched in the background, see below).
import HomePage from '../pages/Homepage';

// After a new deploy, an open tab may ask for a page file that no longer exists:
// reload once to get the new version instead of failing.
const RELOAD_KEY = 'trendjr_chunk_reload';
function lazyPage(load) {
  return lazy(() => load().catch((error) => {
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
    if (Date.now() - last > 10000) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      window.location.reload();
      return new Promise(() => {}); // keep the loading state until the page reloads
    }
    throw error;
  }));
}

const load = {
  shop: () => import('../pages/ShopPage'),
  category: () => import('../pages/CategoryPage'),
  product: () => import('../pages/ProductPage'),
  search: () => import('../pages/SearchPage'),
  cart: () => import('../pages/CartPage'),
};
const ShopPage = lazyPage(load.shop);
const CategoryPage = lazyPage(load.category);
const ProductPage = lazyPage(load.product);
const SearchPage = lazyPage(load.search);
const CartPage = lazyPage(load.cart);
const OffersPage = lazyPage(() => import('../pages/OffersPage'));
const WishlistPage = lazyPage(() => import('../pages/WishlistPage'));
const CheckoutPage = lazyPage(() => import('../pages/CheckoutPage'));
const LoginPage = lazyPage(() => import('../pages/LoginPage'));
const RegisterPage = lazyPage(() => import('../pages/RegisterPage'));
const ProfilePage = lazyPage(() => import('../pages/ProfilePage'));
const OrdersPage = lazyPage(() => import('../pages/OrdersPage'));
const OrderDetailPage = lazyPage(() => import('../pages/OrderDetailPage'));
const AboutPage = lazyPage(() => import('../pages/AboutPage'));
const ContactPage = lazyPage(() => import('../pages/ContactPage'));
const FAQPage = lazyPage(() => import('../pages/FAQPage'));
const NotFoundPage = lazyPage(() => import('../pages/NotFoundPage'));

// Admin dashboard: loaded only when an admin opens it, so shoppers never download it
const AdminLayout = lazyPage(() => import('./components/admin/AdminLayout'));
const AdminDashboardPage = lazyPage(() => import('../pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazyPage(() => import('../pages/admin/AdminProductsPage'));
const AdminProductFormPage = lazyPage(() => import('../pages/admin/AdminProductFormPage'));
const AdminInventoryPage = lazyPage(() => import('../pages/admin/AdminInventoryPage'));
const AdminCategoriesPage = lazyPage(() => import('../pages/admin/AdminCategoriesPage'));
const AdminOrdersPage = lazyPage(() => import('../pages/admin/AdminOrdersPage'));
const AdminCustomersPage = lazyPage(() => import('../pages/admin/AdminCustomersPage'));
const AdminCouponsPage = lazyPage(() => import('../pages/admin/AdminCouponsPage'));
const AdminSettingsPage = lazyPage(() => import('../pages/admin/AdminSettingsPage'));

// Once the first page is up, fetch the pages people open most, so going there is instant
function usePreloadCommonPages() {
  useEffect(() => {
    const run = () => Object.values(load).forEach((fetchPage) => fetchPage().catch(() => {}));
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(run, 3000);
    return () => clearTimeout(timer);
  }, []);
}

// Shown in the page area (header and footer stay) while a page's code downloads
function PageLoading() {
  return (
    <div className="container-page py-8" role="status">
      <span className="sr-only">Loading the page…</span>
      <div className="h-7 w-56 max-w-full animate-pulse rounded-lg bg-slate-200" aria-hidden="true" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" aria-hidden="true" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-slate-100" />)}
      </div>
    </div>
  );
}

// Start every new page at the top (otherwise a product opens wherever the list was scrolled)
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

// Header, footer and phone navigation around every store page
function StoreLayout() {
  const { pathname } = useLocation();
  usePreloadCommonPages();
  return (
    <div className="min-h-screen flex flex-col">

      <Header />

      <div className="flex-1">
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </div>

      <Footer />

      <MobileBottomNav />

    </div>
  );
}

function AdminShell() {
  return (
    <AdminRoute>
      <ErrorBoundary>
        <Suspense fallback={<FullPageSpinner label="Loading the dashboard…" />}>
          <AdminLayout />
        </Suspense>
      </ErrorBoundary>
    </AdminRoute>
  );
}

// A fresh form for every product (and for "new"), so no state carries over
function ProductFormRoute() {
  const { id } = useParams();
  return <AdminProductFormPage key={id || 'new'} />;
}

function AdminNotFound() {
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <h1 className="text-xl font-black text-secondary">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">This part of the dashboard doesn&apos;t exist.</p>
      <Link to="/admin" className="btn-primary mt-6">Back to the dashboard</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <CartProvider>
      <WishlistProvider>
      <ToastProvider>
      <ConfirmProvider>

      <ScrollToTop />

      <Routes>

        <Route element={<StoreLayout />}>

          {/* Main */}
          <Route path="/" element={<HomePage />} />

          {/* Products */}
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products" element={<Navigate to="/shop" replace />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/product/:id/:slug?" element={<ProductPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/offers" element={<OffersPage />} />

          {/* Shopping */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User (signed in only) */}
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />

          {/* Information */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />

          {/* Anything else */}
          <Route path="*" element={<NotFoundPage />} />

        </Route>

        {/* Admin dashboard (admins only; the API checks the role on every request too) */}
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<ProductFormRoute />} />
          <Route path="products/:id/edit" element={<ProductFormRoute />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>

      </Routes>

      </ConfirmProvider>
      </ToastProvider>
      </WishlistProvider>
      </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
