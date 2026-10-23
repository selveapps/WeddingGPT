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
import { SeatingForm, SeatCard } from './components';
import { useWeddingSeating } from './hooks';
import { filterSeating, summariseSeating } from './lib/seatingHelpers';

export function WeddingSeatingPlanner() {
  const toast = useToast();
  const { records, addRecord, updateRecord, removeRecord } = useWeddingSeating();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const summary = summariseSeating(records);
  const visible = useMemo(() => filterSeating(records, filter, query), [records, filter, query]);
  const save = (values) => {
    const result = editing ? updateRecord(editing.id, values) : addRecord(values);
    if (!result) {
      toast.error('Set up a wedding workspace before saving seating.');
      return false;
    }
    toast.success(editing ? 'Seat assignment updated.' : 'Guest added to seating plan.');
    setEditing(null);
    setFormKey((key) => key + 1);
    return true;
  };
  const remove = (id) => {
    if (removeRecord(id)) {
      toast.info('Guest removed from seating plan.');
      if (editing?.id === id) setEditing(null);
    } else toast.error('Could not remove this guest.');
  };
  return (
    <Stack gap="sm" testID="wedding-seating-planner">
      <SectionHeader
        eyebrow="Reception plan"
        title="Seating planner"
        subtitle={`${summary.assigned} assigned · ${summary.unassigned} unassigned`}
      />
      <Card padding="md">
        <SeatingForm
          key={`${editing?.id || 'new'}-${formKey}`}
          initialValue={editing}
          records={records}
          onSave={save}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </Card>
      {records.length ? (
        <Stack gap="sm">
          <TextField
            label="Find a guest or table"
            value={query}
            onChangeText={setQuery}
            placeholder="Guest, table, seat or note"
            icon="search"
            testID="seating-search"
          />
          <Row gap="xs" wrap>
            {[
              ['all', 'Everyone'],
              ['assigned', 'Assigned'],
              ['unassigned', 'Unassigned'],
            ].map(([value, label]) => (
              <Chip
                key={value}
                label={`${label}${value === 'assigned' ? ` (${summary.assigned})` : value === 'unassigned' ? ` (${summary.unassigned})` : ''}`}
                selected={filter === value}
                onPress={() => setFilter(value)}
              />
            ))}
          </Row>
          {visible.length ? (
            visible.map((record) => (
              <SeatCard key={record.id} record={record} onEdit={setEditing} onRemove={remove} />
            ))
          ) : (
            <EmptyState
              icon="search"
              compact
              title="No seating matches"
              message="Try another guest, table or filter."
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
          title="Plan your first seat"
          message="Add guests and assign tables and positions. Duplicate positions are flagged before saving."
        />
      )}
    </Stack>
  );
}

export default WeddingSeatingPlanner;
