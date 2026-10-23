import React, { useMemo, useState } from 'react';

import {
  BottomSheet,
  Button,
  Checkbox,
  Chip,
  ListRow,
  Row,
  Stack,
  Text,
  TextField,
} from '@/design-system/components';
import { RsvpStatus, guestLabel } from '@/models';

/**
 * Choose who is invited to one event. Selection is kept here until "Done", so
 * closing the sheet leaves the event's list as it was.
 */
export function GuestPickerSheet({ visible, guests = [], selected = [], onClose, onDone }) {
  const [chosen, setChosen] = useState(() => new Set(selected));
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () => [...guests].sort((a, b) => guestLabel(a).localeCompare(guestLabel(b))),
    [guests]
  );
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? sorted.filter((guest) => guestLabel(guest).toLowerCase().includes(needle)) : sorted;
  }, [sorted, query]);

  const toggle = (id) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const addAll = (list) => setChosen((current) => new Set([...current, ...list.map((guest) => guest.id)]));

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Who is invited"
      subtitle={`${chosen.size} of ${guests.length} chosen`}
      footer={<Button label="Done" onPress={() => onDone([...chosen])} />}
    >
      <Stack gap="sm">
        <TextField label="Search guests" value={query} onChangeText={setQuery} placeholder="Name" />
        <Row gap="xs" wrap align="flex-start">
          <Chip
            label={query ? 'Add everyone shown' : 'Add everyone'}
            size="sm"
            onPress={() => addAll(shown)}
          />
          <Chip
            label="Add everyone attending"
            size="sm"
            onPress={() => addAll(guests.filter((guest) => guest.rsvpStatus === RsvpStatus.ATTENDING))}
          />
          <Chip label="Clear" size="sm" onPress={() => setChosen(new Set())} />
        </Row>
        {shown.length === 0 ? (
          <Text variant="bodySm" color="muted">
            {guests.length ? 'No guest matches that name.' : 'Add guests first, then choose them here.'}
          </Text>
        ) : (
          <Stack gap="none">
            {shown.map((guest) => (
              <ListRow
                key={guest.id}
                inset={false}
                title={guestLabel(guest)}
                leading={
                  <Checkbox checked={chosen.has(guest.id)} onChange={() => toggle(guest.id)} round={false} />
                }
                showChevron={false}
                onPress={() => toggle(guest.id)}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </BottomSheet>
  );
}

export default GuestPickerSheet;
