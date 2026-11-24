import React from 'react';
import { Mail } from 'lucide-react';
import bagLogo from '../data/trend_gr_bag_icon.svg';

const DEPARTMENTS = [
  'Electronics & Gadgets',
  "Men's Clothing",
  "Women's Clothing",
  'Home & Kitchen',
  'Smart Home',
];

export default function Footer() {
  return (
    <footer className="bg-secondary text-slate-300 mt-8 pb-20 sm:pb-0">
      <div className="container-page py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
        {/* Brand Column */}
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2">
            <div className="logo-mark bg-white p-0.5">
              <img src={bagLogo} alt="" className="w-full h-full" />
            </div>
            <div className="text-xl font-extrabold text-white">
              Trend<span className="text-primary-400">Jr</span>
            </div>
          </div>
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

        {/* Shop Links */}
        <div className="lg:col-span-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-3">
            Departments
          </h4>
          <ul className="space-y-2 text-xs">
            {DEPARTMENTS.map((label) => (
              <li key={label}>
                <a href="#" className="link-muted">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer Care */}
        <div className="lg:col-span-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-3">
            Customer Care
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button type="button" className="link-muted">
                Track Your Order
              </button>
            </li>
            <li>
              <button type="button" className="link-muted">
                Shipping &amp; Delivery Info
              </button>
            </li>
            <li>
              <button type="button" className="link-muted">
                100% Buyer Protection
              </button>
            </li>
            <li>
              <button type="button" className="link-muted">
                Help Center &amp; Returns
              </button>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div className="lg:col-span-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-3">
            Partner With Trend Jr
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button type="button" className="link-muted">
                Sell on Trend Jr
              </button>
            </li>
            <li>
              <button type="button" className="link-muted">
                Download Mobile App
              </button>
            </li>
            <li>
              <button type="button" className="link-muted">
                Weekly Promo Codes
              </button>
            </li>
            <li className="text-slate-500 pt-1">support@trendjr.shop</li>
          </ul>
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
