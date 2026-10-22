import { VendorStatus, PaymentStatus, ExpenseCommitment } from '@/models';

import {
  buildPaymentSchedule,
  defaultBalanceDue,
  derivePaymentStatus,
  nextStatus,
  summariseVendorPipeline,
  toExpenseDraft,
  upcomingPayments,
} from '../model';

const FROM = new Date(2027, 0, 10);

const vendor = (fields) => ({
  id: fields.id ?? 'v1',
  name: 'Rosewood',
  categoryKey: 'florals',
  status: VendorStatus.BOOKED,
  contractTotal: 100000,
  payments: [],
  ...fields,
});

describe('nextStatus', () => {
  it('walks the pipeline and stops at booked', () => {
    expect(nextStatus(VendorStatus.SAVED)).toBe(VendorStatus.CONTACTED);
    expect(nextStatus(VendorStatus.MEETING_SCHEDULED)).toBe(VendorStatus.BOOKED);
    expect(nextStatus(VendorStatus.BOOKED)).toBe(VendorStatus.BOOKED);
    expect(nextStatus(VendorStatus.PASSED)).toBe(VendorStatus.PASSED);
  });
});

describe('buildPaymentSchedule', () => {
  it('splits into deposit and balance that sum to the total', () => {
    const payments = buildPaymentSchedule({ total: 100001, depositPercent: 33 });
    expect(payments.map((p) => p.label)).toEqual(['Deposit', 'Balance']);
    expect(payments[0].amount + payments[1].amount).toBe(100001);
  });

  it('handles 0% and 100% deposits and empty totals', () => {
    expect(buildPaymentSchedule({ total: 5000, depositPercent: 0 }).map((p) => p.label)).toEqual(['Balance']);
    expect(buildPaymentSchedule({ total: 5000, depositPercent: 100 }).map((p) => p.label)).toEqual(['Deposit']);
    expect(buildPaymentSchedule({ total: 0 })).toEqual([]);
  });
});

it('sets the balance two weeks before the wedding', () => {
  expect(defaultBalanceDue('2027-06-19')).toBe('2027-06-05');
  expect(defaultBalanceDue(null)).toBeNull();
});

describe('summariseVendorPipeline', () => {
  it('counts every vendor but only owes money for booked ones', () => {
    const summary = summariseVendorPipeline([
      vendor({ id: 'a', payments: [{ id: 'p', label: 'Deposit', amount: 30000, paidAt: '2027-01-01' }] }),
      vendor({ id: 'b', status: VendorStatus.QUOTED, contractTotal: 50000 }),
    ]);
    expect(summary).toMatchObject({ total: 2, booked: 1, contracted: 100000, paid: 30000, outstanding: 70000 });
  });
});

describe('upcomingPayments', () => {
  it('lists unpaid instalments soonest first and flags overdue ones', () => {
    const rows = upcomingPayments(
      [
        vendor({
          payments: [
            { id: 'late', label: 'Deposit', amount: 1, dueDate: '2027-01-05', paidAt: null },
            { id: 'none', label: 'Extra', amount: 1, dueDate: null, paidAt: null },
            { id: 'soon', label: 'Balance', amount: 1, dueDate: '2027-02-01', paidAt: null },
            { id: 'done', label: 'Paid', amount: 1, dueDate: '2027-01-01', paidAt: 'x' },
          ],
        }),
      ],
      { from: FROM }
    );
    expect(rows.map((r) => r.id)).toEqual(['late', 'soon', 'none']);
    expect(rows[0].overdue).toBe(true);
  });
});

describe('toExpenseDraft', () => {
  it('maps a booked vendor with its deposit paid', () => {
    const v = vendor({
      payments: [
        { id: 'd', label: 'Deposit', amount: 30000, dueDate: null, paidAt: 'x' },
        { id: 'b', label: 'Balance', amount: 70000, dueDate: '2027-06-05', paidAt: null },
      ],
    });
    expect(derivePaymentStatus(v)).toBe(PaymentStatus.DEPOSIT_PAID);
    expect(toExpenseDraft(v, 'w1')).toMatchObject({
      weddingId: 'w1',
      vendorId: 'v1',
      title: 'Rosewood (Florals and decor)',
      amount: 100000,
      paidAmount: 30000,
      commitment: ExpenseCommitment.COMMITTED,
      dueDate: '2027-06-05',
    });
  });
});
