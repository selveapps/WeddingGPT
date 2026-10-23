import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import {
  BottomSheet,
  Button,
  Card,
  Chip,
  ConfirmSheet,
  EmptyState,
  Row,
  Screen,
  ScreenHeader,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import {
  useEventStore,
  useRunOfShowStore,
  useWeddingStore,
  selectEvents,
  selectRunOfShow,
  selectWedding,
} from '@/store';
import {
  RUN_OF_SHOW_LIMITS,
  coupleDisplayName,
  eventName,
  findOverlaps,
  itemEnd,
  itemsForDay,
  runOfShowText,
  sortEvents,
  sortRunOfShow,
  validateRunOfShowItem,
} from '@/models';
import { formatDuration, formatTime, parseTime } from '@/lib/time';
import { formatMediumDate } from '@/lib/date';
import { shareText } from '@/services/share';

import { importLabTimeline } from './labsImport';
import { VendorShareSection } from './VendorShareSection';

/**
 * The run of show (graduated from the Labs day-of timeline): what happens when
 * on the day. Each event has its own; running late, push an item and
 * everything after it moves too. Synced, so the couple, the planner on the
 * other phone and whoever is holding the clipboard see the same times.
 */
export function RunOfShowScreen({ initialEventId = null }) {
  const toast = useToast();
  const { spacing } = useTheme();
  const wedding = useWeddingStore(selectWedding);
  const events = useEventStore(selectEvents);
  const items = useRunOfShowStore(selectRunOfShow);
  const { loadSample, shift, clearDay } = useRunOfShowStore.getState();

  const [eventId, setEventId] = useState(initialEventId);
  const [editing, setEditing] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    importLabTimeline({ weddingId: wedding?.id ?? null });
  }, [wedding?.id]);

  const sortedEvents = useMemo(() => sortEvents(events), [events]);
  // A day for an event deleted elsewhere falls back to the wedding day.
  const event = sortedEvents.find((entry) => entry.id === eventId) ?? null;
  const dayItems = useMemo(() => sortRunOfShow(itemsForDay(items, event?.id ?? null)), [items, event]);
  const overlaps = useMemo(() => findOverlaps(dayItems), [dayItems]);
  const overlapping = new Set(overlaps.flatMap((pair) => [pair.first.id, pair.second.id]));
  const dayName = event ? eventName(event) : 'The wedding day';
  const full = dayItems.length >= RUN_OF_SHOW_LIMITS.perDay;

  const share = async () => {
    const title = [
      wedding ? `${coupleDisplayName(wedding)}'s wedding` : 'Wedding day',
      event ? eventName(event) : null,
    ]
      .filter(Boolean)
      .join(' - ');
    const ok = await shareText(runOfShowText(dayItems, { title }), 'Run of show');
    if (!ok) toast.error('Sharing is not available here');
  };

  const push = (item, minutes) => {
    const moved = shift(item.id, minutes);
    if (moved) {
      toast.info(`Moved ${moved} ${moved === 1 ? 'item' : 'items'} ${minutes > 0 ? 'later' : 'earlier'}`, {
        actionLabel: 'Undo',
        onAction: () => shift(item.id, -minutes),
      });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        bottomInset={spacing.xxl}
        footer={
          dayItems.length ? (
            <Row gap="xs">
              <Button
                label="Add to the day"
                iconLeft="plus"
                disabled={full}
                style={{ flex: 1 }}
                onPress={() => setEditing({ item: null })}
              />
              <Button label="Share" iconLeft="send" variant="secondary" style={{ flex: 1 }} onPress={share} />
            </Row>
          ) : null
        }
      >
        <Stack gap="lg">
          <ScreenHeader eyebrow="Planning" title="Run of show" />

          {sortedEvents.length ? (
            <Row gap="xs" wrap align="flex-start">
              <Chip label="The wedding day" size="sm" selected={!event} onPress={() => setEventId(null)} />
              {sortedEvents.map((entry) => (
                <Chip
                  key={entry.id}
                  label={eventName(entry)}
                  size="sm"
                  selected={event?.id === entry.id}
                  onPress={() => setEventId(entry.id)}
                />
              ))}
            </Row>
          ) : null}

          {dayItems.length === 0 ? (
            <EmptyState
              icon="clock"
              title={`Plan ${event ? `the ${eventName(event).toLowerCase()}` : 'the day'} hour by hour`}
              message="Start from a typical wedding day and make it yours, or add your own."
              actionLabel="Start from a typical day"
              onAction={() => loadSample({ weddingId: wedding?.id ?? null, eventId: event?.id ?? null })}
              secondaryActionLabel="Add the first item"
              onSecondaryAction={() => setEditing({ item: null })}
            />
          ) : (
            <>
              {overlaps.length ? (
                <Card tone="accent">
                  <Stack gap="xxs">
                    <Text variant="bodyStrong">Overlapping</Text>
                    {overlaps.map(({ first, second }) => (
                      <Text key={`${first.id}-${second.id}`} variant="bodySm">
                        {`${second.title} starts before ${first.title} ends (${formatTime(itemEnd(first))})`}
                      </Text>
                    ))}
                  </Stack>
                </Card>
              ) : null}

              <Stack gap="sm">
                <SectionHeader
                  title={dayName}
                  subtitle={event?.date ? formatMediumDate(event.date) : undefined}
                  actionLabel="Clear"
                  actionIcon="trash"
                  onActionPress={() => setClearing(true)}
                />
                {dayItems.map((item) => (
                  <Card
                    key={item.id}
                    tone={overlapping.has(item.id) ? 'accent' : 'plain'}
                    onPress={() => setEditing({ item })}
                    accessibilityLabel={`Edit ${item.title}`}
                  >
                    <Row gap="md" align="flex-start">
                      <Stack gap="hair" style={{ width: 76 }}>
                        <Text variant="labelStrong">{formatTime(item.start)}</Text>
                        <Text variant="caption" color="subtle">
                          {formatDuration(item.durationMin)}
                        </Text>
                      </Stack>
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Text variant="bodyStrong">{item.title}</Text>
                        {item.location || item.owner ? (
                          <Text variant="caption" color="muted">
                            {[item.location, item.owner].filter(Boolean).join(' · ')}
                          </Text>
                        ) : null}
                        <Row gap="xs">
                          <Button
                            size="sm"
                            variant="ghost"
                            fullWidth={false}
                            label="-15m"
                            accessibilityLabel={`Move ${item.title} and what follows 15 minutes earlier`}
                            onPress={() => push(item, -15)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            fullWidth={false}
                            label="+15m"
                            accessibilityLabel={`Move ${item.title} and what follows 15 minutes later`}
                            onPress={() => push(item, 15)}
                          />
                        </Row>
                      </Stack>
                    </Row>
                  </Card>
                ))}
              </Stack>
            </>
          )}

          {dayItems.length ? (
            <VendorShareSection eventId={event?.id ?? null} dayName={dayName.toLowerCase()} />
          ) : null}
        </Stack>

        {editing ? (
          <ItemSheet
            item={editing.item}
            weddingId={wedding?.id ?? null}
            eventId={event?.id ?? null}
            onClose={() => setEditing(null)}
          />
        ) : null}

        <ConfirmSheet
          visible={clearing}
          onClose={() => setClearing(false)}
          onConfirm={() => {
            const removed = clearDay(event?.id ?? null);
            setClearing(false);
            toast.info(`${removed} ${removed === 1 ? 'item' : 'items'} cleared`);
          }}
          title={`Clear ${dayName.toLowerCase()}'s run of show?`}
          message="Every item on this day is deleted. Other days are not touched."
          confirmLabel="Clear"
          destructive
          icon="trash"
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

/** Add or edit one item. Times are typed the way people say them. */
function ItemSheet({ item, weddingId, eventId, onClose }) {
  const toast = useToast();
  const { addItem, updateItem, removeItem } = useRunOfShowStore.getState();
  const [title, setTitle] = useState(item?.title ?? '');
  const [start, setStart] = useState(item ? formatTime(item.start) : '');
  const [duration, setDuration] = useState(String(item?.durationMin ?? 30));
  const [location, setLocation] = useState(item?.location ?? '');
  const [owner, setOwner] = useState(item?.owner ?? '');
  const [errors, setErrors] = useState({});

  const save = () => {
    const fields = {
      title: title.trim(),
      start: start.trim() ? parseTime(start) : null,
      durationMin: duration.trim() === '' ? 0 : Number(duration),
      location: location.trim(),
      owner: owner.trim(),
    };
    const nextErrors = validateRunOfShowItem(fields);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    if (item) updateItem(item.id, fields);
    else if (!addItem({ ...fields, weddingId, eventId })) {
      toast.error(`A day can hold up to ${RUN_OF_SHOW_LIMITS.perDay} items.`);
      return;
    }
    onClose();
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={item ? 'Edit' : 'Add to the day'}
      footer={
        <Stack gap="xs">
          <Button label={item ? 'Save' : 'Add'} onPress={save} />
          {item ? (
            <Button
              label="Delete"
              variant="ghost"
              onPress={() => {
                removeItem(item.id);
                toast.info(`${item.title} deleted`, {
                  actionLabel: 'Undo',
                  onAction: () => addItem({ ...item, weddingId: item.weddingId, eventId: item.eventId }),
                });
                onClose();
              }}
            />
          ) : null}
        </Stack>
      }
    >
      <Stack gap="md">
        <TextField
          label="What"
          value={title}
          onChangeText={setTitle}
          placeholder="Cake cutting"
          error={errors.title}
          autoCapitalize="sentences"
          required
        />
        <Row gap="sm" align="flex-start">
          <TextField
            label="Starts"
            value={start}
            onChangeText={setStart}
            placeholder="8:45 PM"
            error={errors.start}
            containerStyle={{ flex: 1 }}
          />
          <TextField
            label="Minutes"
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            error={errors.durationMin}
            containerStyle={{ flex: 1 }}
          />
        </Row>
        <TextField
          label="Where (optional)"
          value={location}
          onChangeText={setLocation}
          placeholder="Garden terrace"
        />
        <TextField
          label="Who runs it (optional)"
          value={owner}
          onChangeText={setOwner}
          placeholder="Caterer"
        />
      </Stack>
    </BottomSheet>
  );
}

export default RunOfShowScreen;
