import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import bagLogo from '../data/trend_gr_bag_icon.svg';
import { useAuth } from '../context/AuthContext';

const SHOP_LINKS = [
  { to: '/shop', label: 'All Products' },
  { to: '/offers', label: 'Offers & Deals' },
  { to: '/shop?sort=newest', label: 'New Arrivals' },
  { to: '/shop?sort=popular', label: 'Best-Selling' },
  { to: '/shop?sort=rating', label: 'Top Rated' },
];

const CARE_LINKS = [
  { to: '/orders', label: 'Track Your Order' },
  { to: '/faq', label: 'Shipping & Delivery Info' },
  { to: '/faq', label: '100% Buyer Protection' },
  { to: '/contact', label: 'Help Center & Returns' },
];

export default function Footer() {
  const { user } = useAuth();

  const companyLinks = [
    { to: '/about', label: 'About Trend Jr' },
    { to: '/contact', label: 'Contact Us' },
    user ? { to: '/profile', label: 'My Account' } : { to: '/login', label: 'Sign In' },
    user ? { to: '/orders', label: 'My Orders' } : { to: '/register', label: 'Create Account' },
    { to: '/wishlist', label: 'Wishlist' },
  ];

  const column = (title, links, span) => (
    <div className={span}>
      <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-3">{title}</h4>
      <ul className="space-y-2 text-xs">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="link-muted">{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-secondary text-slate-300 mt-8 pb-20 sm:pb-0">
      <div className="container-page py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
        {/* Brand Column */}
        <div className="lg:col-span-4">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="logo-mark bg-white p-0.5">
              <img src={bagLogo} alt="" className="w-full h-full" />
            </div>
            <div className="text-xl font-extrabold text-white">
              Trend<span className="text-primary-400">Jr</span>
            </div>
          </Link>
          <p className="mt-3 text-xs text-slate-400 leading-relaxed max-w-xs">
            Trend Jr connects global shoppers directly with verified makers for curated electronics, everyday apparel, smart home essentials, and weekly flash drops.
          </p>

          <form className="mt-5 max-w-xs">
            <label className="text-xs font-bold text-white block mb-2">
              Get weekly drop alerts &amp; private codes
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="input-icon left-3" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="input-with-icon pl-9 py-2 text-xs bg-white/10 border-white/10 text-white focus:border-primary-400"
                />
              </div>
              <button
                type="submit"
                className="btn-primary btn-sm"
              >
                Join
              </button>
            </div>
          </form>
        </div>

        {column('Shop', SHOP_LINKS, 'lg:col-span-2')}
        {column('Customer Care', CARE_LINKS, 'lg:col-span-3')}

        <div className="lg:col-span-3">
          {column('Company & Account', companyLinks, '')}
          <p className="text-xs text-slate-500 pt-3">support@trendjr.shop</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>© 2026 Trend Jr Commerce. All rights reserved.</div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-semibold">VISA</span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-semibold">Mastercard</span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-semibold">Apple Pay</span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-200 font-semibold">PayPal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
