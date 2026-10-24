import { paymentTotals, VENDOR_CATEGORIES, VENDOR_STATUS_META } from '@/models';
import { formatMoney } from '@/lib/currency';
import { formatMediumDate, todayISO } from '@/lib/date';

export function vendorCategoriesForComparison(vendors = []) {
  const counts = vendors.reduce((result, vendor) => {
    if (vendor.categoryKey) result[vendor.categoryKey] = (result[vendor.categoryKey] ?? 0) + 1;
    return result;
  }, {});

  return VENDOR_CATEGORIES.filter((category) => counts[category.key] >= 2);
}

function quoteAmount(vendor) {
  if (vendor.quotedAmount != null) return vendor.quotedAmount;
  const scheduled = (vendor.payments ?? []).reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  return scheduled > 0 ? scheduled : null;
}

function displayMoney(amount, currency) {
  return amount == null ? 'No quote yet' : formatMoney(amount, currency);
}

function relevantMeetingDate(vendor) {
  const upcoming = (vendor.meetings ?? [])
    .map((meeting) => meeting.date)
    .filter((date) => date && date >= todayISO())
    .sort();
  if (upcoming.length) return upcoming[0];

  const past = (vendor.meetings ?? [])
    .map((meeting) => meeting.date)
    .filter(Boolean)
    .sort()
    .reverse();
  return vendor.meetingAt ?? past[0] ?? null;
}

export function buildVendorComparison(vendors, currency = 'USD') {
  if (vendors.length !== 2) return null;

  const [first, second] = vendors;
  if (!first.categoryKey || first.categoryKey !== second.categoryKey) return null;

  const amounts = vendors.map(quoteAmount);
  const totals = vendors.map(paymentTotals);
  const rows = [
    {
      label: 'Status',
      values: vendors.map((vendor) => VENDOR_STATUS_META[vendor.status]?.label ?? 'Not set'),
    },
    { label: 'Quoted total', values: amounts.map((amount) => displayMoney(amount, currency)) },
    {
      label: 'Quote includes',
      values: vendors.map((vendor) => vendor.quoteScope?.trim() || 'Not noted'),
    },
    { label: 'City', values: vendors.map((vendor) => vendor.city?.trim() || 'Not set') },
    {
      label: 'Meeting',
      values: vendors.map((vendor) =>
        relevantMeetingDate(vendor) ? formatMediumDate(relevantMeetingDate(vendor)) : 'Not scheduled'
      ),
    },
    {
      label: 'Quote valid until',
      values: vendors.map((vendor) =>
        vendor.quoteValidUntil ? formatMediumDate(vendor.quoteValidUntil) : 'Not provided'
      ),
    },
    {
      label: 'Paid so far',
      values: totals.map((total) => formatMoney(total.paid, currency)),
    },
    {
      label: 'Still outstanding',
      values: totals.map((total, index) =>
        amounts[index] == null ? 'No quote yet' : formatMoney(total.outstanding, currency)
      ),
    },
  ];

  return {
    category: VENDOR_CATEGORIES.find((category) => category.key === first.categoryKey) ?? null,
    vendors,
    rows,
    quoteDifference:
      amounts.every((amount) => amount != null) && amounts[0] !== amounts[1]
        ? {
            amount: Math.abs(amounts[0] - amounts[1]),
            lowerVendorName: vendors[amounts[0] < amounts[1] ? 0 : 1].name,
          }
        : null,
  };
}

export function vendorComparisonText(comparison) {
  if (!comparison) return '';

  const details = comparison.vendors.map((vendor, index) => {
    const values = comparison.rows.map((row) => `${row.label}: ${row.values[index]}`);
    return `${vendor.name}\n${values.join('\n')}`;
  });

  return `${comparison.category?.name ?? 'Vendor'} comparison\n\n${details.join('\n\n')}`;
}
