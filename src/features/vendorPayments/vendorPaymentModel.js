/**
 * Vendor payment schedules — deposits, balances, due dates, receipts, reminders.
 */

export const VENDOR_PAYMENTS_KEY = 'tools:vendor-payments:v2';

export const PaymentStatus = Object.freeze({
  PLANNED: 'planned',
  DUE: 'due',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
});

export const PaymentKind = Object.freeze({
  DEPOSIT: 'deposit',
  INSTALLMENT: 'installment',
  BALANCE: 'balance',
  TIP: 'tip',
  EXTRA: 'extra',
});

export function createId(prefix = 'pay') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyPaymentsState() {
  return {
    version: 2,
    items: [],
    currency: 'INR',
    notes: '',
    updatedAt: null,
  };
}

export function createPayment(partial = {}) {
  return {
    id: createId(),
    vendorName: '',
    vendorId: null,
    kind: PaymentKind.DEPOSIT,
    title: '',
    amount: '',
    paidAmount: '',
    dueDate: '',
    paidDate: '',
    status: PaymentStatus.PLANNED,
    method: '',
    reference: '',
    notes: '',
    remindDaysBefore: 7,
    ...partial,
  };
}

export function normalisePaymentsState(raw) {
  const base = emptyPaymentsState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    items: Array.isArray(raw.items) ? raw.items : [],
  };
}

export function parseAmount(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, v);
  const n = Number(String(v ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function deriveStatus(item, today = new Date()) {
  if (item.status === PaymentStatus.CANCELLED || item.status === PaymentStatus.PAID) {
    return item.status;
  }
  const due = item.dueDate ? new Date(item.dueDate) : null;
  const iso = today.toISOString().slice(0, 10);
  if (parseAmount(item.paidAmount) >= parseAmount(item.amount) && parseAmount(item.amount) > 0) {
    return PaymentStatus.PAID;
  }
  if (due && !Number.isNaN(due.getTime())) {
    const dueIso = due.toISOString().slice(0, 10);
    if (dueIso < iso) return PaymentStatus.OVERDUE;
    if (dueIso === iso) return PaymentStatus.DUE;
  }
  return item.status === PaymentStatus.DUE ? PaymentStatus.DUE : PaymentStatus.PLANNED;
}

export function paymentsSummary(items = [], currency = 'INR') {
  let planned = 0;
  let paid = 0;
  let overdue = 0;
  let dueSoon = 0;
  const today = new Date();
  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  for (const item of items) {
    const status = deriveStatus(item, today);
    const amt = parseAmount(item.amount);
    const paidAmt = parseAmount(item.paidAmount);
    paid += paidAmt;
    if (status !== PaymentStatus.PAID && status !== PaymentStatus.CANCELLED) {
      planned += Math.max(0, amt - paidAmt);
    }
    if (status === PaymentStatus.OVERDUE) overdue += Math.max(0, amt - paidAmt);
    if (item.dueDate) {
      const d = new Date(item.dueDate);
      if (!Number.isNaN(d.getTime()) && d >= today && d <= in7 && status !== PaymentStatus.PAID) {
        dueSoon += 1;
      }
    }
  }
  return { planned, paid, overdue, dueSoon, total: planned + paid, currency };
}

export function sortPayments(items = []) {
  return [...items].sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')));
}

export function filterPayments(items, { status = null, query = '' } = {}) {
  const q = String(query).trim().toLowerCase();
  return items.filter((item) => {
    const st = deriveStatus(item);
    if (status && st !== status) return false;
    if (!q) return true;
    return [item.vendorName, item.title, item.reference, item.notes].join(' ').toLowerCase().includes(q);
  });
}

export function markPaid(item, paidDate = new Date().toISOString().slice(0, 10)) {
  return {
    ...item,
    paidAmount: item.amount,
    paidDate,
    status: PaymentStatus.PAID,
  };
}

export function formatMoney(amount, currency = 'INR', locale = 'en-IN') {
  const n = parseAmount(amount);
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

export function paymentReminders(items = [], today = new Date()) {
  const iso = today.toISOString().slice(0, 10);
  return items.filter((item) => {
    if (deriveStatus(item, today) === PaymentStatus.PAID) return false;
    if (!item.dueDate) return false;
    const due = new Date(item.dueDate);
    if (Number.isNaN(due.getTime())) return false;
    const remind = new Date(due);
    remind.setDate(remind.getDate() - (item.remindDaysBefore || 7));
    const remindIso = remind.toISOString().slice(0, 10);
    return remindIso <= iso && item.dueDate >= iso;
  });
}

export function exportPaymentsCsv(items = []) {
  const header = ['vendorName', 'kind', 'title', 'amount', 'paidAmount', 'dueDate', 'paidDate', 'status', 'method', 'reference'];
  const rows = items.map((i) => {
    const withStatus = { ...i, status: deriveStatus(i) };
    return header.map((h) => {
      const s = String(withStatus[h] ?? '');
      return s.includes(',') ? `"${s}"` : s;
    }).join(',');
  });
  return [header.join(','), ...rows].join('\n');
}

export function seedSamplePayments() {
  return [
    createPayment({
      vendorName: 'Photographer',
      kind: PaymentKind.DEPOSIT,
      title: 'Booking deposit',
      amount: '25000',
      dueDate: '',
      status: PaymentStatus.PLANNED,
    }),
    createPayment({
      vendorName: 'Venue',
      kind: PaymentKind.BALANCE,
      title: 'Final venue balance',
      amount: '150000',
      dueDate: '',
      status: PaymentStatus.PLANNED,
      remindDaysBefore: 14,
    }),
  ];
}

export default {
  VENDOR_PAYMENTS_KEY,
  emptyPaymentsState,
  createPayment,
  paymentsSummary,
  deriveStatus,
  markPaid,
  exportPaymentsCsv,
};
