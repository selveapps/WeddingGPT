import { VendorStatus } from './enums';
import { paymentsFromMilestones } from './vendors';
import { formatMoney } from '../lib/currency';
import { formatMediumDate } from '../lib/date';
import { findDates } from '../lib/textDates';
import { findAmounts, findPercents } from '../lib/textMoney';

/**
 * Quote and contract reader (graduated from Labs, part of Vendors).
 *
 * Pull the numbers that matter out of a pasted quote: total, deposit,
 * balance, what each line costs, when money is due, and the fine print worth
 * a second look. Line-based heuristics - vendor quotes are short and put one
 * fact per line - so every result is shown for the couple to check, never
 * saved without them.
 */

const TOTAL_RE = /\b(grand total|total|amount due|package price|investment|contract price|quote total)\b/i;
const DEPOSIT_RE = /\b(deposit|retainer|booking fee)\b/i;
const BALANCE_RE = /\b(balance|final payment|remaining)\b/i;
const EVENT_RE = /\b(event date|wedding date|date of event|service date)\b/i;
const EXPIRES_RE = /\b(valid until|valid through|expires|offer ends|quote valid)\b/i;
const SUBTOTAL_RE = /\b(subtotal|sub-total)\b/i;
const TAX_RE = /\b(tax|gratuity|service charge|fees?)\b/i;

export const FINE_PRINT = [
  { key: 'non_refundable', label: 'Non-refundable money', re: /\bnon-?refundable\b/i },
  { key: 'cancellation', label: 'Cancellation terms', re: /\bcancel\w*/i },
  { key: 'overtime', label: 'Overtime charges', re: /\b(overtime|additional hour|per extra hour)\b/i },
  { key: 'late_fee', label: 'Late payment fees', re: /\blate (fee|payment|charge)\b/i },
  { key: 'minimum', label: 'Minimum spend or guest count', re: /\bminimum\b/i },
  { key: 'gratuity', label: 'Gratuity or service charge', re: /\b(gratuity|service charge)\b/i },
];

export const SAMPLE_QUOTE = `Rosewood Florals - Wedding Proposal
Bridal bouquet: $350
Bridesmaid bouquets (4 x $85): $340
Ceremony arch flowers: $1,200
Centerpieces (12): $1,560
Delivery and setup: $250
Total: $3,700
A 30% non-refundable deposit is due by February 15, 2027 to hold your date.
Final payment due June 5, 2027.
Event date: June 19, 2027
Cancellations within 60 days of the event forfeit all payments.
Quote valid until January 31, 2027.`;

function explicitAmount(line) {
  return (
    findAmounts(line)
      .filter((amount) => amount.explicit)
      .pop() ?? null
  );
}

function lineLabel(line, amount) {
  return line
    .slice(0, amount.index)
    .replace(/[:\-–—.\s]+$/, '')
    .trim();
}

