// The API answers in English. These helpers show its messages in the visitor's
// language: exact messages come from locales/<lang>/server.json, messages with
// numbers or names are matched by the patterns below. Anything unknown is shown
// as sent.
import i18n from './index';
import { formatPrice } from '../utils/product';

const PATTERNS = [
  [/^(.+) is no longer available$/, 'pattern.noLongerAvailable', (m) => ({ name: m[1] })],
  [/^Password must be at least (\d+) characters$/, 'pattern.passwordMin', (m) => ({ count: Number(m[1]) })],
  [/^Password must be at most (\d+) characters$/, 'pattern.passwordMax', (m) => ({ count: Number(m[1]) })],
  [/^Quantity can be at most (\d+) per item$/, 'pattern.quantityMax', (m) => ({ count: Number(m[1]) })],
  [/^An order can contain at most (\d+) items$/, 'pattern.orderMaxItems', (m) => ({ count: Number(m[1]) })],
  [/^Too many failed sign-in attempts\. Try again in (\d+) minutes?\.?$/, 'pattern.tooManyAttempts', (m) => ({ count: Number(m[1]) })],
  [/^Only (\d+) left of (.+)$/, 'pattern.onlyLeft', (m) => ({ count: Number(m[1]), name: m[2] })],
  [/^(.+) is out of stock$/, 'pattern.outOfStock', (m) => ({ name: m[1] })],
  [/^Unknown category: (.+)$/, 'pattern.unknownCategory', (m) => ({ slug: m[1] })],
  [/^(.+) \((en|de|ar)\) must be at most (\d+) characters$/, 'pattern.fieldLangMax', (m) => ({ field: m[1], lang: m[2].toUpperCase(), count: Number(m[3]) })],
  [/^(.+) \(English\) is required$/, 'pattern.englishRequired', (m) => ({ field: m[1] })],
  [/^(.+) \(English\) cannot be empty$/, 'pattern.englishRequired', (m) => ({ field: m[1] })],
  [/^(.+) is required$/, 'pattern.required', (m) => ({ field: m[1] })],
  [/^(.+) must be at most (\d+) characters$/, 'pattern.maxChars', (m) => ({ field: m[1], count: Number(m[2]) })],
  [/^(.+) must be a number$/, 'pattern.number', (m) => ({ field: m[1] })],
  [/^(.+) must be at least (-?[\d.]+)$/, 'pattern.atLeast', (m) => ({ field: m[1], value: m[2] })],
  [/^(.+) must be at most (-?[\d.]+)$/, 'pattern.atMost', (m) => ({ field: m[1], value: m[2] })],
  [/^Request failed \((\d+)\)\.?$/, 'pattern.requestFailed', (m) => ({ status: m[1] })],
  [/^This coupon needs an order of at least ([\d.]+)$/, 'pattern.couponMinimum', (m) => ({ amount: formatPrice(Number(m[1])) })],
  [/^Order cannot be cancelled when status is "(\w+)"$/, 'pattern.cannotCancel', (m) => ({ status: m[1] })],
  [/^Move or delete its (\d+) sub-categor(?:y|ies) first$/, 'pattern.subcategoriesFirst', (m) => ({ count: Number(m[1]) })],
  [/^(\d+) products? (?:is|are) in this category\./, 'pattern.categoryHasProducts', (m) => ({ count: Number(m[1]) })],
  [/^Duplicate value for: (.+)$/, 'pattern.duplicate', (m) => ({ field: m[1] })],
  [/^At most (\d+) fields at once$/, 'pattern.maxFields', (m) => ({ count: Number(m[1]) })],
  [/^Route (\w+) (.+) not found$/, 'pattern.routeNotFound', () => ({})],
];

const options = { ns: 'server', keySeparator: false, nsSeparator: false };

export function translateServerMessage(message) {
  if (!message || typeof message !== 'string') return message;
  if (i18n.exists(message, options)) return i18n.t(message, options);
  for (const [rx, key, params] of PATTERNS) {
    const match = message.match(rx);
    if (match && i18n.exists(key, { ns: 'server' })) return i18n.t(key, { ns: 'server', ...params(match) });
  }
  return message;
}
