import {
  VendorStatus,
  VENDOR_CATEGORIES,
  PaymentStatus,
  ExpenseCommitment,
} from '@/models';
import { addDays, daysUntil } from '@/lib/date';
import { createId } from '@/lib/id';

/**
 * Vendor manager (Labs).
 *
 * A vendor here carries its contract total and a payment schedule (deposit,
 * balance, or any custom instalments), so the couple can see what they owe and
 * when. Amounts are minor units (cents), like the budget.
 */

/** The happy path a vendor moves along; closed states sit outside it. */
export const PIPELINE = [
  VendorStatus.SAVED,
  VendorStatus.CONTACTED,
  VendorStatus.QUOTED,
  VendorStatus.MEETING_SCHEDULED,
  VendorStatus.BOOKED,
];

export const CLOSED_STATUSES = [VendorStatus.DECLINED, VendorStatus.PASSED];

/** The next step along the pipeline; booked and closed vendors stay put. */
export function nextStatus(status) {
  const index = PIPELINE.indexOf(status);
  if (index === -1 || index === PIPELINE.length - 1) return status;
  return PIPELINE[index + 1];
}

export function categoryName(key) {
  return VENDOR_CATEGORIES.find((category) => category.key === key)?.name ?? 'Other';
}

/** Balances are commonly due two weeks before the day. */
export const BALANCE_DAYS_BEFORE = 14;

export function defaultBalanceDue(weddingDate) {
  return weddingDate ? addDays(weddingDate, -BALANCE_DAYS_BEFORE) : null;
}

/**
 * Split a contract into a deposit and a balance. The balance absorbs rounding
 * so the payments always sum to exactly `total`.
 */
export function buildPaymentSchedule({
  total,
  depositPercent = 30,
  depositDue = null,
  balanceDue = null,
} = {}) {
  if (!(total > 0)) return [];
  const percent = Math.min(100, Math.max(0, Number(depositPercent) || 0));
  const deposit = Math.round((total * percent) / 100);
  const payments = [];

  if (deposit > 0) {
    payments.push({ id: createId('pay'), label: 'Deposit', amount: deposit, dueDate: depositDue, paidAt: null });
  }
  if (total - deposit > 0) {
    payments.push({
      id: createId('pay'),
      label: 'Balance',
      amount: total - deposit,
      dueDate: balanceDue,
      paidAt: null,
    });
  }
  return payments;
}

export function paymentTotals(vendor) {
  const total = vendor?.contractTotal ?? 0;
  const paid = (vendor?.payments ?? [])
    .filter((payment) => payment.paidAt)
    .reduce((sum, payment) => sum + payment.amount, 0);
  return { total, paid, outstanding: Math.max(0, total - paid) };
}

/** Headline numbers. Money totals count booked vendors only - quotes are not owed. */
export function summariseVendorPipeline(vendors = []) {
  const byStatus = {};
  let contracted = 0;
  let paid = 0;

  for (const vendor of vendors) {
    byStatus[vendor.status] = (byStatus[vendor.status] ?? 0) + 1;
    if (vendor.status !== VendorStatus.BOOKED) continue;
    const totals = paymentTotals(vendor);
    contracted += totals.total;
    paid += totals.paid;
  }

  return {
    total: vendors.length,
    booked: byStatus[VendorStatus.BOOKED] ?? 0,
    byStatus,
    contracted,
    paid,
    outstanding: Math.max(0, contracted - paid),
  };
}

/** Unpaid instalments for booked vendors, soonest first; undated ones last. */
export function upcomingPayments(vendors = [], { from = new Date(), limit = 5 } = {}) {
  const rows = [];
  for (const vendor of vendors) {
    if (vendor.status !== VendorStatus.BOOKED) continue;
    for (const payment of vendor.payments ?? []) {
      if (payment.paidAt) continue;
      const days = payment.dueDate ? daysUntil(payment.dueDate, from) : null;
      rows.push({
        ...payment,
        vendorId: vendor.id,
        vendorName: vendor.name,
        daysUntil: days,
        overdue: days !== null && days < 0,
      });
    }
  }

  rows.sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  return rows.slice(0, limit);
}

export function derivePaymentStatus(vendor) {
  const { total, paid } = paymentTotals(vendor);
  if (total > 0 && paid >= total) return PaymentStatus.PAID;
  if (paid === 0) return PaymentStatus.UNPAID;
  const onlyDeposit = (vendor.payments ?? []).every(
    (payment) => Boolean(payment.paidAt) === (payment.label === 'Deposit')
  );
  return onlyDeposit ? PaymentStatus.DEPOSIT_PAID : PaymentStatus.PARTIALLY_PAID;
}

/**
 * The fields `useBudgetStore().addExpense` takes, for a vendor. Booked means
 * contractually owed, so it lands as committed; anything earlier is an estimate.
 */
export function toExpenseDraft(vendor, weddingId) {
  const { total, paid } = paymentTotals(vendor);
  const nextDue = (vendor.payments ?? []).find((payment) => !payment.paidAt)?.dueDate ?? null;

  return {
    weddingId,
    vendorId: vendor.id,
    vendorName: vendor.name,
    title: `${vendor.name} (${categoryName(vendor.categoryKey)})`,
    amount: total,
    paidAmount: paid,
    paymentStatus: derivePaymentStatus(vendor),
    commitment:
      vendor.status === VendorStatus.BOOKED ? ExpenseCommitment.COMMITTED : ExpenseCommitment.ESTIMATED,
    dueDate: nextDue,
  };
}
