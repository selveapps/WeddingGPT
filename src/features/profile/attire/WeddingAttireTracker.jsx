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
import { AttireCard, AttireForm } from './components';
import { useAttireTracker } from './hooks/useAttireTracker';
import { ATTIRE_STATUSES, searchAttire, summarizeAttire } from './lib/attireHelpers';

const LABELS = { planned: 'Planned', fitting: 'Fitting', ready: 'Ready', 'picked-up': 'Picked up' };

export function WeddingAttireTracker() {
  const toast = useToast();
  const { records, addRecord, updateRecord, removeRecord } = useAttireTracker();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const summary = summarizeAttire(records);
  const visible = useMemo(
    () => searchAttire(records, query).filter((item) => filter === 'all' || item.status === filter),
    [records, query, filter]
  );
  const save = (values) => {
    const saved = editing ? updateRecord(editing.id, values) : addRecord(values);
    if (!saved) {
      toast.error('Set up a wedding workspace before saving attire.');
      return false;
    }
    toast.success(editing ? 'Attire item updated.' : 'Attire item added.');
    setEditing(null);
    return true;
  };
  const remove = (id) => {
    if (removeRecord(id)) toast.info('Attire item removed.');
  };
  const advance = (item) => {
    const next = ATTIRE_STATUSES[(ATTIRE_STATUSES.indexOf(item.status) + 1) % ATTIRE_STATUSES.length];
    if (updateRecord(item.id, { status: next }))
      toast.success(`Status changed to ${LABELS[next].toLowerCase()}.`);
  };
  return (
    <Stack gap="sm" testID="wedding-attire-tracker">
      <SectionHeader
        eyebrow="Getting ready"
        title="Attire & fittings"
        subtitle={`${summary.total} items · ${summary.ready} ready · ${summary.upcoming} still to collect`}
      />
      <Card>
        <AttireForm
          key={editing?.id || 'new'}
          initialValues={editing || undefined}
          onSave={save}
          onCancel={editing ? () => setEditing(null) : undefined}
          submitLabel={editing ? 'Save changes' : 'Add attire item'}
        />
      </Card>
      <TextField
        label="Search attire"
        value={query}
        onChangeText={setQuery}
        placeholder="Person, garment or notes"
        icon="search"
        testID="attire-search"
      />
      <Row gap="xs" wrap>
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        {ATTIRE_STATUSES.map((status) => (
          <Chip
            key={status}
            label={LABELS[status]}
            selected={filter === status}
            onPress={() => setFilter(status)}
          />
        ))}
      </Row>
      {visible.length ? (
        visible.map((item) => (
          <AttireCard
            key={item.id}
            item={item}
            onEdit={setEditing}
            onRemove={remove}
            onStatusChange={advance}
          />
        ))
      ) : (
        <EmptyState
          icon="check"
          compact
          title={records.length ? 'No matching attire' : 'Plan every fitting'}
          message={
            records.length
              ? 'Try another search or status.'
              : 'Track each person’s outfit, fitting and pickup in one place.'
          }
        />
      )}
    </Stack>
  );
}

export default WeddingAttireTracker;
