import {
  PaymentId,
  createVendor,
  derivePaymentStatus,
  milestonesFromPayments,
  paymentTotals,
  paymentsFromMilestones,
  recommendLocalPicks,
  summariseVendors,
  upcomingVendorPayments,
  vendorFieldsFromLab,
  vendorToExpenseDraft,
} from '../vendors';
import { ExpenseCommitment, PaymentStatus, TaskStatus, VendorStatus } from '../enums';

const FROM = new Date(2027, 0, 4); // Monday 4 Jan 2027
const PAID = '2027-01-02T10:00:00.000Z';

const payment = (id, amount, dueDate = null, paidAt = null) => ({ id, label: id, amount, dueDate, paidAt });

describe('createVendor', () => {
  it('starts with no quote, payments or budget link', () => {
    const vendor = createVendor({ weddingId: 'wed_1', name: 'Abbey', categoryKey: 'venue' });
    expect(vendor.id).toMatch(/^vendor_/);
    expect(vendor).toMatchObject({
      status: VendorStatus.SAVED,
      quotedAmount: null,
      payments: [],
      expenseId: null,
      bookedAt: null,
    });
  });
});

describe('paymentsFromMilestones', () => {
  it('splits a quote into a deposit and the balance it leaves', () => {
    expect(
      paymentsFromMilestones({ quotedAmount: 500000, depositAmount: 100000, depositDueAt: '2027-02-01' })
    ).toEqual([
      { id: PaymentId.DEPOSIT, label: 'Deposit', amount: 100000, dueDate: '2027-02-01', paidAt: null },
      { id: PaymentId.BALANCE, label: 'Final balance', amount: 400000, dueDate: null, paidAt: null },
    ]);
  });

  it('uses an explicit balance over the derived one', () => {
    const payments = paymentsFromMilestones({
      quotedAmount: 500000,
      depositAmount: 100000,
      finalAmount: 300000,
    });
    expect(payments[1].amount).toBe(300000);
  });

  it('leaves out payments with no amount and no date', () => {
    expect(paymentsFromMilestones({ quotedAmount: 500000 }).map((p) => p.id)).toEqual([PaymentId.BALANCE]);
    expect(paymentsFromMilestones({})).toEqual([]);
    expect(paymentsFromMilestones({ depositDueAt: '2027-02-01' })).toEqual([
      { id: PaymentId.DEPOSIT, label: 'Deposit', amount: 0, dueDate: '2027-02-01', paidAt: null },
    ]);
  });

  it('keeps a payment paid when its amounts or dates are edited', () => {
    const existing = [payment(PaymentId.DEPOSIT, 100000, '2027-02-01', PAID)];
    const next = paymentsFromMilestones(
      { quotedAmount: 600000, depositAmount: 150000, depositDueAt: '2027-03-01' },
      existing
    );
    expect(next[0]).toMatchObject({ amount: 150000, dueDate: '2027-03-01', paidAt: PAID });
    expect(next[1].paidAt).toBeNull();
  });

  it('round-trips through milestonesFromPayments', () => {
    const fields = {
      depositAmount: 100000,
      depositDueAt: '2027-02-01',
      finalAmount: 400000,
      finalDueAt: '2027-08-01',
    };
    const vendor = { payments: paymentsFromMilestones({ quotedAmount: 500000, ...fields }) };
    expect(milestonesFromPayments(vendor)).toEqual(fields);
    expect(milestonesFromPayments({})).toEqual({
      depositAmount: null,
      depositDueAt: null,
      finalAmount: null,
      finalDueAt: null,
    });
  });
});

describe('paymentTotals and derivePaymentStatus', () => {
  const vendor = (paidDeposit, paidBalance) => ({
    quotedAmount: 1000,
    payments: [
      payment(PaymentId.DEPOSIT, 300, null, paidDeposit ? PAID : null),
      payment(PaymentId.BALANCE, 700, null, paidBalance ? PAID : null),
    ],
  });

  it('totals what is paid and still owed against the quote', () => {
    expect(paymentTotals(vendor(true, false))).toEqual({ total: 1000, paid: 300, outstanding: 700 });
    expect(paymentTotals(vendor(true, true)).outstanding).toBe(0);
  });

  it('falls back to the scheduled payments without a quote', () => {
    expect(paymentTotals({ payments: [payment('a', 200), payment('b', 300)] }).total).toBe(500);
    expect(paymentTotals(null)).toEqual({ total: 0, paid: 0, outstanding: 0 });
  });

  it('names the payment status', () => {
    expect(derivePaymentStatus(vendor(false, false))).toBe(PaymentStatus.UNPAID);
    expect(derivePaymentStatus(vendor(true, false))).toBe(PaymentStatus.DEPOSIT_PAID);
    expect(derivePaymentStatus(vendor(false, true))).toBe(PaymentStatus.PARTIALLY_PAID);
    expect(derivePaymentStatus(vendor(true, true))).toBe(PaymentStatus.PAID);
  });
});

