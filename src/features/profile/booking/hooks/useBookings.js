import { useCallback, useMemo } from 'react';

import { useVendorStore, selectAllVendors } from '@/store/vendorStore';
import { useWeddingStore, selectWedding } from '@/store/weddingStore';
import { filterBookings, sortBookings, summariseBookings } from '../lib/bookingHelpers';
import { BOOKING_SORT } from '../lib/bookingConstants';

export function useBookings({ filter = 'all', sort = BOOKING_SORT.UPDATED } = {}) {
  const allBookings = useVendorStore(selectAllVendors);
  const wedding = useWeddingStore(selectWedding);
  const addVendor = useVendorStore((state) => state.addVendor);
  const updateVendor = useVendorStore((state) => state.updateVendor);
  const deleteVendor = useVendorStore((state) => state.deleteVendor);

  const bookings = useMemo(
    () => sortBookings(filterBookings(allBookings, filter), sort),
    [allBookings, filter, sort]
  );
  const summary = useMemo(() => summariseBookings(allBookings), [allBookings]);

  const createBooking = useCallback(
    (values) => addVendor({ ...values, weddingId: wedding?.id }),
    [addVendor, wedding?.id]
  );

  const updateBooking = useCallback(
    (id, patch) => updateVendor(id, patch),
    [updateVendor]
  );

  const removeBooking = useCallback((id) => deleteVendor(id), [deleteVendor]);

  const updateStatus = useCallback(
    (booking, status) => {
      if (!booking) return null;
      const now = new Date().toISOString();
      return updateVendor(booking.id, {
        status,
        bookedAt: status === 'booked' ? now : null,
        ...(status === 'contacted' ? { lastContactedAt: now } : {}),
      });
    },
    [updateVendor]
  );

  return {
    bookings,
    allBookings,
    summary,
    wedding,
    currency: wedding?.currency ?? 'USD',
    createBooking,
    updateBooking,
    removeBooking,
    updateStatus,
  };
}
