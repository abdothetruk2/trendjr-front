import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, Banknote, Truck } from 'lucide-react';
import bagLogo from '../data/trend_gr_bag_icon.svg';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage, getServerMessage } from '../services/api';
import useLanguage from '../i18n/useLanguage';
import { SITE } from '../config/site';

const SHOP_LINKS = [
  { to: '/shop', label: 'footer.allProducts' },
  { to: '/offers', label: 'footer.offersDeals' },
  { to: '/shop?sort=newest', label: 'footer.newArrivals' },
  { to: '/shop?sort=popular', label: 'footer.bestSelling' },
  { to: '/shop?sort=rating', label: 'footer.topRated' },
];

const CARE_LINKS = [
  { to: '/orders', label: 'footer.trackOrder' },
  { to: '/faq', label: 'footer.shippingInfo' },
  { to: '/faq#payments', label: 'footer.paymentProtection' },
  { to: '/contact', label: 'footer.helpReturns' },
];

// Footer newsletter sign-up (POST /api/newsletter)
function NewsletterForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' }); // idle | sending | done | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setState({ status: 'error', message: t('validation.email') });
      return;
    }
    setState({ status: 'sending', message: '' });
    try {
      const res = await api.post('/api/newsletter', { email: email.trim() });
      setState({ status: 'done', message: getServerMessage(res.data, t('footer.newsletterDone')) });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', message: getErrorMessage(err) });
    }
  }

  return (
    <form className="mt-5 max-w-xs" onSubmit={handleSubmit} noValidate>
      <label htmlFor="newsletter-email" className="text-xs font-bold text-white block mb-2">
        {t('footer.newsletterLabel')}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="input-icon start-3" aria-hidden="true" />
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            aria-describedby="newsletter-status"
            className="input-with-icon ps-9 py-2 text-xs bg-white/10 border-white/10 text-white focus:border-primary-400"
          />
        </div>
        <button type="submit" className="btn-primary btn-sm" disabled={state.status === 'sending'}>
          {state.status === 'sending' ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-label={t('common.sending')} /> : t('footer.join')}
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
  const { t } = useLanguage();

  const companyLinks = [
    { to: '/about', label: 'footer.aboutUs' },
    { to: '/contact', label: 'footer.contactUs' },
    user ? { to: '/profile', label: 'nav.myAccount' } : { to: '/login', label: 'nav.signIn' },
    user ? { to: '/orders', label: 'nav.myOrders' } : { to: '/register', label: 'footer.createAccount' },
    { to: '/wishlist', label: 'nav.wishlist' },
  ];

  const column = (title, links, span) => (
    <nav className={span} aria-label={title}>
      <h2 className="text-xs font-extrabold uppercase tracking-wider text-white mb-3">{title}</h2>
      <ul className="space-y-2 text-xs">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="link-muted">{t(link.label)}</Link>
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
            {t('footer.about')}
          </p>

          <NewsletterForm />
        </div>

        {column(t('footer.shop'), SHOP_LINKS, 'lg:col-span-2')}
        {column(t('footer.customerCare'), CARE_LINKS, 'lg:col-span-3')}

        <div className="lg:col-span-3">
          {column(t('footer.companyAccount'), companyLinks, '')}
          <a href={`mailto:${SITE.supportEmail}`} className="mt-3 inline-block text-xs text-slate-400 link-muted">{SITE.supportEmail}</a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>{t('footer.copyright', { year: new Date().getFullYear() })}</div>
          <div className="flex items-center gap-3" aria-label={t('footer.paymentDelivery')}>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-slate-200 font-semibold">
              <Banknote className="w-3.5 h-3.5" aria-hidden="true" /> {t('footer.cod')}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-slate-200 font-semibold">
              <Truck className="w-3.5 h-3.5" aria-hidden="true" /> {t('footer.freeShipping')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
