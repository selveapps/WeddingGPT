import {
  ATTENTION_STATUSES,
  BOOKING_SORT,
  CLOSED_STATUSES,
  IN_PROGRESS_STATUSES,
} from './bookingConstants';

export function filterBookings(bookings, filter) {
  switch (filter) {
    case 'needs_attention':
      return bookings.filter((booking) => ATTENTION_STATUSES.includes(booking.status));
    case 'in_progress':
      return bookings.filter((booking) => IN_PROGRESS_STATUSES.includes(booking.status));
    case 'booked':
      return bookings.filter((booking) => booking.status === 'booked');
    case 'passed':
      return bookings.filter((booking) => CLOSED_STATUSES.includes(booking.status) && booking.status !== 'booked');
    default:
      return bookings;
  }
}

export function sortBookings(bookings, sort = BOOKING_SORT.UPDATED) {
  return [...bookings].sort((a, b) => {
    switch (sort) {
      case BOOKING_SORT.NAME:
        return a.name.localeCompare(b.name);
      case BOOKING_SORT.STATUS:
        return (a.status ?? '').localeCompare(b.status ?? '') || a.name.localeCompare(b.name);
      case BOOKING_SORT.AMOUNT:
        return (b.quotedAmount ?? -1) - (a.quotedAmount ?? -1);
      case BOOKING_SORT.CATEGORY:
        return (a.categoryKey ?? '').localeCompare(b.categoryKey ?? '') || a.name.localeCompare(b.name);
      default:
        return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
    }
  });
}

export function summariseBookings(bookings) {
  return bookings.reduce(
    (summary, booking) => {
      summary.total += 1;
      if (booking.status === 'booked') {
        summary.booked += 1;
        summary.bookedAmount += booking.quotedAmount ?? 0;
      } else if (ATTENTION_STATUSES.includes(booking.status)) {
        summary.needsAttention += 1;
      } else if (IN_PROGRESS_STATUSES.includes(booking.status)) {
        summary.inProgress += 1;
      }
      return summary;
    },
    { total: 0, booked: 0, bookedAmount: 0, needsAttention: 0, inProgress: 0 }
  );
}

export function getBookingCategory(categoryKey, categories) {
  return categories.find((category) => category.key === categoryKey) ?? null;
}

export function buildPaymentMilestones(booking) {
  if (!booking?.quotedAmount) return [];

  const milestones = [
    {
      id: 'deposit',
      label: 'Deposit',
      amount: booking.depositAmount,
      dueAt: booking.depositDueAt,
    },
    {
      id: 'final',
      label: 'Final balance',
      amount: booking.finalAmount ?? Math.max(0, booking.quotedAmount - (booking.depositAmount ?? 0)),
      dueAt: booking.finalDueAt,
    },
  ];

  return milestones.filter((milestone) => milestone.amount || milestone.dueAt);
}
