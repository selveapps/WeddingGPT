import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Button,
  Card,
  Chip,
  ConfirmSheet,
  EmptyState,
  Row,
  Screen,
  ScreenHeader,
  SectionHeader,
  SegmentedControl,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useEventStore, useGuestStore, selectAllGuests, useWeddingStore, selectWeddingId } from '@/store';
import {
  EVENT_KIND_META,
  EVENT_LIMITS,
  EventKind,
  GuestScope,
  clockFromInput,
  eventGuestSummary,
  eventName,
  validateEvent,
  eventChecklist,
} from '@/models';
import { formatTime, fromClock } from '@/lib/time';
import { DateField } from '@/features/shared/DateField';

import { GuestPickerSheet } from './GuestPickerSheet';
import { deleteEvent, eventLinks } from './deleteEvent';

const SCOPE_OPTIONS = [
  { value: GuestScope.EVERYONE, label: 'Everyone' },
  { value: GuestScope.INVITED, label: 'Chosen guests' },
];

/** "16:30" back to what the couple would type. */
const timeText = (clock) => (clock ? formatTime(fromClock(clock)) : '');

/**
 * Add or edit one event (slice C1). With no `eventId` it adds; the name may be
 * left empty, in which case the kind names it ("Mehndi").
 */
export function EventFormScreen({ eventId }) {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const weddingId = useWeddingStore(selectWeddingId);
  const guests = useGuestStore(selectAllGuests);
  const existing = useEventStore((state) => (eventId ? (state.events.byId[eventId] ?? null) : null));
  const { addEvent, updateEvent } = useEventStore.getState();

  const [name, setName] = useState(existing?.name ?? '');
  const [kind, setKind] = useState(existing?.kind ?? EventKind.OTHER);
  const [date, setDate] = useState(existing?.date ?? null);
  const [startTimeText, setStartTimeText] = useState(timeText(existing?.startTime));
  const [endTimeText, setEndTimeText] = useState(timeText(existing?.endTime));
  const [venueName, setVenueName] = useState(existing?.venueName ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [dressCode, setDressCode] = useState(existing?.dressCode ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [guestScope, setGuestScope] = useState(existing?.guestScope ?? GuestScope.EVERYONE);
  const [invitedGuestIds, setInvitedGuestIds] = useState(existing?.invitedGuestIds ?? []);
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState({});

  if (eventId && !existing) {
    return (
      <Screen>
        <Stack gap="xl">
          <ScreenHeader eyebrow="Planning" title="Event" />
          <EmptyState
            icon="calendar"
            title="This event is gone"
            message="It may have been deleted on another device."
            actionLabel="Back to events"
            onAction={() => router.replace(Routes.events)}
          />
        </Stack>
      </Screen>
    );
  }

  const summary = eventGuestSummary({ guestScope, invitedGuestIds, attendance: existing?.attendance }, guests);

  const clearError = (key) => {
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = () => {
    const fields = {
      name: name.trim(),
      date,
      startTimeText,
      endTimeText,
      venueName,
      address,
      dressCode,
      notes,
    };
    const nextErrors = validateEvent(fields);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    const values = {
      name: name.trim(),
      kind,
      date,
      startTime: clockFromInput(startTimeText),
      endTime: clockFromInput(endTimeText),
      venueName: venueName.trim(),
      address: address.trim(),
      dressCode: dressCode.trim(),
      notes: notes.trim(),
      guestScope,
      invitedGuestIds,
    };
    if (existing) {
      updateEvent(existing.id, values);
      toast.success('Event saved');
    } else {
      const added = addEvent({ ...values, weddingId });
      if (!added) {
        toast.error(`A wedding can have up to ${EVENT_LIMITS.perWedding} events.`);
        return;
      }
      toast.success(`${eventName(added)} added`);
      // Offer the checklist for this kind of event; nothing is added without choosing.
      if (eventChecklist(added.kind).length) {
        router.replace(Routes.eventChecklist(added.id));
        return;
      }
    }
    router.back();
  };

  const links = confirmDelete && existing ? eventLinks(existing.id) : { tasks: 0, expenses: 0, runOfShow: 0, tables: 0 };
  const linkedText = [
    links.tasks ? `${links.tasks} ${links.tasks === 1 ? 'task' : 'tasks'}` : null,
    links.expenses ? `${links.expenses} ${links.expenses === 1 ? 'cost' : 'costs'}` : null,
  ]
    .filter(Boolean)
    .join(' and ');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Planning" title={existing ? eventName(existing) : 'New event'} />

          <Stack gap="sm">
            <SectionHeader eyebrow="What kind" title="Event" />
            <Row gap="xs" wrap align="flex-start">
              {Object.entries(EVENT_KIND_META).map(([value, meta]) => (
                <Chip
                  key={value}
                  label={meta.label}
                  size="sm"
                  selected={kind === value}
                  onPress={() => setKind(value)}
                />
              ))}
            </Row>
            <TextField
              label="Name"
              value={name}
              onChangeText={(next) => {
                setName(next);
                clearError('name');
              }}
              placeholder={EVENT_KIND_META[kind]?.label}
              helper="Leave empty to use the kind as the name."
              error={errors.name}
              autoCapitalize="words"
              maxLength={EVENT_LIMITS.nameChars + 1}
            />
          </Stack>

          <Stack gap="sm">
            <SectionHeader eyebrow="When" title="Date and time" />
            <DateField
              label="Date"
              value={date}
              onChange={(next) => {
                setDate(next);
                clearError('date');
              }}
            />
            {errors.date ? (
              <Text variant="caption" color="danger">
                {errors.date}
              </Text>
            ) : null}
            <Row gap="sm" align="flex-start">
              <TextField
                label="Starts"
                value={startTimeText}
                onChangeText={(next) => {
                  setStartTimeText(next);
                  clearError('startTime');
                }}
                placeholder="4pm"
                error={errors.startTime}
                style={{ flex: 1 }}
              />
              <TextField
                label="Ends"
                value={endTimeText}
                onChangeText={(next) => {
                  setEndTimeText(next);
                  clearError('endTime');
                }}
                placeholder="10pm"
                error={errors.endTime}
                style={{ flex: 1 }}
              />
            </Row>
          </Stack>

          <Stack gap="sm">
            <SectionHeader eyebrow="Where" title="Place" />
            <TextField
              label="Venue"
              value={venueName}
              onChangeText={setVenueName}
              placeholder="The Rose Garden"
              error={errors.venueName}
              autoCapitalize="words"
            />
            <TextField
              label="Address"
              value={address}
              onChangeText={setAddress}
              error={errors.address}
              multiline
              numberOfLines={2}
            />
          </Stack>

          <Stack gap="sm">
            <SectionHeader eyebrow="Who" title="Guests" />
            <SegmentedControl options={SCOPE_OPTIONS} value={guestScope} onChange={setGuestScope} />
            <Card tone="muted">
              <Stack gap="xs">
                <Text variant="bodyStrong">
                  {guestScope === GuestScope.EVERYONE
                    ? `Everyone on your list (${summary.invited})`
                    : `${summary.invited} ${summary.invited === 1 ? 'guest' : 'guests'} invited`}
                </Text>
                <Text variant="bodySm" color="muted">
                  {summary.attending} attending · {summary.declined} declined · {summary.awaiting} not replied
                  yet
                </Text>
                {guestScope === GuestScope.INVITED ? (
                  <Button
                    label="Choose guests"
                    variant="secondary"
                    size="sm"
                    onPress={() => setPicking(true)}
                  />
                ) : null}
              </Stack>
            </Card>
          </Stack>

          <Stack gap="sm">
            <SectionHeader eyebrow="For guests" title="Details" />
            <TextField
              label="Dress code"
              value={dressCode}
              onChangeText={setDressCode}
              placeholder="Festive, bright colours"
              error={errors.dressCode}
              autoCapitalize="sentences"
            />
            <TextField
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Parking, timings, what to bring"
              error={errors.notes}
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
            />
          </Stack>

          <Stack gap="xs">
            <Button label={existing ? 'Save event' : 'Add event'} onPress={submit} />
            {existing ? (
              <Button
                label="Run of show"
                variant="secondary"
                iconLeft="clock"
                onPress={() => router.push(Routes.runOfShow(existing.id))}
              />
            ) : null}
            {existing ? (
              <Button
                label="Printable plan"
                variant="secondary"
                iconLeft="note"
                onPress={() => router.push(Routes.eventPlan(existing.id))}
              />
            ) : null}
            {existing && eventChecklist(existing.kind).length ? (
              <Button
                label="Suggested tasks"
                variant="secondary"
                iconLeft="checklist"
                onPress={() => router.push(Routes.eventChecklist(existing.id))}
              />
            ) : null}
            {existing ? (
              <Button label="Delete event" variant="ghost" onPress={() => setConfirmDelete(true)} />
            ) : (
              <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
            )}
          </Stack>
        </Stack>

        {picking ? (
          <GuestPickerSheet
            visible
            guests={guests}
            selected={invitedGuestIds}
            onClose={() => setPicking(false)}
            onDone={(ids) => {
              setInvitedGuestIds(ids);
              setPicking(false);
            }}
          />
        ) : null}

        {existing ? (
          <ConfirmSheet
            visible={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            onConfirm={() => {
              deleteEvent(existing.id);
              setConfirmDelete(false);
              toast.success('Event deleted');
              router.replace(Routes.events);
            }}
            title={`Delete ${eventName(existing)}?`}
            message={[
              linkedText ? `Its ${linkedText} stay, as part of the wedding as a whole.` : null,
              links.runOfShow
                ? `Its run of show (${links.runOfShow} ${links.runOfShow === 1 ? 'item' : 'items'}) is deleted with it.`
                : null,
              links.tables
                ? `Its seating (${links.tables} ${links.tables === 1 ? 'table' : 'tables'}) is deleted with it.`
                : null,
              'This cannot be undone.',
            ]
              .filter(Boolean)
              .join(' ')}
            confirmLabel="Delete"
            destructive
            icon="trash"
          />
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

export default EventFormScreen;
