import { VendorStatus } from '@/models';

import { SAMPLE_QUOTE, extractQuote, hasFindings, quoteSummary, toVendorDraft } from '../model';

const FROM = new Date(2027, 0, 10);

describe('extractQuote on the sample', () => {
  const result = extractQuote(SAMPLE_QUOTE, { from: FROM });

  it('finds the vendor, total, deposit and balance', () => {
    expect(result).toMatchObject({
      vendorName: 'Rosewood Florals',
      total: 370000,
      depositPercent: 30,
      deposit: 111000,
      balance: 259000,
      eventDate: '2027-06-19',
      expiresOn: '2027-01-31',
    });
  });

  it('lists line items with the right amounts', () => {
    expect(result.lineItems.map((item) => [item.label, item.amount])).toEqual([
      ['Bridal bouquet', 35000],
      ['Bridesmaid bouquets (4 x $85)', 34000],
      ['Ceremony arch flowers', 120000],
      ['Centerpieces (12)', 156000],
      ['Delivery and setup', 25000],
    ]);
  });

  it('labels payment dates and flags the fine print', () => {
    expect(result.dates).toEqual([
      { label: 'Deposit due', iso: '2027-02-15' },
      { label: 'Balance due', iso: '2027-06-05' },
    ]);
    expect(result.finePrint.map((f) => f.key)).toEqual(['non_refundable', 'cancellation']);
  });

  it('warns that the quote expires before the deposit is due', () => {
    expect(result.warnings).toEqual([expect.stringMatching(/expires Jan 31, 2027/)]);
  });
});

it('warns when line items do not add up', () => {
  const result = extractQuote('DJ package: $1,500\nUplighting: $300\nTotal: $2,000', { from: FROM });
  expect(result.warnings[0]).toMatch(/add up to \$1,800/);
});

it('accepts a total that includes listed tax and fees', () => {
  const result = extractQuote('Dinner: $5,000\nService charge: $1,000\nSubtotal: $5,000\nTotal: $6,000', {
    from: FROM,
  });
  expect(result.warnings).toEqual([]);
  expect(result.total).toBe(600000);
});

it('falls back to the line item sum without a total line', () => {
  expect(extractQuote('Cake: $400\nDelivery: $50', { from: FROM }).total).toBe(45000);
});

it('handles empty input', () => {
  expect(hasFindings(extractQuote(''))).toBe(false);
});

it('summarises and converts to a vendor with the quoted dates', () => {
  const result = extractQuote(SAMPLE_QUOTE, { from: FROM });
  expect(quoteSummary(result)).toContain('Deposit: $1,110 (30%)');
  const vendor = toVendorDraft(result, 'florals');
  expect(vendor).toMatchObject({
    name: 'Rosewood Florals',
    status: VendorStatus.QUOTED,
    quotedAmount: 370000,
  });
  expect(vendor.payments.map((p) => [p.label, p.amount, p.dueDate])).toEqual([
    ['Deposit', 111000, '2027-02-15'],
    ['Final balance', 259000, '2027-06-05'],
  ]);
});
