export const PAYMENT_STATUSES = ['Planned', 'Part-paid', 'Paid'];

export function toAmount(value) {
  const amount = Number(String(value ?? '').replace(/[,₹\s]/g, ''));
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export function summarizePayments(payments = []) {
  return payments.reduce(
    (summary, payment) => {
      const total = toAmount(payment.total);
      const paid = Math.min(toAmount(payment.paid), total);
      summary.total += total;
      summary.paid += paid;
      summary.remaining += Math.max(0, total - paid);
      if (total > paid) summary.outstandingCount += 1;
      return summary;
    },
    { total: 0, paid: 0, remaining: 0, outstandingCount: 0 },
  );
}

export function normalizePayment(input) {
  const total = toAmount(input.total);
  const paid = Math.min(toAmount(input.paid), total);
  const name = String(input.name ?? '').trim();
  if (!name) throw new Error('Enter a vendor or service name.');
  if (total <= 0) throw new Error('Enter a total amount greater than zero.');
  return {
    ...input,
    name,
    total,
    paid,
    status: paid >= total ? 'Paid' : paid > 0 ? 'Part-paid' : 'Planned',
  };
}

export function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(toAmount(value));
}
