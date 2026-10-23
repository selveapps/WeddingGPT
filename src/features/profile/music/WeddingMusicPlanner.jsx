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
import { MusicItemCard, MusicItemForm } from './components';
import { useWeddingMusic } from './hooks';
import { filterMusic, summariseMusic } from './lib/musicHelpers';

export function WeddingMusicPlanner() {
  const toast = useToast();
  const { records, addRecord, updateRecord, removeRecord } = useWeddingMusic();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const summary = summariseMusic(records);
  const visible = useMemo(() => filterMusic(records, filter, query), [records, filter, query]);
  const save = (values) => {
    const result = editing ? updateRecord(editing.id, values) : addRecord(values);
    if (!result) {
      toast.error('Set up a wedding workspace before saving music.');
      return false;
    }
    toast.success(editing ? 'Music entry updated.' : 'Music entry added.');
    setEditing(null);
    setFormKey((key) => key + 1);
    return true;
  };
  const remove = (id) => {
    if (removeRecord(id)) {
      toast.info('Music entry removed.');
      if (editing?.id === id) setEditing(null);
    } else toast.error('Could not remove this music entry.');
  };
  return (
    <Stack gap="sm" testID="wedding-music-planner">
      <SectionHeader
        eyebrow="Soundtrack"
        title="Music planner"
        subtitle={`${summary.requests} requests · ${summary.doNotPlay} do-not-play · ${summary.played} played`}
      />
      <Card padding="md">
        <MusicItemForm
          key={`${editing?.id || 'new'}-${formKey}`}
          initialValue={editing}
          onSave={save}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </Card>
      {records.length ? (
        <Stack gap="sm">
          <TextField
            label="Search music"
            value={query}
            onChangeText={setQuery}
            placeholder="Title, artist, moment or status"
            icon="search"
            testID="music-search"
          />
          <Row gap="xs" wrap>
            {[
              ['all', 'Everything'],
              ['request', 'Requests'],
              ['do-not-play', 'Do not play'],
            ].map(([value, label]) => (
              <Chip key={value} label={label} selected={filter === value} onPress={() => setFilter(value)} />
            ))}
          </Row>
          {visible.length ? (
            visible.map((item) => (
              <MusicItemCard key={item.id} item={item} onEdit={setEditing} onRemove={remove} />
            ))
          ) : (
            <EmptyState
              icon="search"
              compact
              title="No music matches"
              message="Try another song, artist or filter."
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
          title="Build your wedding soundtrack"
          message="Collect song requests, event moments and do-not-play guidance."
        />
      )}
    </Stack>
  );
}

export default WeddingMusicPlanner;
