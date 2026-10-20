import React, { useCallback, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { EmptyState, PageHeader, Screen, Stack, useToast } from '@/design-system/components';
import { selectVendorById, useVendorStore } from '@/store/vendorStore';
import { Routes } from '@/navigation/routes';
import { useBookings } from './hooks/useBookings';
import { useBookingForm } from './hooks/useBookingForm';
import { BookingForm } from './components/BookingForm';
import { BOOKING_COPY } from './lib/bookingConstants';

export function BookingFormScreen({ editing: editingProp }) {
  const params = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const id = String(params.id ?? '');
  const booking = useVendorStore(selectVendorById(id));
  const editing = editingProp ?? Boolean(id);
  const { createBooking, updateBooking, currency } = useBookings();
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    (values) => {
      setSaving(true);
      try {
        if (editing && booking) updateBooking(booking.id, values);
        else createBooking(values);
        toast.success(BOOKING_COPY.saveSuccess);
        router.replace(editing && booking ? Routes.bookingDetail(booking.id) : Routes.bookingTracker);
      } finally {
        setSaving(false);
      }
    },
    [booking, createBooking, editing, router, toast, updateBooking]
  );

  const form = useBookingForm(editing ? booking : null, save);

  if (editing && !booking) {
    return (
      <Screen>
        <EmptyState
          icon="vendors"
          title="Booking not found"
          message="This booking may have been removed."
          actionLabel="Back to bookings"
          onAction={() => router.replace(Routes.bookingTracker)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack gap="lg">
        <PageHeader
          eyebrow={editing ? BOOKING_COPY.formEyebrowEdit : BOOKING_COPY.formEyebrowAdd}
          title={editing ? BOOKING_COPY.formTitleEdit : BOOKING_COPY.formTitleAdd}
          subtitle={BOOKING_COPY.formSubtitle}
        />
        <BookingForm
          values={form.values}
          errors={form.errors}
          currency={currency}
          editing={editing}
          saving={saving}
          onChange={form.setField}
          onBlur={form.blurField}
          onSubmit={form.submit}
          onCancel={() => router.back()}
        />
      </Stack>
    </Screen>
  );
}

export default BookingFormScreen;
