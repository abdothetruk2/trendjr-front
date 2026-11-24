import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, Banknote, Truck } from 'lucide-react';
import bagLogo from '../data/trend_gr_bag_icon.svg';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../services/api';
import { SITE } from '../config/site';

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
  { to: '/faq#payments', label: 'Payment & Buyer Protection' },
  { to: '/contact', label: 'Help Center & Returns' },
];

// Footer newsletter sign-up (POST /api/newsletter)
function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' }); // idle | sending | done | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setState({ status: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    setState({ status: 'sending', message: '' });
    try {
      const res = await api.post('/api/newsletter', { email: email.trim() });
      setState({ status: 'done', message: res.data?.message || "Thanks! You're on the list." });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', message: getErrorMessage(err) });
    }
  }

  return (
    <form className="mt-5 max-w-xs" onSubmit={handleSubmit} noValidate>
      <label htmlFor="newsletter-email" className="text-xs font-bold text-white block mb-2">
        Get weekly drop alerts &amp; private codes
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="input-icon left-3" aria-hidden="true" />
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            aria-describedby="newsletter-status"
            className="input-with-icon pl-9 py-2 text-xs bg-white/10 border-white/10 text-white focus:border-primary-400"
          />
        </div>
        <button type="submit" className="btn-primary btn-sm" disabled={state.status === 'sending'}>
          {state.status === 'sending' ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-label="Sending" /> : 'Join'}
        </button>
      </div>
      <p id="newsletter-status" className="mt-2 min-h-4 text-[11px]" aria-live="polite">
        {state.status === 'done' && <span className="inline-flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {state.message}</span>}
        {state.status === 'error' && <span className="text-rose-300">{state.message}</span>}
      </p>
    </form>
  );
}

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
    <nav className={span} aria-label={title}>
      <h2 className="text-xs font-extrabold uppercase tracking-wider text-white mb-3">{title}</h2>
      <ul className="space-y-2 text-xs">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="link-muted">{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
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
            Trend Jr brings you trending gadgets, beauty tools, jewelry, accessories and home essentials at clear prices, with free shipping and cash on delivery.
          </p>

          <NewsletterForm />
        </div>

        {column('Shop', SHOP_LINKS, 'lg:col-span-2')}
        {column('Customer Care', CARE_LINKS, 'lg:col-span-3')}

        <div className="lg:col-span-3">
          {column('Company & Account', companyLinks, '')}
          <a href={`mailto:${SITE.supportEmail}`} className="mt-3 inline-block text-xs text-slate-400 link-muted">{SITE.supportEmail}</a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>© {new Date().getFullYear()} Trend Jr Commerce. All rights reserved.</div>
          <div className="flex items-center gap-3" aria-label="Payment and delivery">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-slate-200 font-semibold">
              <Banknote className="w-3.5 h-3.5" aria-hidden="true" /> Cash on delivery
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-slate-200 font-semibold">
              <Truck className="w-3.5 h-3.5" aria-hidden="true" /> Free shipping
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
