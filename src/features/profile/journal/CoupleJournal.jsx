import React from 'react';

import { Card, EmptyState, SectionHeader, Stack, Text, useToast } from '@/design-system/components';
import { useCoupleJournal } from './hooks/useCoupleJournal';
import { JOURNAL_FIELD } from './lib/journalConstants';
import { JournalEntryCard, JournalEntryForm } from './components';

export function CoupleJournal() {
  const toast = useToast();
  const { entries, addRecord, removeRecord } = useCoupleJournal();

  const saveEntry = (values) => {
    const record = addRecord(values);
    if (!record) {
      toast.error('Set up a wedding workspace before saving a journal note.');
      return false;
    }
    toast.success('Journal note saved.');
    return true;
  };

  const removeEntry = (id) => {
    if (removeRecord(id)) toast.info('Journal note removed.');
  };

  return (
    <Stack gap="sm" testID="profile-couple-journal">
      <SectionHeader
        eyebrow="Keep the little things"
        title="Couple journal"
        subtitle="A private-to-this-workspace place for hopes, decisions and moments."
      />
      <Card>
        <JournalEntryForm onSave={saveEntry} />
      </Card>
      {entries.length ? (
        <Stack gap="sm">
          <Text variant="label" color="muted">
            {entries.length} saved {entries.length === 1 ? 'note' : 'notes'}
          </Text>
          {entries.map((entry) => (
            <JournalEntryCard key={`${JOURNAL_FIELD}-${entry.id}`} entry={entry} onRemove={removeEntry} />
          ))}
        </Stack>
      ) : (
        <EmptyState
          icon="heart"
          compact
          title="Start with a small thought"
          message="Save the details you want to remember when planning gets busy."
        />
      )}
    </Stack>
  );
}

export default CoupleJournal;
