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
import { PhotoShotCard, PhotoShotForm } from './components';
import { useWeddingPhotoShots } from './hooks';
import { filterPhotoShots, normalisePhotoShot, summarisePhotoShots } from './lib/photoShotListHelpers';

export function WeddingPhotoShotList() {
  const toast = useToast();
  const { records, addRecord, updateRecord, removeRecord } = useWeddingPhotoShots();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const summary = summarisePhotoShots(records);
  const visible = useMemo(() => filterPhotoShots(records, filter, query), [records, filter, query]);
  const save = (values) => {
    const result = editing ? updateRecord(editing.id, values) : addRecord(values);
    if (!result) {
      toast.error('Set up a wedding workspace before saving photo shots.');
      return false;
    }
    toast.success(editing ? 'Photo shot updated.' : 'Photo shot added.');
    setEditing(null);
    setFormKey((key) => key + 1);
    return true;
  };
  const remove = (id) => {
    if (removeRecord(id)) {
      toast.info('Photo shot removed.');
      if (editing?.id === id) setEditing(null);
    } else toast.error('Could not remove this photo shot.');
  };
  const toggle = (item) => {
    const result = updateRecord(item.id, normalisePhotoShot({ ...item, completed: !item.completed }));
    if (result) toast.success(result.completed ? 'Marked as captured.' : 'Added back to the shot list.');
    else toast.error('Could not update this photo shot.');
  };
  return (
    <Stack gap="sm" testID="wedding-photo-shot-list">
      <SectionHeader
        eyebrow="Capture the moments"
        title="Photo shot list"
        subtitle={`${summary.completed} captured · ${summary.remaining} to capture · ${summary.mustHave} must-haves`}
      />
      <Card padding="md">
        <PhotoShotForm
          key={`${editing?.id || 'new'}-${formKey}`}
          initialValue={editing}
          onSave={save}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </Card>
      {records.length ? (
        <Stack gap="sm">
          <TextField
            label="Search shot list"
            value={query}
            onChangeText={setQuery}
            placeholder="Shot, group or priority"
            icon="search"
            testID="photo-shot-search"
          />
          <Row gap="xs" wrap>
            {[
              ['all', 'All shots'],
              ['remaining', 'To capture'],
              ['complete', 'Captured'],
            ].map(([value, label]) => (
              <Chip key={value} label={label} selected={filter === value} onPress={() => setFilter(value)} />
            ))}
          </Row>
          {visible.length ? (
            visible.map((item) => (
              <PhotoShotCard
                key={item.id}
                item={item}
                onEdit={setEditing}
                onRemove={remove}
                onToggle={toggle}
              />
            ))
          ) : (
            <EmptyState
              icon="search"
              compact
              title="No photo shots found"
              message="Try another search or completion filter."
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
          icon="sparkle"
          compact
          title="Create your photo wish list"
          message="Capture the people, details and moments you don't want to miss."
        />
      )}
    </Stack>
  );
}

export default WeddingPhotoShotList;
