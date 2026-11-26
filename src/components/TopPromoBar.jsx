import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, TicketPercent, PackageSearch, HelpCircle, Store, Check } from 'lucide-react';
import { SITE } from '../config/site';
import useLanguage from '../i18n/useLanguage';

const linkClass = 'flex items-center gap-1.5 link-muted rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400';

// Promo code chip: only shown when a real code is configured (VITE_PROMO_CODE);
// clicking copies it.
function PromoChip({ code }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-400/40 text-primary-200 px-2.5 py-0.5 rounded-full transition-colors"
      aria-label={t('promo.copyCode', { code })}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> : <TicketPercent className="w-3.5 h-3.5 text-primary-400" aria-hidden="true" />}
      <span className="font-semibold text-white">{copied ? t('promo.copied') : t('promo.coupon')}</span>
      <span className="hidden sm:inline">{t('promo.code', { code })}</span>
    </button>
  );
}

export default function TopPromoBar() {
  const { t } = useLanguage();
  return (
    <div className="bg-secondary text-slate-200 text-xs border-b border-white/10">
      <div className="container-page py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left value promises */}
        <div className="flex items-center flex-wrap gap-x-5 gap-y-1">
          <Link to="/faq" className={linkClass}>
            <Truck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span className="font-semibold text-white">{t('promo.freeShipping')}</span>
            <span className="hidden sm:inline text-slate-400">{t('promo.onAllOrders')}</span>
          </Link>

          <Link to="/faq" className={`hidden md:flex ${linkClass}`}>
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            <span className="font-semibold text-white">{t('promo.buyerProtected')}</span>
            <span className="text-slate-400">{t('promo.cashOnDelivery')}</span>
          </Link>

          {SITE.promoCode && <PromoChip code={SITE.promoCode} />}
        </div>

        {/* Right utility links */}
        <nav className="hidden lg:flex items-center gap-4 text-slate-300" aria-label={t('promo.help')}>
          <Link to="/orders" className={linkClass}>
            <PackageSearch className="w-3.5 h-3.5" aria-hidden="true" />
            {t('promo.trackOrder')}
          </Link>
          <Link to="/faq" className={linkClass}>
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            {t('promo.helpCenter')}
          </Link>
          <Link to="/contact" className={linkClass}>
            <Store className="w-3.5 h-3.5" aria-hidden="true" />
            {t('promo.sell')}
          </Link>
        </nav>
      </div>
    </div>
  );
}
