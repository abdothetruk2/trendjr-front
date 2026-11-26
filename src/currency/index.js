// Display currency. Product prices come from the API in the store's base currency
// (USD) and are converted here for display only, with the exchange rates the
// backend fetches and caches (GET /api/currency). Orders are always priced by the
// server; checkout shows the server's converted amounts.
//
// Which currency a visitor sees (first match wins):
//   1. a currency they picked themselves (saved, never replaced automatically)
//   2. a currency saved on an earlier visit
//   3. the currency of their country (GET /api/currency/detect, IP based)
//   4. the default (USD)
import { useSyncExternalStore } from 'react';
// Same backend address as services/api.js (not imported from there, to keep the
// api -> messages -> prices -> currency imports free of cycles)
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export const BASE_CURRENCY = 'USD';
const PREF_KEY = 'trendjr_currency'; // { code, manual }
const RATES_KEY = 'trendjr_rates'; // { base, rates, currencies, updatedAt, savedAt }
const RATES_MAX_AGE = 6 * 60 * 60 * 1000;

let state = {
  code: BASE_CURRENCY,
  manual: false,
  rates: { [BASE_CURRENCY]: 1 },
  currencies: [{ code: BASE_CURRENCY, decimals: 2 }],
  updatedAt: null,
};
const listeners = new Set();

function set(patch) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

const readJson = (key) => {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
};
const writeJson = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
};

async function getJson(path, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_URL}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function applyRates(data) {
  if (!data?.rates) return;
  const currencies = Array.isArray(data.currencies) && data.currencies.length
    ? data.currencies
    : Object.keys(data.rates).map((code) => ({ code, decimals: 2 }));
  set({ rates: { ...data.rates, [BASE_CURRENCY]: 1 }, currencies, updatedAt: data.updatedAt || null });
}

async function loadRates(timeout) {
  try {
    const data = await getJson('/api/currency', timeout);
    applyRates(data);
    writeJson(RATES_KEY, { base: data.base, rates: data.rates, currencies: data.currencies, updatedAt: data.updatedAt, savedAt: Date.now() });
  } catch {
    // keep the cached (or base-only) rates
  }
}

// Called once before the first render. Waits only when nothing is cached yet,
// and never longer than a couple of seconds (prices then show in USD first).
export async function initCurrency() {
  const cached = readJson(RATES_KEY);
  if (cached?.rates) applyRates(cached);
  const pref = readJson(PREF_KEY);
  if (pref?.code) set({ code: String(pref.code).toUpperCase(), manual: Boolean(pref.manual) });

  const waits = [];
  const ratesFresh = cached?.savedAt && Date.now() - cached.savedAt < RATES_MAX_AGE;
  // No saved rates: wait for them. Saved ones: use them now, refresh in the background.
  if (!cached?.rates) waits.push(loadRates(2500));
  else if (!ratesFresh) loadRates(8000);

  if (!pref?.code) {
    // First visit: currency of the visitor's country (looked up by the backend)
    waits.push(getJson('/api/currency/detect', 2500)
      .then((data) => {
        const code = String(data?.currency || BASE_CURRENCY).toUpperCase();
        // A manual choice made meanwhile always wins
        if (!readJson(PREF_KEY)?.manual) {
          set({ code, manual: false });
          writeJson(PREF_KEY, { code, manual: false, country: data?.country || null });
        }
      })
      .catch(() => writeJson(PREF_KEY, { code: BASE_CURRENCY, manual: false })));
  }
  await Promise.allSettled(waits);
}

// A visitor's own choice: saved and never replaced by detection
export function setCurrency(code) {
  const upper = String(code).toUpperCase();
  writeJson(PREF_KEY, { code: upper, manual: true });
  set({ code: upper, manual: true });
}

// The admin dashboard works in the store's own (base) currency: revenue, product
// prices and coupons are all stored in it
const inAdmin = () => typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

export const getCurrencyState = () => state;

// The currency prices are shown in right now (falls back to USD without a rate)
export function displayCurrency() {
  if (inAdmin()) return BASE_CURRENCY;
  return state.rates[state.code] ? state.code : BASE_CURRENCY;
}

export function currencyDecimals(code) {
  const known = state.currencies.find((c) => c.code === code)?.decimals;
  if (Number.isInteger(known)) return known;
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits;
  } catch {
    return 2;
  }
}

// Base amount -> display currency, rounded like the server does (unit prices first)
export function convertPrice(value, code = displayCurrency()) {
  const amount = Number(value) || 0;
  const rate = code === BASE_CURRENCY ? 1 : state.rates[code];
  if (!rate) return amount;
  const factor = 10 ** currencyDecimals(code);
  return Math.round(amount * rate * factor) / factor;
}

// Sum of cart lines in the display currency: each unit price converted, then multiplied
export function convertLines(lines) {
  const code = displayCurrency();
  return lines.reduce((sum, line) => sum + convertPrice(line.price, code) * line.quantity, 0);
}

export function useCurrency() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => state,
  );
}
