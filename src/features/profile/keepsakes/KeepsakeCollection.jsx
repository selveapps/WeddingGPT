import React from 'react';

import { Card, EmptyState, SectionHeader, Stack, Text, useToast } from '@/design-system/components';
import { useKeepsakes } from './hooks/useKeepsakes';
import { KeepsakeCard, KeepsakeForm } from './components';

export function KeepsakeCollection() {
  const toast = useToast();
  const { keepsakes, addRecord, removeRecord } = useKeepsakes();

  const saveKeepsake = (values) => {
    if (!addRecord(values)) {
      toast.error('Set up a wedding workspace before saving a keepsake.');
      return false;
    }
    toast.success('Keepsake saved.');
    return true;
  };

  const removeKeepsake = (id) => {
    if (removeRecord(id)) toast.info('Keepsake removed.');
  };

  return (
    <Stack gap="sm" testID="profile-keepsakes">
      <SectionHeader
        eyebrow="Remember the why"
        title="Keepsakes"
        subtitle="Save stories, traditions and small details you want to carry into the day."
      />
      <Card>
        <KeepsakeForm onSave={saveKeepsake} />
      </Card>
      {keepsakes.length ? (
        <Stack gap="sm">
          <Text variant="label" color="muted">
            {keepsakes.length} saved {keepsakes.length === 1 ? 'keepsake' : 'keepsakes'}
          </Text>
          {keepsakes.map((item) => (
            <KeepsakeCard key={item.id} item={item} onRemove={removeKeepsake} />
          ))}
        </Stack>
      ) : (
        <EmptyState
          icon="sparkle"
          compact
          title="Save something meaningful"
          message="Start with a tradition, a story, or a detail that feels like you."
        />
      )}
    </Stack>
  );
}

export default KeepsakeCollection;
