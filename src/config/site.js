// Store-wide settings in one place. Every value can be set at build time with a
// VITE_* environment variable (see .env.example); the defaults match today's site.
const env = import.meta.env;

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

export const SITE = {
  name: 'Trend Jr',
  tagline: 'Direct online shopping for tech, beauty, fashion & home',
  description:
    'Shop trending gadgets, beauty tools, jewelry, accessories and home essentials at Trend Jr. Clear prices, free shipping and cash on delivery.',
  // Public address of the storefront, used for canonical links, sharing and the sitemap
  url: (clean(env.VITE_SITE_URL) || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, ''),
  currency: clean(env.VITE_CURRENCY) || 'USD',
  locale: 'en-US',
  supportEmail: clean(env.VITE_SUPPORT_EMAIL) || 'support@trendjr.shop',
  supportPhone: clean(env.VITE_SUPPORT_PHONE),
  // Digits only with country code, e.g. 4915123456789 (empty = no WhatsApp link)
  whatsapp: clean(env.VITE_WHATSAPP_NUMBER).replace(/[^\d]/g, ''),
  // A real coupon code to advertise in the top bar (create it under Admin > Coupons first)
  promoCode: clean(env.VITE_PROMO_CODE).toUpperCase(),
  address: 'Münsterstraße 11, 49525 Lengerich',
};

// "€" / "$" for labels such as "Price ($)"
export const CURRENCY_SYMBOL =
  new Intl.NumberFormat(SITE.locale, { style: 'currency', currency: SITE.currency })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value || SITE.currency;
