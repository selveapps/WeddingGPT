import React, { useMemo, useState } from 'react';

import {
  BottomSheet,
  Button,
  Card,
  Chip,
  ListRow,
  Row,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { useVendorStore } from '@/store';
import {
  APPOINTMENT_KIND_META,
  APPOINTMENT_LIMITS,
  AppointmentKind,
  appointmentLabel,
  appointmentWhen,
  isUpcoming,
  validateAppointment,
  vendorAppointments,
} from '@/models';
import { formatTime, fromClock } from '@/lib/time';
import { formatMediumDate } from '@/lib/date';
import { DateField } from '@/features/shared/DateField';

/**
 * A vendor's appointments (slice H1): what is coming up, and what was
 * decided at the ones already done. Tap one to edit it or write down how it
 * went.
 */
export function VendorAppointments({ vendor }) {
  const [editing, setEditing] = useState(null);
  const appointments = useMemo(() => vendorAppointments(vendor), [vendor]);
  const upcoming = appointments.filter((appointment) => isUpcoming(appointment));
  // Most recent first: the last tasting matters more than the first.
  const past = appointments.filter((appointment) => !isUpcoming(appointment)).reverse();
  const full = appointments.length >= APPOINTMENT_LIMITS.perVendor;

  const row = (appointment, isPast) => (
    <ListRow
      key={appointment.id}
      title={appointmentLabel(appointment)}
      subtitle={
        [appointmentWhen(appointment, formatMediumDate) || 'No date yet', appointment.place]
          .filter(Boolean)
          .join(' · ') + (isPast && appointment.outcome ? `\n${appointment.outcome}` : '')
      }
      subtitleLines={isPast ? 3 : 1}
      onPress={() => setEditing({ appointment })}
      accessibilityLabel={`Edit ${appointmentLabel(appointment).toLowerCase()}`}
    />
  );

  return (
    <Stack gap="sm">
      <SectionHeader
        title="Appointments"
        actionLabel={full ? undefined : 'Add'}
        actionIcon="plus"
        onActionPress={full ? undefined : () => setEditing({ appointment: null })}
      />
      {appointments.length ? (
        <Card padding="none">
          {upcoming.map((appointment) => row(appointment, false))}
          {past.map((appointment) => row(appointment, true))}
        </Card>
      ) : (
        <Card tone="muted">
          <Stack gap="xs">
            <Text variant="body" color="muted">
              Tastings, fittings, site visits, calls - keep each one here with what was decided.
            </Text>
            <Button
              label="Add an appointment"
              variant="secondary"
              iconLeft="calendar"
              onPress={() => setEditing({ appointment: null })}
            />
          </Stack>
        </Card>
      )}

      {editing ? (
        <AppointmentSheet
          vendor={vendor}
          appointment={editing.appointment}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Stack>
  );
}

const KIND_ORDER = [
  AppointmentKind.MEETING,
  AppointmentKind.CALL,
  AppointmentKind.SITE_VISIT,
  AppointmentKind.TASTING,
  AppointmentKind.FITTING,
  AppointmentKind.TRIAL,
  AppointmentKind.OTHER,
];

/** Add or edit one appointment. After the date, it asks what was decided. */
function AppointmentSheet({ vendor, appointment, onClose }) {
  const toast = useToast();
  const { addAppointment, updateAppointment, removeAppointment } = useVendorStore.getState();
  const [kind, setKind] = useState(appointment?.kind ?? AppointmentKind.MEETING);
  const [date, setDate] = useState(appointment?.date ?? null);
  const [timeText, setTimeText] = useState(
    fromClock(appointment?.time) === null ? '' : formatTime(fromClock(appointment.time))
  );
  const [place, setPlace] = useState(appointment?.place ?? '');
  const [notes, setNotes] = useState(appointment?.notes ?? '');
  const [outcome, setOutcome] = useState(appointment?.outcome ?? '');
  const [errors, setErrors] = useState({});
  const done = Boolean(appointment && !isUpcoming(appointment));

  const save = () => {
    const result = validateAppointment({ kind, date, timeText, place, notes, outcome });
    if (Object.keys(result.errors).length) {
      setErrors(result.errors);
      return;
    }
    if (appointment) updateAppointment(vendor.id, appointment.id, result.fields);
    else if (!addAppointment(vendor.id, result.fields)) {
      toast.error(`A vendor can hold up to ${APPOINTMENT_LIMITS.perVendor} appointments.`);
      return;
    }
    onClose();
  };

  const remove = () => {
    removeAppointment(vendor.id, appointment.id);
    toast.info(`${appointmentLabel(appointment)} deleted`, {
      actionLabel: 'Undo',
      onAction: () => addAppointment(vendor.id, appointment),
    });
    onClose();
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={appointment ? appointmentLabel(appointment) : `Appointment with ${vendor.name}`}
      footer={
        <Stack gap="xs">
          <Button label={appointment ? 'Save' : 'Add appointment'} onPress={save} />
          {appointment ? <Button label="Delete" variant="ghost" onPress={remove} /> : null}
        </Stack>
      }
    >
      <Stack gap="md">
        <Row gap="xs" wrap align="flex-start">
          {KIND_ORDER.map((key) => (
            <Chip
              key={key}
              label={APPOINTMENT_KIND_META[key].label}
              size="sm"
              selected={kind === key}
              onPress={() => setKind(key)}
            />
          ))}
        </Row>
        <Stack gap="xxs">
          <DateField label="Date" value={date} onChange={setDate} />
          {errors.date ? (
            <Text variant="caption" color="danger">
              {errors.date}
            </Text>
          ) : null}
        </Stack>
        <TextField
          label="Time"
          value={timeText}
          onChangeText={setTimeText}
          placeholder="11am"
          error={errors.time}
        />
        <TextField
          label="Where"
          value={place}
          onChangeText={setPlace}
          placeholder="Their studio"
          error={errors.place}
        />
        <TextField
          label="To bring or ask"
          value={notes}
          onChangeText={setNotes}
          placeholder="Swatches, the guest count, ask about corkage"
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
          error={errors.notes}
        />
        {done ? (
          <TextField
            label="What was decided"
            value={outcome}
            onChangeText={setOutcome}
            placeholder="Chose the lemon sponge; final numbers due a month out"
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
            error={errors.outcome}
          />
        ) : null}
      </Stack>
    </BottomSheet>
  );
}

export default VendorAppointments;
