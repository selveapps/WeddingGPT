import { toMinor } from './currency';

/**
 * Find amounts of money in free text: "$2,000", "$1.5k", "2k", "300 dollars",
 * "USD 450". Returns minor units (cents) with where they were found.
 *
 * `explicit` is true when the text says it is money (a $ sign, "k", "dollars",
 * "USD"). A bare number like "500" is included as non-explicit so callers can
 * decide - "spent 500 on the cake" is money, "table 12" is not.
 */
const AMOUNT_RE =
  /(?:(\$|usd\s*)\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(k)?\b)|(?:\b(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(k|dollars?|usd)?\b)/gi;

export function findAmounts(text) {
  const out = [];
  for (const match of (text ?? '').matchAll(AMOUNT_RE)) {
    const symbol = match[1];
    const whole = (symbol ? match[2] : match[5]).replace(/,/g, '');
    const cents = symbol ? match[3] : match[6];
    const suffix = (symbol ? match[4] : match[7])?.toLowerCase();
    let major = Number(`${whole}${cents ? `.${cents}` : ''}`);
    if (!Number.isFinite(major)) continue;
    if (suffix === 'k') major *= 1000;
    out.push({
      minor: toMinor(major),
      index: match.index,
      raw: match[0].trim(),
      explicit: Boolean(symbol || suffix),
    });
  }
  return out;
}

/** Amounts written as a percentage of something: "30% deposit". */
export function findPercents(text) {
  return [...(text ?? '').matchAll(/\b(\d{1,3}(?:\.\d+)?)\s?%/g)].map((match) => ({
    percent: Number(match[1]),
    index: match.index,
    raw: match[0],
  }));
}
