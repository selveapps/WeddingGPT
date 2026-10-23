import React, { useMemo, useState } from 'react';
import {
  Card,
  Chip,
  EmptyState,
  Row,
  SectionHeader,
  Stack,
  TextField,
  useToast,
} from '@/design-system/components';
import { ItineraryCard, ItineraryForm } from './components';
import { useHoneymoonPlanner } from './hooks/useHoneymoonPlanner';
import { HONEYMOON_STATUSES, searchItinerary, summarizeItinerary } from './lib/honeymoonHelpers';

const LABELS = { planned: 'Planned', booked: 'Booked', complete: 'Complete' };

export function HoneymoonPlanner() {
  const toast = useToast();
  const { records, addRecord, updateRecord, removeRecord } = useHoneymoonPlanner();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const summary = summarizeItinerary(records);
  const visible = useMemo(
    () => searchItinerary(records, query).filter((entry) => filter === 'all' || entry.status === filter),
    [records, query, filter]
  );
  const save = (values) => {
    const record = editing ? updateRecord(editing.id, values) : addRecord(values);
    if (!record) {
      toast.error('Set up a wedding workspace before saving itinerary items.');
      return false;
    }
    setEditing(null);
    toast.success(editing ? 'Itinerary item updated.' : 'Itinerary item added.');
    return true;
  };
  const remove = (id) => {
    if (removeRecord(id)) toast.info('Itinerary item removed.');
  };
  const changeStatus = (entry, status) => {
    if (updateRecord(entry.id, { status })) toast.success(`Marked ${LABELS[status].toLowerCase()}.`);
  };
  return (
    <Stack gap="sm" testID="honeymoon-planner">
      <SectionHeader
        eyebrow="The trip after"
        title="Honeymoon itinerary"
        subtitle={`${summary.total} plans · ${summary.booked} booked · ${summary.datesSet} dated`}
      />
      <Card>
        <ItineraryForm
          key={editing?.id || 'new'}
          initialValues={editing || undefined}
          onSave={save}
          onCancel={editing ? () => setEditing(null) : undefined}
          submitLabel={editing ? 'Save changes' : 'Add to itinerary'}
        />
      </Card>
      <TextField
        label="Search itinerary"
        value={query}
        onChangeText={setQuery}
        placeholder="Activity, destination or reference"
        icon="search"
        testID="honeymoon-search"
      />
      <Row gap="xs" wrap>
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        {HONEYMOON_STATUSES.map((status) => (
          <Chip
            key={status}
            label={LABELS[status]}
            selected={filter === status}
            onPress={() => setFilter(status)}
          />
        ))}
      </Row>
      {visible.length ? (
        visible.map((entry) => (
          <ItineraryCard
            key={entry.id}
            entry={entry}
            onEdit={setEditing}
            onRemove={remove}
            onStatusChange={changeStatus}
          />
        ))
      ) : (
        <EmptyState
          icon="calendar"
          compact
          title={records.length ? 'No plans match' : 'Map out your getaway'}
          message={
            records.length
              ? 'Try a different search or booking status.'
              : 'Save activities, destinations, dates and confirmations for your trip.'
          }
        />
      )}
    </Stack>
  );
}

export default HoneymoonPlanner;
