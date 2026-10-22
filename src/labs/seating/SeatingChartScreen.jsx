import React, { useMemo, useState } from 'react';

import {
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Chip,
  Button,
  TextField,
  ListRow,
  SectionHeader,
  BottomSheet,
  EmptyState,
  useToast,
} from '@/design-system/components';
import { useGuestStore, selectAllGuests } from '@/store';

import { LabScreen } from '../shared/LabScreen';
import { selectItems, selectMeta } from '../shared/createCollectionStore';
import { useLabSeatingStore } from './store';
import {
  DEFAULT_TABLE_CAPACITY,
  findConflicts,
  freeSeats,
  guestLabel,
  seatableGuests,
  seatingSummary,
  unseatedGuests,
} from './model';

const NO_PAIRS = [];

export default function SeatingChartScreen() {
  const toast = useToast();
  const guests = useGuestStore(selectAllGuests);
  const tables = useLabSeatingStore(selectItems);
  const meta = useLabSeatingStore(selectMeta);
  const store = useLabSeatingStore.getState();
  const avoidPairs = meta.avoidPairs ?? NO_PAIRS;

  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(String(DEFAULT_TABLE_CAPACITY));
  const [picking, setPicking] = useState(null);
  const [pairing, setPairing] = useState(false);
  const [pair, setPair] = useState([]);

  const byId = useMemo(() => new Map(guests.map((guest) => [guest.id, guest])), [guests]);
  const name = (id) => (byId.has(id) ? guestLabel(byId.get(id)) : 'Removed guest');
  const summary = seatingSummary(tables, guests);
  const unseated = unseatedGuests(tables, guests);
  const conflicts = findConflicts(tables, avoidPairs);

  const addTable = () => {
    const seats = Math.max(1, Number(capacity) || DEFAULT_TABLE_CAPACITY);
    store.add({ name: tableName.trim() || `Table ${tables.length + 1}`, capacity: seats, guestIds: [] });
    setTableName('');
  };

  const runAutoSeat = () => {
    const result = store.autoSeat(guests);
    if (result.unplaced.length) toast.warning(`Seated ${result.placed}. ${result.unplaced.length} still need a table.`);
    else toast.success(result.placed ? `Seated ${result.placed} guests` : 'Everyone already has a seat');
  };

  const seat = (tableId) => {
    const result = store.assign(tableId, picking.id);
    if (result.error) toast.warning(result.error);
    setPicking(null);
  };

  return (
    <LabScreen
      title="Seating chart"
      intro="Build tables, seat guests from your list, and keep apart anyone who should not share a table. Your guest list is not changed."
    >
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

      <Stack gap="sm">
        <SectionHeader title="Tables" />
        {tables.length === 0 ? (
          <EmptyState compact icon="guests" title="No tables yet" message="Add your first table above." />
        ) : (
          tables.map((table) => (
            <Card key={table.id} onLongPress={() => store.remove(table.id)} accessibilityHint="Long press to delete the table">
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
                    <Chip key={id} size="sm" label={name(id)} onRemove={() => store.unassign(id)} />
                  ))}
                </Row>
              </Stack>
            </Card>
          ))
        )}
      </Stack>

      <Stack gap="sm">
        <SectionHeader title={`Need a seat (${unseated.length})`} />
        {guests.length === 0 ? (
          <Text variant="bodySm" color="muted">
            Add guests in the Guests tab first.
          </Text>
        ) : (
          <Card padding="none">
            {unseated.slice(0, 40).map((guest) => (
              <ListRow key={guest.id} title={guestLabel(guest)} onPress={() => setPicking(guest)} />
            ))}
          </Card>
        )}
      </Stack>

      <Stack gap="sm">
        <SectionHeader title="Keep apart" actionLabel="Add pair" actionIcon="plus" onActionPress={() => setPairing(true)} />
        {avoidPairs.map(([a, b], index) => (
          <Chip key={`${a}-${b}`} label={`${name(a)} / ${name(b)}`} onRemove={() => store.removeAvoidPair(index)} />
        ))}
      </Stack>

      <BottomSheet
        visible={Boolean(picking)}
        onClose={() => setPicking(null)}
        title={picking ? `Seat ${guestLabel(picking)}` : ''}
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

      <BottomSheet
        visible={pairing}
        onClose={() => {
          setPairing(false);
          setPair([]);
        }}
        title="Who should sit apart?"
        subtitle="Pick two guests."
        footer={
          <Button
            label="Keep these two apart"
            disabled={pair.length !== 2}
            onPress={() => {
              store.addAvoidPair(pair[0], pair[1]);
              setPair([]);
              setPairing(false);
            }}
          />
        }
      >
        <Row gap="xs" wrap>
          {seatableGuests(guests).map((guest) => (
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
    </LabScreen>
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
