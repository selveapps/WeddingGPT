import React, { useMemo, useState } from 'react';
import {
  Card,
  Chip,
  EmptyState,
  Row,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { GuestRsvpCard, GuestRsvpForm } from './components';
import { useGuestRsvps } from './hooks';
import { filterGuestRsvps, summariseGuestRsvps } from './lib/guestRsvpHelpers';

export function GuestRsvpTracker() {
  const toast = useToast();
  const { records, addRecord, updateRecord, removeRecord } = useGuestRsvps();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const summary = summariseGuestRsvps(records);
  const visible = useMemo(() => filterGuestRsvps(records, filter, query), [records, filter, query]);
  const save = (values) => {
    const result = editing ? updateRecord(editing.id, values) : addRecord(values);
    if (!result) {
      toast.error('Set up a wedding workspace before saving guest RSVPs.');
      return false;
    }
    toast.success(editing ? 'Guest RSVP updated.' : 'Guest RSVP added.');
    setEditing(null);
    setFormKey((key) => key + 1);
    return true;
  };
  const remove = (id) => {
    if (removeRecord(id)) {
      toast.info('Guest removed from RSVP tracker.');
      if (editing?.id === id) setEditing(null);
    } else toast.error('Could not remove this guest.');
  };
  return (
    <Stack gap="sm" testID="guest-rsvp-tracker">
      <SectionHeader
        eyebrow="Guest planning"
        title="RSVP tracker"
        subtitle={`${summary.guests} households · ${summary.yes} attending · ${summary.pending} pending`}
      />
      <Card padding="md">
        <GuestRsvpForm
          key={`${editing?.id || 'new'}-${formKey}`}
          initialValue={editing}
          onSave={save}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </Card>
      {records.length ? (
        <Stack gap="sm">
          <Text variant="caption" color="muted">
            Party totals · {summary.yes} yes · {summary.no} declined · {summary.pending} awaiting reply
          </Text>
          <TextField
            label="Search guests"
            value={query}
            onChangeText={setQuery}
            placeholder="Name, meal or notes"
            icon="search"
            testID="guest-rsvp-search"
          />
          <Row gap="xs" wrap>
            {[
              ['all', 'Everyone'],
              ['yes', 'Attending'],
              ['no', 'Declined'],
              ['pending', 'Pending'],
            ].map(([value, label]) => (
              <Chip key={value} label={label} selected={filter === value} onPress={() => setFilter(value)} />
            ))}
          </Row>
          {visible.length ? (
            visible.map((guest) => (
              <GuestRsvpCard key={guest.id} guest={guest} onEdit={setEditing} onRemove={remove} />
            ))
          ) : (
            <EmptyState
              icon="search"
              compact
              title="No matching guests"
              message="Try another search or RSVP status."
              actionLabel="Clear filters"
              onAction={() => {
                setQuery('');
                setFilter('all');
              }}
            />
          )}
        </Stack>
      ) : (
        <EmptyState
          icon="guests"
          compact
          title="Start collecting RSVPs"
          message="Track replies, party sizes and meal preferences in one place."
        />
      )}
    </Stack>
  );
}

export default GuestRsvpTracker;
