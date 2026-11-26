// Helpers shared by the product components.
// API field names are documented in API.md (price, old_price and rating arrive as strings).
import { API_URL } from '../services/api';
import { SITE } from '../config/site';
import i18n, { currentLanguage, currentLocale } from '../i18n';
import { BASE_CURRENCY, convertPrice, currencyDecimals, displayCurrency } from '../currency';

// Localized values look like { en, de, ar }; plain strings are returned as-is.
// Without a language, the visitor's current language is used (English if missing).
export function getText(value, language = currentLanguage()) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    return value[language] || value.en || value.de || value.fr || value.es || value.ar || '';
  }
  return '';
}

export function toNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

// An amount that is already in `code`, written for the visitor's language
// ($1,234.56 / 1.234,56 € / ‏1,234.56 ج.م.‏). whole: no decimals (filter labels).
const currencyFormats = {};
export function formatMoney(amount, code = SITE.currency, { whole = false } = {}) {
  const locale = currentLocale();
  const key = `${locale}|${code}|${whole}`;
  if (!currencyFormats[key]) {
    try {
      currencyFormats[key] = new Intl.NumberFormat(locale, { style: 'currency', currency: code, ...(whole ? { maximumFractionDigits: 0 } : {}) });
    } catch {
      currencyFormats[key] = new Intl.NumberFormat(locale, { style: 'currency', currency: SITE.currency });
    }
  }
  return currencyFormats[key].format(toNumber(amount));
}

// An order's amounts in the currency the customer saw at checkout, from the order's
// own snapshot (never today's rates). Orders without one are in the base currency.
//   const money = orderMoney(order); money.total(); money.subtotal(); money.unit(item.price); money.line(item)
//   money.base(amount) always shows the stored base amount (admin)
export function orderMoney(order) {
  const snap = order?.currency;
  const has = Boolean(snap?.code && snap.rate && snap.code !== BASE_CURRENCY);
  const base = (amount) => formatMoney(amount, BASE_CURRENCY);
  const unitValue = (price) => {
    const factor = 10 ** currencyDecimals(snap.code);
    return Math.round(toNumber(price) * snap.rate * factor) / factor;
  };
  const amount = (key, baseKey) => (has && typeof snap[key] === 'number' ? formatMoney(snap[key], snap.code) : base(order?.[baseKey ?? key]));
  return {
    code: has ? snap.code : BASE_CURRENCY,
    converted: has,
    base,
    subtotal: () => amount('subtotal'),
    shipping: () => amount('shippingFee'),
    discount: () => amount('discount'),
    total: () => amount('total', 'totalPrice'),
    unit: (price) => (has ? formatMoney(unitValue(price), snap.code) : base(price)),
    line: (item) => (has ? formatMoney(unitValue(item.price) * item.quantity, snap.code) : base(item.subtotal)),
  };
}

// A price from the API (store base currency) in the visitor's display currency
export const formatPrice = (value, options) => {
  const code = displayCurrency();
  return formatMoney(convertPrice(toNumber(value), code), code, options);
};

// Stock rules (same as the backend's utils/inventory.js):
// track_inventory true/false is explicit; unset means "tracked only when there is a
// stock number" — imported products without one (stock 0) stay for sale.
export function isStockTracked(product) {
  if (typeof product?.track_inventory === 'boolean') return product.track_inventory;
  if (typeof product?.tracked === 'boolean') return product.tracked; // cart/wishlist snapshots
  return toNumber(product?.stock) > 0;
}

export const LOW_STOCK = 5;

// Store link of a product: /product/12/gold-necklace (the slug is optional)
export function productPath(product) {
  const id = product?.id ?? product?.productId ?? product?._id;
  if (id === undefined || id === null) return '/shop';
  const slug = typeof product?.slug === 'string' ? product.slug : '';
  return slug ? `/product/${id}/${encodeURIComponent(slug)}` : `/product/${id}`;
}

