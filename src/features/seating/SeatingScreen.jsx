import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  Badge,
  BottomSheet,
  Button,
  Card,
  Chip,
  ConfirmSheet,
  EmptyState,
  ListRow,
  Row,
  Screen,
  ScreenHeader,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { useBreakpoint, useTheme } from '@/design-system/theme';
import {
  useGuestStore,
  selectAllGuests,
  useSeatingStore,
  selectSeatingTables,
  selectAvoidPairs,
  useWeddingStore,
  selectWeddingId,
  useEventStore,
  selectEvents,
} from '@/store';
import {
  DEFAULT_TABLE_CAPACITY,
  eventName,
  findConflicts,
  freeSeats,
  guestLabel,
  seatableGuests,
  seatingSummary,
  sortEvents,
  tablesForEvent,
  unseatedGuests,
} from '@/models';

import { importLabSeating } from './labsImport';

/**
 * The seating chart (workstream D, graduated from Labs): tables, who sits
 * where, auto-seating that keeps households together, and pairs to keep
 * apart. Tables and rules sync, so both partners plan the same room.
 *
 * On a wide screen the tables sit in a grid with the guests still to seat
 * beside them, which is how people actually plan a room.
 */
export function SeatingScreen() {
  const toast = useToast();
  const { spacing } = useTheme();
  const { isWide } = useBreakpoint();
  const weddingId = useWeddingStore(selectWeddingId);
  const guests = useGuestStore(selectAllGuests);
  const allTables = useSeatingStore(selectSeatingTables);
  const events = useEventStore(selectEvents);
  const avoidPairs = useSeatingStore(selectAvoidPairs);
  const store = useSeatingStore.getState();

  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(String(DEFAULT_TABLE_CAPACITY));
  const [seating, setSeating] = useState(null);
  const [editing, setEditing] = useState(null);
  const [pairing, setPairing] = useState(false);
  const [eventId, setEventId] = useState(null);

  // Bring over a Labs seating plan once. Deleted guests' seats are freed by
  // the guest store as they are deleted, not by comparing lists here.
  useEffect(() => {
    importLabSeating({ weddingId });
  }, [weddingId]);

  // Each event has its own room (F2); one deleted elsewhere falls back to the wedding day.
  const sortedEvents = useMemo(() => sortEvents(events), [events]);
  const event = sortedEvents.find((entry) => entry.id === eventId) ?? null;
  const tables = useMemo(() => tablesForEvent(allTables, event?.id ?? null), [allTables, event]);

  const byId = useMemo(() => new Map(guests.map((guest) => [guest.id, guest])), [guests]);
  const name = (id) => (byId.has(id) ? guestLabel(byId.get(id)) : 'Removed guest');
  const summary = seatingSummary(tables, guests, event);
  const unseated = unseatedGuests(tables, guests, event);
  const conflicts = findConflicts(tables, avoidPairs);

  const addTable = () => {
    store.addTable({
      weddingId,
      eventId: event?.id ?? null,
      name: tableName.trim() || `Table ${tables.length + 1}`,
      capacity: Number(capacity) || DEFAULT_TABLE_CAPACITY,
    });
    setTableName('');
  };

  const runAutoSeat = () => {
    const result = store.autoSeat(guests, { event });
    if (result.unplaced.length) {
      toast.warning(
        `Seated ${result.placed}. ${result.unplaced.length} still need a table - add more seats.`
      );
    } else {
      toast.success(result.placed ? `Seated ${result.placed} guests` : 'Everyone already has a seat');
    }
  };

  const seat = (tableId) => {
    const result = store.assign(tableId, seating.id);
    if (result.error) toast.warning(result.error);
    setSeating(null);
  };

  const tablesSection = (
    <Stack gap="sm" style={isWide ? { flex: 2 } : null}>
      <SectionHeader title="Tables" subtitle="Tap a table to rename or resize it." />
      {tables.length === 0 ? (
        <EmptyState compact icon="guests" title="No tables yet" message="Add your first table above." />
      ) : (
        <View
          style={isWide ? { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } : { gap: spacing.sm }}
        >
          {tables.map((table) => (
            <Card
              key={table.id}
              onPress={() => setEditing(table)}
              accessibilityLabel={`${table.name}, ${table.guestIds.length} of ${table.capacity} seats`}
              style={isWide ? { width: 280 } : null}
            >
              <Stack gap="sm">
                <Row justify="space-between">
                  <Text variant="bodyStrong">{table.name}</Text>
                  <Badge
                    label={freeSeats(table) ? `${freeSeats(table)} free` : 'Full'}
                    tone={freeSeats(table) ? 'neutral' : 'success'}
                  />
                </Row>
                <Row gap="xs" wrap>
                  {table.guestIds.map((id) => (
                    <Chip key={id} size="sm" label={name(id)} onRemove={() => store.unassign(id, event?.id ?? null)} />
                  ))}
                </Row>
              </Stack>
            </Card>
          ))}
        </View>
      )}
    </Stack>
  );

  const sideSection = (
    <Stack gap="lg" style={isWide ? { flex: 1 } : null}>
      <Stack gap="sm">
        <SectionHeader title={`Need a seat (${unseated.length})`} />
        {guests.length === 0 ? (
          <Text variant="bodySm" color="muted">
            Add guests first - declined guests are left off the plan.
          </Text>
        ) : unseated.length === 0 ? (
          <Text variant="bodySm" color="muted">
            Everyone has a seat.
          </Text>
        ) : (
          <Card padding="none">
            {unseated.map((guest) => (
              <ListRow
                key={guest.id}
                title={guestLabel(guest)}
                onPress={() => (tables.length ? setSeating(guest) : toast.info('Add a table first.'))}
              />
            ))}
          </Card>
        )}
      </Stack>

      <Stack gap="sm">
        <SectionHeader
          title="Keep apart"
          subtitle="Auto-seat never puts these two together."
          actionLabel="Add pair"
          actionIcon="plus"
          onActionPress={() => setPairing(true)}
        />
        <Row gap="xs" wrap>
          {avoidPairs.map(([a, b], index) => (
            <Chip
              key={`${a}-${b}`}
              label={`${name(a)} / ${name(b)}`}
              onRemove={() => store.removeAvoidPair(index)}
            />
          ))}
        </Row>
      </Stack>
    </Stack>
  );

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <ScreenHeader eyebrow="Guests" title="Seating chart" />

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

        <Card tone="brand">
          <Row justify="space-between">
            <Stat label="Tables" value={summary.tables} />
            <Stat label="Seated" value={`${summary.seated}/${summary.capacity}`} />
            <Stat label="Need a seat" value={summary.unseated} />
          </Row>
        </Card>

        <Card>
          <Stack gap="md">
            <Row gap="sm" align="flex-end">
              <TextField
                label="Table name"
                value={tableName}
                onChangeText={setTableName}
                placeholder={`Table ${tables.length + 1}`}
                containerStyle={{ flex: 2 }}
              />
              <TextField
                label="Seats"
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="number-pad"
                containerStyle={{ flex: 1 }}
              />
            </Row>
            <Button label="Add table" variant="secondary" iconLeft="plus" onPress={addTable} />
            <Button
              label="Auto-seat everyone"
              iconLeft="sparkle"
              onPress={runAutoSeat}
              disabled={!tables.length || !unseated.length}
            />
          </Stack>
        </Card>

        {conflicts.length ? (
          <Card tone="danger">
            <Stack gap="xxs">
              <Text variant="bodyStrong">Seating clashes</Text>
              {conflicts.map((conflict) => (
                <Text key={`${conflict.a}-${conflict.b}`} variant="bodySm">
                  {`${name(conflict.a)} and ${name(conflict.b)} are at the same table`}
                </Text>
              ))}
            </Stack>
          </Card>
        ) : null}

        {isWide ? (
          <Row gap="lg" align="flex-start">
            {tablesSection}
            {sideSection}
          </Row>
        ) : (
          <>
            {tablesSection}
            {sideSection}
          </>
        )}
      </Stack>

      <BottomSheet
        visible={Boolean(seating)}
        onClose={() => setSeating(null)}
        title={seating ? `Seat ${guestLabel(seating)}` : ''}
      >
        <Card padding="none">
          {tables.map((table) => (
            <ListRow
              key={table.id}
              title={table.name}
              meta={`${freeSeats(table)} free`}
              disabled={freeSeats(table) === 0}
              onPress={() => seat(table.id)}
            />
          ))}
        </Card>
      </BottomSheet>

      <TableSheet
        key={editing?.id ?? 'none'}
        table={editing}
        onClose={() => setEditing(null)}
        onSave={(fields) => {
          store.updateTable(editing.id, fields);
          setEditing(null);
        }}
        onDelete={() => {
          store.removeTable(editing.id);
          setEditing(null);
        }}
      />

      <PairSheet
        visible={pairing}
        guests={seatableGuests(guests)}
        onClose={() => setPairing(false)}
        onSave={([a, b]) => {
          if (!store.addAvoidPair(weddingId, a, b)) toast.info('Those two are already kept apart.');
          setPairing(false);
        }}
      />
    </Screen>
  );
}

