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
import { TransportForm, TransportRouteCard } from './components';
import { useGuestTransport } from './hooks/useGuestTransport';
import { searchTransport, summarizeTransport, TRANSPORT_STATUSES } from './lib/transportHelpers';

const LABELS = { planned: 'Planned', requested: 'Requested', confirmed: 'Confirmed' };

export function GuestTransportPlanner() {
  const toast = useToast();
  const { records, addRecord, updateRecord, removeRecord } = useGuestTransport();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const summary = summarizeTransport(records);
  const visible = useMemo(
    () => searchTransport(records, query).filter((route) => filter === 'all' || route.status === filter),
    [records, query, filter]
  );
  const save = (values) => {
    const record = editing ? updateRecord(editing.id, values) : addRecord(values);
    if (!record) {
      toast.error('Set up a wedding workspace before saving transport.');
      return false;
    }
    setEditing(null);
    toast.success(editing ? 'Transport route updated.' : 'Transport route added.');
    return true;
  };
  const remove = (id) => {
    if (removeRecord(id)) toast.info('Transport route removed.');
  };
  const changeStatus = (route, status) => {
    if (updateRecord(route.id, { status })) toast.success(`Booking marked ${LABELS[status].toLowerCase()}.`);
  };
  return (
    <Stack gap="sm" testID="guest-transport-planner">
      <SectionHeader
        eyebrow="Getting guests there"
        title="Guest transport"
        subtitle={`${summary.routes} routes · ${summary.confirmed} confirmed · ${summary.seats} seats planned`}
      />
      <Card>
        <TransportForm
          key={editing?.id || 'new'}
          initialValues={editing || undefined}
          onSave={save}
          onCancel={editing ? () => setEditing(null) : undefined}
          submitLabel={editing ? 'Save changes' : 'Add transport route'}
        />
      </Card>
      <TextField
        label="Find a route"
        value={query}
        onChangeText={setQuery}
        placeholder="Route, pickup or provider"
        icon="search"
        testID="transport-search"
      />
      <Row gap="xs" wrap>
        <Chip label="All bookings" selected={filter === 'all'} onPress={() => setFilter('all')} />
        {TRANSPORT_STATUSES.map((status) => (
          <Chip
            key={status}
            label={LABELS[status]}
            selected={filter === status}
            onPress={() => setFilter(status)}
          />
        ))}
      </Row>
      {visible.length ? (
        visible.map((route) => (
          <TransportRouteCard
            key={route.id}
            route={route}
            onEdit={setEditing}
            onRemove={remove}
            onStatusChange={changeStatus}
          />
        ))
      ) : (
        <EmptyState
          icon="guests"
          compact
          title={records.length ? 'No routes match' : 'Plan guest journeys'}
          message={
            records.length
              ? 'Try another search or booking status.'
              : 'Coordinate pickup points, providers, timing and seat capacity.'
          }
        />
      )}
    </Stack>
  );
}

export default GuestTransportPlanner;