// Product images are read from the public folder: every file lives in /public/media
// under its own name. The database stores either a path with a batch folder
// ("media/jalila/abc.jpg") or the supplier's URL ("https://.../abc.jpg"); both point
// to /media/abc.jpg.
// Images uploaded from the admin dashboard ("uploads/abc.jpg") are served by the API.
// Catalog photos (/media/<name>.jpg) also exist as small WebP copies in two widths,
// made by scripts/optimize-images.py. The browser picks one using `sizes`.
export function webpCopies(src) {
  const match = /^\/media\/([^/?#]+)\.(jpe?g|png|webp)$/i.exec(src || '');
  if (!match) return null;
  const name = match[1];
  return { src: `/media/w960/${name}.webp`, srcSet: `/media/w480/${name}.webp 480w, /media/w960/${name}.webp 960w` };
}

export function getImageUrl(path) {
  if (!path || typeof path !== 'string') return '';
  if (/^(data|blob):/.test(path)) return path;
  if (/^\/?uploads\//.test(path)) return `${API_URL}/${path.replace(/^\//, '')}`;
  const fileName = path.split(/[?#]/)[0].split('/').pop();
  return fileName ? `/media/${fileName}` : '';
}

// Category slug of a product: the `category` field (set in the dashboard) or the
// imported "category-request:<slug>" tag.
export function getProductCategory(product) {
  if (product?.category_slug) return product.category_slug;
  if (product?.category) return product.category;
  if (Array.isArray(product?.tags)) {
    const tag = product.tags.find((t) => typeof t === 'string' && t.startsWith('category-request:'));
    if (tag) return tag.slice('category-request:'.length);
  }
  return '';
}

// The supplier URL, used only if the file is missing from /public/media
export const isExternalUrl = (path) => typeof path === 'string' && /^(https?:)?\/\//i.test(path);

// Everything a product card needs, read safely from an API product.
export function getProductView(product, language = currentLanguage()) {
  const price = toNumber(product.price);
  const oldPrice = toNumber(product.old_price ?? product.originalPrice);
  const discount = toNumber(product.discount) ||
    (oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0);
  const rawImage = typeof product.image === 'string'
    ? product.image
    : product.image?.url ?? product.images?.[0];
  const stock = Math.max(0, Math.floor(toNumber(product.stock)));
  const tracked = isStockTracked(product);

  return {
    id: product.id ?? product._id,
    slug: typeof product.slug === 'string' ? product.slug : '',
    url: productPath(product),
    title: getText(product.name ?? product.title, language) || i18n.t('product.unnamed'),
    image: getImageUrl(rawImage),
    imageFallback: isExternalUrl(rawImage) ? rawImage : '',
    price,
    oldPrice: oldPrice > price ? oldPrice : 0,
    discount,
    rating: Math.min(5, Math.max(0, toNumber(product.rating))),
    reviews: toNumber(product.reviews_count ?? product.reviewsCount),
    sold: toNumber(product.sold_count ?? product.sold),
    stock,
    tracked,
    // How many a customer may buy now (untracked products: up to 10 per order line)
    maxQuantity: tracked ? stock : 10,
    inStock: !tracked || stock > 0,
    lowStock: tracked && stock > 0 && stock <= LOW_STOCK,
    brand: product.brand || '',
  };
}

// Category label: localized name, else a readable version of the slug.
export function getCategoryLabel(category, language = currentLanguage()) {
  const name = getText(category?.name, language);
  if (name) return name;
  return String(category?.slug || '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Every photo of a product, main image first: [{ src, fallbackSrc }] without repeats.
// `images` holds the extra gallery photos (same path formats as `image`).
export function getProductImages(product) {
  const main = typeof product?.image === 'string' ? product.image : product?.image?.url;
  const extra = Array.isArray(product?.images) ? product.images : [];
  const seen = new Set();
  const list = [];
  for (const path of [main, ...extra]) {
    const src = getImageUrl(path);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    list.push({ src, fallbackSrc: isExternalUrl(path) ? path : '' });
  }
  return list;
}

// Splits a description into "Key: value" lines (shown as a specifications table)
// and the remaining text paragraphs.
// "Weight: 4 g." -> { label: "Weight", value: "4 g" }
export function splitDescription(text) {
  const specs = [];
  const paragraphs = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^([^:]{2,45}):\s*(.+)$/);
    const words = match ? match[1].trim().split(/\s+/).length : 0;
    if (match && words <= 6 && !/https?$/i.test(match[1])) {
      const label = match[1].trim().replace(/\s+(as described by the supplier|laut Anbieter|selon le fournisseur|según el proveedor|(ب?حسب|وفق[اً]*) (المورد|وصف المورد))$/i, '');
      specs.push({ label, value: match[2].trim().replace(/\.$/, '') });
    } else {
      paragraphs.push(line);
    }
  }
  return { specs, paragraphs };
}
