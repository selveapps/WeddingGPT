/**
 * Money helpers.
 *
 * All amounts are stored as integer minor units (cents) to keep budget
 * arithmetic exact - floating point dollars drift once you start summing dozens
 * of expenses. Formatting happens only at the edge, in the UI.
 *
 * The app launches for US couples, so USD is the only currency offered and
 * there is no currency picker. The other entries in `CURRENCY_META` remain so
 * that any stored amount still formats sensibly; anything unknown (including
 * workspaces created before the picker was removed) formats as USD.
 */

export const DEFAULT_CURRENCY = 'USD';

const CURRENCY_META = {
  USD: { symbol: '$', minorPerMajor: 100, locale: 'en-US' },
  EUR: { symbol: '€', minorPerMajor: 100, locale: 'en-IE' },
  GBP: { symbol: '£', minorPerMajor: 100, locale: 'en-GB' },
  AUD: { symbol: 'A$', minorPerMajor: 100, locale: 'en-AU' },
  CAD: { symbol: 'C$', minorPerMajor: 100, locale: 'en-CA' },
  AED: { symbol: 'AED ', minorPerMajor: 100, locale: 'en-AE' },
  SGD: { symbol: 'S$', minorPerMajor: 100, locale: 'en-SG' },
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_META);

function meta(currency) {
  return CURRENCY_META[currency] ?? CURRENCY_META[DEFAULT_CURRENCY];
}

/** Major units (12.5) -> minor units (1250). */
export function toMinor(major, currency = DEFAULT_CURRENCY) {
  const n = Number(major);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * meta(currency).minorPerMajor);
}

/** Minor units (1250) -> major units (12.5). */
export function toMajor(minor, currency = DEFAULT_CURRENCY) {
  const n = Number(minor);
  if (!Number.isFinite(n)) return 0;
  return n / meta(currency).minorPerMajor;
}

/**
 * Full formatting, e.g. `$45,000`.
 * Decimals are hidden by default - wedding budgets are round numbers and the
 * extra `.00` adds noise to every card.
 */
export function formatMoney(minor, currency = DEFAULT_CURRENCY, options = {}) {
  const { showDecimals = false, signed = false } = options;
  const { symbol, locale } = meta(currency);
  const value = toMajor(minor, currency);
  const abs = Math.abs(value);

  let body;
  try {
    body = abs.toLocaleString(locale, {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    });
  } catch {
    body = showDecimals ? abs.toFixed(2) : String(Math.round(abs));
  }

  const sign = value < 0 ? '-' : signed && value > 0 ? '+' : '';
  return `${sign}${symbol}${body}`;
}

/**
 * Condensed formatting for tight spaces such as dashboard tiles: `$45K`, `$1.2M`.
 */
export function formatMoneyCompact(minor, currency = DEFAULT_CURRENCY) {
  const { symbol } = meta(currency);
  const value = toMajor(minor, currency);
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  const trim = (n) => String(Number(n.toFixed(1))); // 4.0 -> "4", 4.5 -> "4.5"

  if (abs >= 1e9) return `${sign}${symbol}${trim(abs / 1e9)}B`;
  if (abs >= 1e6) return `${sign}${symbol}${trim(abs / 1e6)}M`;
  if (abs >= 1e3) return `${sign}${symbol}${trim(abs / 1e3)}K`;
  return formatMoney(minor, currency);
}

/** Currency symbol on its own, for text field affixes. */
export function currencySymbol(currency = DEFAULT_CURRENCY) {
  return meta(currency).symbol;
}

/**
 * Parse free text a user typed into a money field into minor units.
 * Tolerates symbols, spaces and grouping separators. Returns null if there is
 * no number at all, so callers can distinguish "empty" from "zero".
 */
export function parseMoneyInput(text, currency = DEFAULT_CURRENCY) {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return toMinor(value, currency);
}

/** Percentage of `total` represented by `part`, clamped to 0-100 and safe at total=0. */
export function percentOf(part, total) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, (part / total) * 100));
}
