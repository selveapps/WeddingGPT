import { VENDOR_CATEGORIES, paymentTotals } from '@/models';

import {
  ATTENTION_STATUSES,
  CLOSED_STATUSES,
  IN_PROGRESS_STATUSES,
  VENDOR_SORT,
  VendorFilter,
  VendorStatus,
} from './vendorConstants';

export function filterVendors(vendors, filter) {
  switch (filter) {
    case VendorFilter.NEEDS_ATTENTION:
      return vendors.filter((vendor) => ATTENTION_STATUSES.includes(vendor.status));
    case VendorFilter.IN_PROGRESS:
      return vendors.filter((vendor) => IN_PROGRESS_STATUSES.includes(vendor.status));
    case VendorFilter.BOOKED:
      return vendors.filter((vendor) => vendor.status === VendorStatus.BOOKED);
    case VendorFilter.PASSED:
      return vendors.filter(
        (vendor) => CLOSED_STATUSES.includes(vendor.status) && vendor.status !== VendorStatus.BOOKED
      );
    default:
      return vendors;
  }
}

/** Search by name, contact, city and notes; a blank query matches everything. */
export function searchVendors(vendors, query) {
  const term = (query ?? '').trim().toLocaleLowerCase();
  if (!term) return vendors;
  return vendors.filter((vendor) =>
    [vendor.name, vendor.contactName, vendor.city, vendor.notes]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase().includes(term))
  );
}

const byName = (a, b) => (a.name ?? '').localeCompare(b.name ?? '');

export function sortVendors(vendors, sort = VENDOR_SORT.UPDATED) {
  return [...vendors].sort((a, b) => {
    switch (sort) {
      case VENDOR_SORT.NAME:
        return byName(a, b);
      case VENDOR_SORT.STATUS:
        return (a.status ?? '').localeCompare(b.status ?? '') || byName(a, b);
      case VENDOR_SORT.AMOUNT:
        return (b.quotedAmount ?? -1) - (a.quotedAmount ?? -1);
      case VENDOR_SORT.CATEGORY:
        return (a.categoryKey ?? '').localeCompare(b.categoryKey ?? '') || byName(a, b);
      default:
        return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
    }
  });
}

/**
 * Headline numbers for the list screen. Money counts booked vendors only -
 * a quote is not owed until it is signed.
 */
export function summariseVendorList(vendors) {
  return vendors.reduce(
    (summary, vendor) => {
      summary.total += 1;
      if (vendor.status === VendorStatus.BOOKED) {
        const totals = paymentTotals(vendor);
        summary.booked += 1;
        summary.bookedAmount += totals.total;
        summary.paid += totals.paid;
        summary.outstanding += totals.outstanding;
      } else if (ATTENTION_STATUSES.includes(vendor.status)) {
        summary.needsAttention += 1;
      } else if (IN_PROGRESS_STATUSES.includes(vendor.status)) {
        summary.inProgress += 1;
      }
      return summary;
    },
    { total: 0, booked: 0, bookedAmount: 0, paid: 0, outstanding: 0, needsAttention: 0, inProgress: 0 }
  );
}

export function vendorCategory(categoryKey) {
  return VENDOR_CATEGORIES.find((category) => category.key === categoryKey) ?? null;
}

/** "mailto:", "tel:" or an https URL for a contact detail. */
export function contactUrl(value, kind) {
  if (kind === 'website') return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return `${kind}:${value}`;
}