function TableSheet({ table, onClose, onSave, onDelete }) {
  const [name, setName] = useState(table?.name ?? '');
  const [seats, setSeats] = useState(String(table?.capacity ?? DEFAULT_TABLE_CAPACITY));
  const [confirming, setConfirming] = useState(false);
  if (!table) return null;
  const seated = table.guestIds.length;

  return (
    <>
      <BottomSheet
        visible={Boolean(table) && !confirming}
        onClose={onClose}
        title={`Edit ${table.name}`}
        footer={
          <Button
            label="Save"
            onPress={() => onSave({ name: name.trim() || table.name, capacity: Number(seats) })}
          />
        }
      >
        <Stack gap="md">
          <TextField label="Table name" value={name} onChangeText={setName} />
          <TextField
            label="Seats"
            value={seats}
            onChangeText={setSeats}
            keyboardType="number-pad"
            helper={seated ? `${seated} already seated - it will not go below that.` : undefined}
          />
          <Button label="Delete table" variant="ghost" iconLeft="trash" onPress={() => setConfirming(true)} />
        </Stack>
      </BottomSheet>
      <ConfirmSheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={onDelete}
        title={`Delete ${table.name}?`}
        message={seated ? `The ${seated} guests at it will need a seat again.` : 'The table is empty.'}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}

function PairSheet({ visible, guests, onClose, onSave }) {
  const [pair, setPair] = useState([]);
  const close = () => {
    setPair([]);
    onClose();
  };
  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title="Who should sit apart?"
      subtitle="Pick two guests."
      footer={
        <Button
          label="Keep these two apart"
          disabled={pair.length !== 2}
          onPress={() => {
            onSave(pair);
            setPair([]);
          }}
        />
      }
    >
      <Row gap="xs" wrap>
        {guests.map((guest) => (
          <Chip
            key={guest.id}
            size="sm"
            label={guestLabel(guest)}
            selected={pair.includes(guest.id)}
            onPress={() =>
              setPair((current) =>
                current.includes(guest.id)
                  ? current.filter((id) => id !== guest.id)
                  : [...current, guest.id].slice(-2)
              )
            }
          />
        ))}
      </Row>
    </BottomSheet>
  );
}

function Stat({ label, value }) {
  return (
    <Stack gap="hair">
      <Text variant="caption" color="muted">
        {label}
      </Text>
      <Text variant="bodyStrong">{String(value)}</Text>
    </Stack>
  );
}

export default SeatingScreen;
