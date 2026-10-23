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
import { RegistryForm, RegistryGiftCard } from './components';
import { useGiftRegistry } from './hooks/useGiftRegistry';
import { REGISTRY_STATUSES, searchRegistry, summarizeRegistry } from './lib/registryHelpers';

const LABELS = { listed: 'Listed', reserved: 'Reserved', received: 'Received', thanked: 'Thank-you sent' };

export function GiftRegistryTracker() {
  const toast = useToast();
  const { records, addRecord, updateRecord, removeRecord } = useGiftRegistry();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const summary = summarizeRegistry(records);
  const visible = useMemo(
    () => searchRegistry(records, query).filter((gift) => filter === 'all' || gift.status === filter),
    [records, query, filter]
  );
  const save = (values) => {
    const record = editing ? updateRecord(editing.id, values) : addRecord(values);
    if (!record) {
      toast.error('Set up a wedding workspace before saving registry gifts.');
      return false;
    }
    setEditing(null);
    toast.success(editing ? 'Registry gift updated.' : 'Gift added to the registry.');
    return true;
  };
  const remove = (id) => {
    if (removeRecord(id)) toast.info('Registry gift removed.');
  };
  const advance = (gift, status) => {
    if (updateRecord(gift.id, { status })) toast.success(`Gift marked ${LABELS[status].toLowerCase()}.`);
  };
  return (
    <Stack gap="sm" testID="gift-registry-tracker">
      <SectionHeader
        eyebrow="Thoughtful gifts"
        title="Gift registry"
        subtitle={`${summary.total} gifts · ${summary.reserved} claimed · ${summary.thanked} thank-yous sent`}
      />
      <Card>
        <RegistryForm
          key={editing?.id || 'new'}
          initialValues={editing || undefined}
          onSave={save}
          onCancel={editing ? () => setEditing(null) : undefined}
          submitLabel={editing ? 'Save changes' : 'Add registry gift'}
        />
      </Card>
      <TextField
        label="Find a gift"
        value={query}
        onChangeText={setQuery}
        placeholder="Search item or store"
        icon="search"
        testID="registry-search"
      />
      <Row gap="xs" wrap>
        <Chip label="All gifts" selected={filter === 'all'} onPress={() => setFilter('all')} />
        {REGISTRY_STATUSES.map((status) => (
          <Chip
            key={status}
            label={LABELS[status]}
            selected={filter === status}
            onPress={() => setFilter(status)}
          />
        ))}
      </Row>
      {visible.length ? (
        visible.map((gift) => (
          <RegistryGiftCard
            key={gift.id}
            gift={gift}
            onEdit={setEditing}
            onRemove={remove}
            onAdvance={advance}
          />
        ))
      ) : (
        <EmptyState
          icon="vendors"
          compact
          title={records.length ? 'No gifts match' : 'Build your registry'}
          message={
            records.length
              ? 'Try another search or status.'
              : 'Keep store links, prices, reservations and thank-yous together.'
          }
        />
      )}
    </Stack>
  );
}

export default GiftRegistryTracker;
