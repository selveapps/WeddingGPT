import React, { useState } from 'react';
import { Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Badge,
  Button,
  Card,
  ConfirmSheet,
  EmptyState,
  PageHeader,
  Screen,
  SectionHeader,
  Stack,
  Text,
  useToast,
} from '@/design-system/components';
import { VENDOR_CATEGORIES, VENDOR_STATUS_META } from '@/models';
import { formatMoney } from '@/lib/currency';
import { formatMediumDate } from '@/lib/date';
import { Routes } from '@/navigation/routes';
import { BookingPaymentPlan } from './components/BookingPaymentPlan';
import { BOOKING_COPY, QUICK_ACTION_DEFS } from './lib/bookingConstants';
import { useBookings } from './hooks/useBookings';

export function BookingDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { allBookings, currency, updateStatus, removeBooking } = useBookings();
  const booking = allBookings.find((item) => item.id === String(id));
  const category = VENDOR_CATEGORIES.find((item) => item.key === booking?.categoryKey);
  const status = VENDOR_STATUS_META[booking?.status] ?? VENDOR_STATUS_META.saved;

  if (!booking) {
    return (
      <Screen>
        <EmptyState
          icon="vendors"
          title="Booking not found"
          message="It may have been removed from your list."
          actionLabel="Back to bookings"
          onAction={() => router.replace(Routes.bookingTracker)}
        />
      </Screen>
    );
  }

  const changeStatus = (nextStatus) => {
    updateStatus(booking, nextStatus);
    toast.success(nextStatus === 'booked' ? BOOKING_COPY.markBookedSuccess : 'Booking updated');
  };

  const openContactLink = async (value, kind) => {
    const url =
      kind === 'website'
        ? (/^https?:\/\//i.test(value) ? value : `https://${value}`)
        : `${kind}:${value}`;
    try {
      await Linking.openURL(url);
    } catch {
      toast.error('Could not open that contact link.');
    }
  };

  const deleteBooking = () => {
    removeBooking(booking.id);
    setConfirmDelete(false);
    toast.success(BOOKING_COPY.deleteSuccess);
    router.replace(Routes.bookingTracker);
  };

  return (
    <Screen>
      <Stack gap="lg">
        <PageHeader
          eyebrow={BOOKING_COPY.detailEyebrow}
          title={booking.name}
          subtitle={[category?.name, booking.city].filter(Boolean).join(' · ')}
          actionLabel="Edit"
          actionIcon="edit"
          onActionPress={() => router.push(Routes.bookingEdit(booking.id))}
        />

        <Card>
          <Stack gap="md">
            <Badge label={status.label} tone={status.tone} />
            {booking.quotedAmount != null ? (
              <Text variant="h2" heading>{formatMoney(booking.quotedAmount, currency)}</Text>
            ) : null}
            {booking.priceHint ? <Text variant="body" color="muted">{booking.priceHint}</Text> : null}
            {booking.quoteScope ? (
              <Stack gap="xxs">
                <Text variant="label">Quote includes</Text>
                <Text variant="body" color="muted">{booking.quoteScope}</Text>
              </Stack>
            ) : null}
            {booking.quoteValidUntil ? (
              <Text variant="caption" color="subtle">Quote valid until {formatMediumDate(booking.quoteValidUntil)}</Text>
            ) : null}
          </Stack>
        </Card>

        <Stack gap="sm">
          <SectionHeader eyebrow={BOOKING_COPY.contactEyebrow} title="Contact" />
          <Card>
            <Stack gap="sm">
              {booking.contactName ? <Info label="Contact" value={booking.contactName} /> : null}
              {booking.email ? (
                <Button
                  label={booking.email}
                  variant="ghost"
                  fullWidth={false}
                  onPress={() => openContactLink(booking.email, 'mailto')}
                />
              ) : null}
              {booking.phone ? (
                <Button
                  label={booking.phone}
                  variant="ghost"
                  fullWidth={false}
                  onPress={() => openContactLink(booking.phone, 'tel')}
                />
              ) : null}
              {booking.website ? (
                <Button
                  label={booking.website}
                  variant="ghost"
                  fullWidth={false}
                  onPress={() => openContactLink(booking.website, 'website')}
                />
              ) : null}
              {!booking.contactName && !booking.email && !booking.phone && !booking.website ? (
                <Text variant="body" color="subtle">No contact details added yet.</Text>
              ) : null}
            </Stack>
          </Card>
        </Stack>

        <Stack gap="sm">
          <SectionHeader eyebrow={BOOKING_COPY.paymentsEyebrow} title={BOOKING_COPY.paymentsTitle} />
          <BookingPaymentPlan booking={booking} currency={currency} />
        </Stack>

        {booking.meetingAt ? (
          <Card tone="muted">
            <Text variant="label">Meeting</Text>
            <Text variant="body">{formatMediumDate(booking.meetingAt)}</Text>
          </Card>
        ) : null}

        {booking.notes ? (
          <Stack gap="sm">
            <SectionHeader eyebrow={BOOKING_COPY.notesEyebrow} title={BOOKING_COPY.notesTitle} />
            <Card><Text variant="body" color="muted">{booking.notes}</Text></Card>
          </Stack>
        ) : null}

        <Stack gap="sm">
          <SectionHeader eyebrow={BOOKING_COPY.quickActionsTitle} title="Next steps" />
          {QUICK_ACTION_DEFS.filter(
            (action) => action.status !== booking.status && action.from.includes(booking.status)
          ).map((action) => (
            <Button
              key={action.id}
              label={action.label}
              iconLeft={action.icon}
              variant={action.id === 'book' ? 'primary' : 'secondary'}
              onPress={() => changeStatus(action.status)}
            />
          ))}
        </Stack>

        <Button label={BOOKING_COPY.deleteLabel} variant="danger" onPress={() => setConfirmDelete(true)} />
      </Stack>

      <ConfirmSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteBooking}
        title={BOOKING_COPY.deleteConfirmTitle}
        message={BOOKING_COPY.deleteConfirmMessage}
        confirmLabel={BOOKING_COPY.deleteLabel}
        cancelLabel="Keep booking"
        destructive
        icon="trash"
      />
    </Screen>
  );
}

function Info({ label, value }) {
  return (
    <Stack gap="xxs">
      <Text variant="eyebrow" color="subtle">{label}</Text>
      <Text variant="body">{value}</Text>
    </Stack>
  );
}

export default BookingDetail;
