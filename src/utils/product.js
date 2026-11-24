// Helpers shared by the product components.
// API field names are documented in API.md (price, old_price and rating arrive as strings).
import { API_URL } from '../services/api';

// Localized values look like { en, de, ar }; plain strings are returned as-is.
export function getText(value, language = 'en') {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    return value[language] || value.en || value.ar || value.de || '';
  }
  return '';
}

export function toNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const formatPrice = (value) => currency.format(toNumber(value));

// Product images are read from the public folder: every file lives in /public/media
// under its own name. The database stores either a path with a batch folder
// ("media/jalila/abc.jpg") or the supplier's URL ("https://.../abc.jpg"); both point
// to /media/abc.jpg.
// Images uploaded from the admin dashboard ("uploads/abc.jpg") are served by the API.
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
export function getProductView(product, language = 'en') {
  const price = toNumber(product.price);
  const oldPrice = toNumber(product.old_price ?? product.originalPrice);
  const discount = toNumber(product.discount) ||
    (oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0);
  const rawImage = typeof product.image === 'string'
    ? product.image
    : product.image?.url ?? product.images?.[0];

  return {
    id: product.id ?? product._id,
    title: getText(product.name ?? product.title, language) || 'Unnamed product',
    image: getImageUrl(rawImage),
    imageFallback: isExternalUrl(rawImage) ? rawImage : '',
    price,
    oldPrice: oldPrice > price ? oldPrice : 0,
    discount,
    rating: toNumber(product.rating),
    reviews: toNumber(product.reviews_count ?? product.reviewsCount),
    stock: toNumber(product.stock),
    brand: product.brand || '',
  };
}

// Category label: localized name, else a readable version of the slug.
export function getCategoryLabel(category, language = 'en') {
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
      const label = match[1].trim().replace(/\s+as described by the supplier$/i, '');
      specs.push({ label, value: match[2].trim().replace(/\.$/, '') });
    } else {
      paragraphs.push(line);
    }
  }
  return { specs, paragraphs };
}
