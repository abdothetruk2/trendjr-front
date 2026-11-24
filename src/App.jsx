import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useLocation, useParams } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import AdminRoute, { FullPageSpinner } from './components/admin/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Pages
import HomePage from '../pages/Homepage';
import ShopPage from '../pages/ShopPage';
import CategoryPage from '../pages/CategoryPage';
import ProductPage from '../pages/ProductPage';
import SearchPage from '../pages/SearchPage';
import OffersPage from '../pages/OffersPage';
import CartPage from '../pages/CartPage';
import WishlistPage from '../pages/WishlistPage';
import CheckoutPage from '../pages/CheckoutPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';
import OrdersPage from '../pages/OrdersPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import FAQPage from '../pages/FAQPage';
import NotFoundPage from '../pages/NotFoundPage';

// Admin dashboard: loaded only when an admin opens it, so shoppers never download it
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('../pages/admin/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('../pages/admin/AdminProductFormPage'));
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage'));
const AdminOrdersPage = lazy(() => import('../pages/admin/AdminOrdersPage'));
const AdminCustomersPage = lazy(() => import('../pages/admin/AdminCustomersPage'));
const AdminCouponsPage = lazy(() => import('../pages/admin/AdminCouponsPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));

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
  return (
    <div className="min-h-screen flex flex-col">

      <Header />

      <div className="flex-1">
        <Outlet />
      </div>

      <Footer />

      <MobileBottomNav />

    </div>
  );
}

function AdminShell() {
  return (
    <AdminRoute>
      <Suspense fallback={<FullPageSpinner label="Loading the dashboard…" />}>
        <AdminLayout />
      </Suspense>
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

      <ScrollToTop />

      <Routes>

        <Route element={<StoreLayout />}>

          {/* Main */}
          <Route path="/" element={<HomePage />} />

          {/* Products */}
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products" element={<Navigate to="/shop" replace />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/offers" element={<OffersPage />} />

          {/* Shopping */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrdersPage />} />

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
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>

      </Routes>

      </WishlistProvider>
      </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