export function extractQuote(text, { from = new Date() } = {}) {
  const lines = (text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const result = {
    vendorName: '',
    total: null,
    deposit: null,
    depositPercent: null,
    balance: null,
    lineItems: [],
    dates: [],
    expiresOn: null,
    eventDate: null,
    finePrint: [],
    warnings: [],
  };
  if (!lines.length) return result;

  const first = lines[0];
  if (first.length <= 60 && !explicitAmount(first)) {
    result.vendorName = first.split(/\s+[-–—|]\s+/)[0].trim();
  }

  let subtotal = null;

  for (const line of lines) {
    const amount = explicitAmount(line);
    const dates = findDates(line, from);

    if (amount && TOTAL_RE.test(line) && !SUBTOTAL_RE.test(line)) {
      result.total = amount.minor;
    } else if (amount && SUBTOTAL_RE.test(line)) {
      subtotal = amount.minor;
    } else if (DEPOSIT_RE.test(line)) {
      if (amount) result.deposit = amount.minor;
      else if (findPercents(line).length) result.depositPercent = findPercents(line)[0].percent;
    } else if (amount && BALANCE_RE.test(line)) {
      result.balance = amount.minor;
    } else if (amount) {
      const label = lineLabel(line, amount);
      if (label) result.lineItems.push({ label, amount: amount.minor, isFee: TAX_RE.test(label) });
    }

    for (const date of dates) {
      if (EXPIRES_RE.test(line)) result.expiresOn = date.iso;
      else if (EVENT_RE.test(line)) result.eventDate = date.iso;
      else if (DEPOSIT_RE.test(line)) result.dates.push({ label: 'Deposit due', iso: date.iso });
      else if (BALANCE_RE.test(line)) result.dates.push({ label: 'Balance due', iso: date.iso });
      else result.dates.push({ label: 'Date mentioned', iso: date.iso });
    }

    for (const flag of FINE_PRINT) {
      if (flag.re.test(line) && !result.finePrint.some((entry) => entry.key === flag.key)) {
        result.finePrint.push({ key: flag.key, label: flag.label, line });
      }
    }
  }

  const itemsSum = result.lineItems.reduce((sum, item) => sum + item.amount, 0);
  if (result.total === null) result.total = subtotal ?? (itemsSum || null);
  if (result.deposit === null && result.depositPercent !== null && result.total) {
    result.deposit = Math.round((result.total * result.depositPercent) / 100);
  }
  if (result.balance === null && result.total !== null && result.deposit !== null) {
    result.balance = Math.max(0, result.total - result.deposit);
  }

  const reference = subtotal ?? result.total;
  const itemsWithoutFees = result.lineItems.filter((item) => !item.isFee).reduce((s, i) => s + i.amount, 0);
  if (reference && result.lineItems.length > 1 && itemsSum !== reference && itemsWithoutFees !== reference) {
    result.warnings.push(
      `Line items add up to ${formatMoney(itemsSum)}, but the quote says ${formatMoney(reference)}. Ask what the difference covers.`
    );
  }
  if (
    result.expiresOn &&
    result.expiresOn < (result.dates.find((d) => d.label === 'Deposit due')?.iso ?? '9999')
  ) {
    result.warnings.push(
      `The quote expires ${formatMediumDate(result.expiresOn)} - before the deposit is due.`
    );
  }

  return result;
}

export function hasFindings(result) {
  return Boolean(
    result && (result.total || result.lineItems.length || result.dates.length || result.finePrint.length)
  );
}

/** A tidy summary for the couple's notes or their partner. */
export function quoteSummary(result) {
  const lines = [result.vendorName ? `${result.vendorName} - quote summary` : 'Quote summary', ''];
  if (result.total !== null) lines.push(`Total: ${formatMoney(result.total)}`);
  if (result.deposit !== null) {
    lines.push(
      `Deposit: ${formatMoney(result.deposit)}${result.depositPercent ? ` (${result.depositPercent}%)` : ''}`
    );
  }
  if (result.balance !== null) lines.push(`Balance: ${formatMoney(result.balance)}`);
  for (const date of result.dates) lines.push(`${date.label}: ${formatMediumDate(date.iso)}`);
  if (result.expiresOn) lines.push(`Quote valid until: ${formatMediumDate(result.expiresOn)}`);
  if (result.finePrint.length)
    lines.push('', 'Read carefully:', ...result.finePrint.map((f) => `- ${f.line}`));
  if (result.warnings.length) lines.push('', 'Questions to ask:', ...result.warnings.map((w) => `- ${w}`));
  return lines.join('\n');
}

/** What the quote covers, as one line for the vendor's `quoteScope`. */
export function quoteScopeText(result) {
  return result.lineItems
    .filter((item) => !item.isFee)
    .map((item) => item.label)
    .join(', ')
    .slice(0, 500);
}

/**
 * The fields the vendor store's `addVendor` takes, for this quote. The
 * deposit and balance become the vendor's payment plan; the line items become
 * what the quote covers; the quote's expiry is kept.
 */
export function toVendorDraft(result, categoryKey) {
  const total = result.total ?? 0;
  const deposit = Math.min(result.deposit ?? 0, total);
  const due = (label) => result.dates.find((date) => date.label === label)?.iso ?? null;
  return {
    name: result.vendorName || 'New vendor',
    categoryKey,
    status: VendorStatus.QUOTED,
    quotedAmount: total > 0 ? total : null,
    quoteScope: quoteScopeText(result),
    quoteValidUntil: result.expiresOn ?? null,
    payments: paymentsFromMilestones({
      quotedAmount: total,
      depositAmount: deposit || null,
      depositDueAt: due('Deposit due'),
      finalAmount: total - deposit > 0 ? total - deposit : null,
      finalDueAt: due('Balance due'),
    }),
  };
}

/**
 * The patch for an existing vendor: the new quote, its payment plan and
 * scope. Payments already marked paid are kept, so re-reading a quote never
 * forgets money that has changed hands.
 */
export function quotePatchForVendor(result, vendor) {
  const draft = toVendorDraft(result, vendor.categoryKey);
  const paid = (vendor.payments ?? []).filter((payment) => payment.paidAt);
  const status = [VendorStatus.SAVED, VendorStatus.CONTACTED].includes(vendor.status)
    ? VendorStatus.QUOTED
    : vendor.status;
  return {
    quotedAmount: draft.quotedAmount,
    quoteScope: draft.quoteScope || vendor.quoteScope || '',
    quoteValidUntil: draft.quoteValidUntil ?? vendor.quoteValidUntil ?? null,
    payments: paid.length
      ? [...paid, ...draft.payments.filter((p) => !paid.some((q) => q.label === p.label))]
      : draft.payments,
    status,
  };
}
