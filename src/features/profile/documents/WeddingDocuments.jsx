import React from 'react';

import {
  Card,
  EmptyState,
  ProgressBar,
  SectionHeader,
  Stack,
  Text,
  useToast,
} from '@/design-system/components';
import { DocumentForm, DocumentRow } from './components';
import { useWeddingDocuments } from './hooks/useWeddingDocuments';
import { summariseDocuments } from './lib/documentHelpers';

export function WeddingDocuments() {
  const toast = useToast();
  const { documents, addRecord, removeRecord, toggleComplete } = useWeddingDocuments();
  const summary = summariseDocuments(documents);

  const save = (values) => {
    if (!addRecord(values)) {
      toast.error('Set up a wedding workspace before adding document reminders.');
      return false;
    }
    toast.success('Checklist item added.');
    return true;
  };

  const remove = (id) => {
    if (removeRecord(id)) toast.info('Checklist item removed.');
  };

  return (
    <Stack gap="sm" testID="profile-documents">
      <SectionHeader
        eyebrow="Keep important details close"
        title="Document checklist"
        subtitle={
          summary.total
            ? `${summary.completed} of ${summary.total} items ready · ${summary.remaining} remaining`
            : 'Track contracts and paperwork without storing sensitive document files here.'
        }
      />
      {summary.total ? (
        <Card padding="md">
          <ProgressBar value={summary.ratio} label="Checklist progress" />
        </Card>
      ) : null}
      <Card>
        <DocumentForm onSave={save} />
      </Card>
      {documents.length ? (
        <Stack gap="sm">
          {documents.map((document) => (
            <DocumentRow key={document.id} document={document} onToggle={toggleComplete} onRemove={remove} />
          ))}
        </Stack>
      ) : (
        <EmptyState
          icon="info"
          compact
          title="No paperwork reminders yet"
          message="Add a checklist reminder; keep original files in a secure location you control."
        />
      )}
      <Text variant="caption" color="subtle">
        This checklist stores labels and notes only, not scans, contracts, or identity documents.
      </Text>
    </Stack>
  );
}

export default WeddingDocuments;
