import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';

import Header from './components/Header';
import Footer from './components/Footer';

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

export default function App() {
  return (
    <BrowserRouter>

      <div className="min-h-screen flex flex-col">

        <Header />

        <main className="flex-1">

          <Routes>

            {/* Main */}
            <Route path="/" element={<HomePage />} />

            {/* Products */}
            <Route path="/shop" element={<ShopPage />} />
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

          </Routes>

        </main>

        <Footer />

      </div>

    </BrowserRouter>
  );
}