import React, { useState } from 'react';

import {
  Card,
  Chip,
  EmptyState,
  ProgressBar,
  Row,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { DocumentForm, DocumentRow } from './components';
import { useWeddingDocuments } from './hooks/useWeddingDocuments';
import {
  documentTypeLabel,
  filterDocuments,
  filterDocumentsByType,
  searchDocuments,
  summariseDocuments,
} from './lib/documentHelpers';
import { DOCUMENT_TYPES } from './lib/documentConstants';

const DOCUMENT_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'To do' },
  { value: 'complete', label: 'Ready' },
  { value: 'due-soon', label: 'Due soon' },
  { value: 'overdue', label: 'Overdue' },
];

export function WeddingDocuments() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const { documents, addRecord, removeRecord, toggleComplete } = useWeddingDocuments();
  const summary = summariseDocuments(documents);
  const visibleDocuments = searchDocuments(
    filterDocumentsByType(filterDocuments(documents, statusFilter), typeFilter),
    query
  );

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
            ? `${summary.completed} of ${summary.total} items ready · ${summary.remaining} remaining${summary.overdue ? ` · ${summary.overdue} overdue` : ''}`
            : 'Track contracts and paperwork without storing sensitive document files here.'
        }
      />
      {summary.total ? (
        <TextField
          label="Search checklist"
          value={query}
          onChangeText={setQuery}
          placeholder="Search document types, notes or dates"
          icon="search"
        />
      ) : null}
      {summary.total ? (
        <Card padding="md">
          <ProgressBar value={summary.ratio} label="Checklist progress" />
        </Card>
      ) : null}
      {summary.total ? (
        <Row gap="xs" wrap>
          {DOCUMENT_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              label={
                filter.value === 'overdue'
                  ? `${filter.label} (${summary.overdue})`
                  : filter.value === 'due-soon'
                    ? `${filter.label} (${summary.dueSoon})`
                    : filter.label
              }
              selected={statusFilter === filter.value}
              onPress={() => setStatusFilter(filter.value)}
            />
          ))}
        </Row>
      ) : null}
      {summary.total ? (
        <Row gap="xs" wrap>
          <Chip label="All types" selected={typeFilter === 'all'} onPress={() => setTypeFilter('all')} />
          {DOCUMENT_TYPES.map((type) => (
            <Chip
              key={type.value}
              label={documentTypeLabel(type.value)}
              selected={typeFilter === type.value}
              onPress={() => setTypeFilter(type.value)}
            />
          ))}
        </Row>
      ) : null}
      <Card>
        <DocumentForm onSave={save} />
      </Card>
      {documents.length ? (
        <Stack gap="sm">
          {visibleDocuments.map((document) => (
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
      {documents.length > 0 && visibleDocuments.length === 0 ? (
        <EmptyState
          icon="check"
          compact
          title="No paperwork reminders in this view"
          message="Switch filters to see the rest of your checklist."
          actionLabel="Show all"
          onAction={() => {
            setStatusFilter('all');
            setTypeFilter('all');
            setQuery('');
          }}
        />
      ) : null}
      <Text variant="caption" color="subtle">
        This checklist stores labels and notes only, not scans, contracts, or identity documents.
      </Text>
    </Stack>
  );
}

export default WeddingDocuments;
