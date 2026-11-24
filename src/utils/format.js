// Date and number formatting shared by the admin pages (prices: formatPrice in ./product.js)

const dateFormat = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
});
const shortDayFormat = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const numberFormat = new Intl.NumberFormat('en-US');
const compactFormat = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value) => (toDate(value) ? dateFormat.format(toDate(value)) : '—');
export const formatDateTime = (value) => (toDate(value) ? dateTimeFormat.format(toDate(value)) : '—');

// "2026-11-24" (a calendar day from the API) -> "Nov 24"
export const formatDayKey = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  return y && m && d ? shortDayFormat.format(new Date(Date.UTC(y, m - 1, d))) : String(key);
};

export const formatNumber = (value) => numberFormat.format(Number(value) || 0);

// 1,284 / 12.9K / 4.2M (only for numbers that don't need to be exact)
export const formatCompact = (value) => {
  const n = Number(value) || 0;
  return Math.abs(n) < 10000 ? numberFormat.format(n) : compactFormat.format(n);
};

// "2026-11-24" for <input type="date"> from an ISO string (local day)
export function toDateInput(value) {
  const date = toDate(value);
  if (!date) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// <input type="date"> value -> ISO string at the start (or end) of that local day
export function fromDateInput(value, { endOfDay = false } = {}) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