describe('upcomingVendorPayments', () => {
  const vendors = [
    {
      id: 'v1',
      name: 'Abbey',
      status: VendorStatus.BOOKED,
      payments: [payment('deposit', 300, '2027-01-01', PAID), payment('balance', 700, '2027-03-01')],
    },
    {
      id: 'v2',
      name: 'Bloom',
      status: VendorStatus.BOOKED,
      payments: [payment('deposit', 100, '2027-01-02'), payment('balance', 200)],
    },
    {
      id: 'v3',
      name: 'Quoted',
      status: VendorStatus.QUOTED,
      payments: [payment('deposit', 50, '2027-01-05')],
    },
  ];

  it('lists unpaid payments for booked vendors, soonest first, undated last', () => {
    const rows = upcomingVendorPayments(vendors, { from: FROM });
    expect(rows.map((row) => row.key)).toEqual(['v2:deposit', 'v1:balance', 'v2:balance']);
    expect(rows[0]).toMatchObject({ vendorName: 'Bloom', overdue: true, daysUntil: -2 });
    expect(rows[2]).toMatchObject({ daysUntil: null, overdue: false });
  });

  it('respects the limit', () => {
    expect(upcomingVendorPayments(vendors, { from: FROM, limit: 1 })).toHaveLength(1);
  });
});

describe('vendorToExpenseDraft', () => {
  it('maps a booked vendor with its deposit paid to a committed expense', () => {
    const vendor = {
      id: 'v1',
      name: 'Abbey',
      categoryKey: 'venue',
      status: VendorStatus.BOOKED,
      quotedAmount: 1000,
      payments: [payment('deposit', 300, '2027-01-01', PAID), payment('balance', 700, '2027-03-01')],
    };
    expect(vendorToExpenseDraft(vendor, 'wed_1')).toEqual({
      weddingId: 'wed_1',
      vendorId: 'v1',
      vendorName: 'Abbey',
      title: 'Abbey (Venues)',
      amount: 1000,
      paidAmount: 300,
      paymentStatus: PaymentStatus.DEPOSIT_PAID,
      commitment: ExpenseCommitment.COMMITTED,
      dueDate: '2027-03-01',
    });
  });

  it('treats an unbooked vendor as an estimate', () => {
    const draft = vendorToExpenseDraft(
      { id: 'v', name: 'X', status: VendorStatus.QUOTED, quotedAmount: 50 },
      'w'
    );
    expect(draft.commitment).toBe(ExpenseCommitment.ESTIMATED);
    expect(draft.title).toBe('X');
  });
});

describe('vendorFieldsFromLab', () => {
  it('maps the Labs shape onto the vendor model', () => {
    const fields = vendorFieldsFromLab(
      {
        name: ' Rosewood ',
        categoryKey: 'florals',
        status: VendorStatus.BOOKED,
        contractTotal: 370000,
        payments: [
          { id: 'pay_1', label: 'Deposit', amount: 111000, dueDate: '2027-02-15', paidAt: PAID },
          { id: 'pay_2', label: 'Balance', amount: 259000, dueDate: null, paidAt: null },
        ],
        expenseId: 'exp_1',
        bookedAt: PAID,
      },
      'wed_1'
    );
    expect(fields).toEqual({
      weddingId: 'wed_1',
      categoryKey: 'florals',
      name: 'Rosewood',
      status: VendorStatus.BOOKED,
      quotedAmount: 370000,
      payments: [
        { id: PaymentId.DEPOSIT, label: 'Deposit', amount: 111000, dueDate: '2027-02-15', paidAt: PAID },
        { id: PaymentId.BALANCE, label: 'Final balance', amount: 259000, dueDate: null, paidAt: null },
      ],
      expenseId: 'exp_1',
      bookedAt: PAID,
    });
  });

  it('fills in safe defaults for missing or unknown values', () => {
    expect(vendorFieldsFromLab({ status: 'nonsense', contractTotal: 0 })).toMatchObject({
      name: 'Vendor',
      status: VendorStatus.SAVED,
      quotedAmount: null,
      payments: [],
      weddingId: null,
    });
  });

  it('keeps custom instalments under their own id', () => {
    const fields = vendorFieldsFromLab({ payments: [{ id: 'pay_9', label: 'Second payment', amount: 5 }] });
    expect(fields.payments[0]).toMatchObject({ id: 'pay_9', label: 'Second payment' });
  });
});

describe('summariseVendors', () => {
  it('counts saved and booked vendors per category', () => {
    const summary = summariseVendors([
      { categoryKey: 'venue', status: VendorStatus.BOOKED },
      { categoryKey: 'venue', status: VendorStatus.QUOTED },
      { status: VendorStatus.SAVED },
    ]);
    expect(summary).toEqual({
      total: 3,
      booked: 1,
      byCategory: { venue: { saved: 2, booked: 1 }, other: { saved: 1, booked: 0 } },
    });
  });
});

describe('recommendLocalPicks', () => {
  it('puts categories whose booking window is open first', () => {
    const picks = recommendLocalPicks({ weddingDate: '2027-09-01', from: FROM });
    expect(picks[0]).toMatchObject({ key: 'venue', urgency: 'now' });
    expect(picks.find((pick) => pick.key === 'cake').urgency).toBe('later');
  });

  it('moves categories the plan marks as booked to the end', () => {
    const tasks = [{ title: 'Book your photographer', status: TaskStatus.DONE }];
    const picks = recommendLocalPicks({ weddingDate: '2027-09-01', tasks, from: FROM });
    expect(picks.at(-1)).toMatchObject({ key: 'photography', urgency: 'booked' });
  });

  it('leads with long-lead categories when there is no date', () => {
    const picks = recommendLocalPicks({ from: FROM });
    expect(picks[0].lead).toBeGreaterThanOrEqual(9);
  });
});
