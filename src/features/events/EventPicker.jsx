import React, { useMemo } from 'react';

import { Chip, Row, SectionHeader, Stack } from '@/design-system/components';
import { useEventStore, selectEvents } from '@/store/eventStore';
import { eventName, sortEvents } from '@/models';

/**
 * "Which event is this for?" for task and expense forms (slice C1). Shows
 * nothing until the wedding has events, so a one-day wedding never sees it.
 * `null` means the wedding as a whole.
 */
export function EventPicker({ value, onChange, eyebrow = 'For which event' }) {
  const events = useEventStore(selectEvents);
  const sorted = useMemo(() => sortEvents(events), [events]);
  if (!sorted.length) return null;

  return (
    <Stack gap="sm">
      <SectionHeader eyebrow={eyebrow} title="Event" />
      <Row gap="xs" wrap align="flex-start">
        <Chip label="The whole wedding" size="sm" selected={!value} onPress={() => onChange(null)} />
        {sorted.map((event) => (
          <Chip
            key={event.id}
            label={eventName(event)}
            size="sm"
            selected={value === event.id}
            onPress={() => onChange(event.id)}
          />
        ))}
      </Row>
    </Stack>
  );
}

export default EventPicker;
