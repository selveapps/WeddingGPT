import { formatINR, normalizePayment, summarizePayments, toAmount } from '../vendorPaymentModel';

describe('vendor payment model', () => {
  test('parses rupee-formatted values safely', () => {
    expect(toAmount('₹1,25,000')).toBe(125000);
    expect(toAmount('-4')).toBe(0);
    expect(toAmount('nope')).toBe(0);
  });
  test('normalizes status and caps paid amount at total', () => {
    expect(normalizePayment({ name: 'Photo', total: '1000', paid: '1200' })).toMatchObject({ total: 1000, paid: 1000, status: 'Paid' });
    expect(normalizePayment({ name: 'Venue', total: 1000, paid: 300 }).status).toBe('Part-paid');
  });
  test('calculates total, paid and outstanding balance', () => {
    expect(summarizePayments([{ total: 1000, paid: 250 }, { total: 500, paid: 500 }])).toEqual({ total: 1500, paid: 750, remaining: 750, outstandingCount: 1 });
  });
  test('requires a vendor name and positive total', () => {
    expect(() => normalizePayment({ name: '', total: 100 })).toThrow('Enter a vendor');
    expect(() => normalizePayment({ name: 'Venue', total: 0 })).toThrow('greater than zero');
  });
  test('formats INR currency', () => {
    expect(formatINR(1000)).toContain('1,000');
  });
});
