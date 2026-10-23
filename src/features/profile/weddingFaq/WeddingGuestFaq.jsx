import React, { useMemo, useState } from 'react';
import {
  Card,
  Chip,
  EmptyState,
  Row,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { GuestFaqCard, GuestFaqForm } from './components';
import { useWeddingGuestFaq } from './hooks/useWeddingGuestFaq';
import { FAQ_CATEGORIES, searchFaq, sortFaq, summarizeFaq } from './lib/weddingFaqHelpers';

export function WeddingGuestFaq() {
  const toast = useToast();
  const { records, addRecord, updateRecord, removeRecord } = useWeddingGuestFaq();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [preview, setPreview] = useState(false);
  const [editing, setEditing] = useState(null);
  const summary = summarizeFaq(records);
  const visible = useMemo(() => {
    let list = searchFaq(records, query);
    if (categoryFilter !== 'all') list = list.filter((entry) => entry.category === categoryFilter);
    if (preview) list = list.filter((entry) => entry.visible);
    return sortFaq(list);
  }, [records, query, categoryFilter, preview]);
  const save = (values) => {
    const record = editing ? updateRecord(editing.id, values) : addRecord(values);
    if (!record) {
      toast.error('Set up a wedding workspace before saving FAQ copy.');
      return false;
    }
    setEditing(null);
    toast.success(editing ? 'Guest answer updated.' : 'Guest answer added.');
    return true;
  };
  const remove = (id) => {
    if (removeRecord(id)) toast.info('Guest answer removed.');
  };
  const toggle = (entry) => {
    if (updateRecord(entry.id, { visible: !entry.visible }))
      toast.success(entry.visible ? 'Answer hidden from guests.' : 'Answer published for guests.');
  };
  const move = (entry, direction) => {
    const ordered = sortFaq(records);
    const index = ordered.findIndex((item) => item.id === entry.id);
    const target = ordered[index + direction];
    if (!target) return;
    updateRecord(entry.id, { order: target.order });
    updateRecord(target.id, { order: entry.order });
    toast.success('FAQ order updated.');
  };
  return (
    <Stack gap="sm" testID="wedding-guest-faq">
      <SectionHeader
        eyebrow="Guest-ready details"
        title="Wedding FAQ & copy"
        subtitle={`${summary.total} answers · ${summary.published} published · ${summary.categories} categories`}
      />
      {!preview ? (
        <Card>
          <GuestFaqForm
            key={editing?.id || 'new'}
            initialValues={editing || undefined}
            defaultOrder={records.length + 1}
            onSave={save}
            onCancel={editing ? () => setEditing(null) : undefined}
            submitLabel={editing ? 'Save changes' : 'Add guest answer'}
          />
        </Card>
      ) : null}
      <Row justify="space-between" align="center" gap="sm">
        <Text variant="labelStrong">{preview ? 'Guest preview' : 'Organize your answers'}</Text>
        <Chip
          label={preview ? 'Back to editor' : 'Preview for guests'}
          selected={preview}
          onPress={() => {
            setPreview((value) => !value);
            setEditing(null);
          }}
          testID="faq-preview-toggle"
        />
      </Row>
      <TextField
        label={preview ? 'Search guest answers' : 'Search questions and copy'}
        value={query}
        onChangeText={setQuery}
        placeholder="Search question, answer or category"
        icon="search"
        testID="faq-search"
      />
      <Row gap="xs" wrap>
        <Chip
          label="All categories"
          selected={categoryFilter === 'all'}
          onPress={() => setCategoryFilter('all')}
        />
        {FAQ_CATEGORIES.map((category) => (
          <Chip
            key={category.value}
            label={category.label}
            selected={categoryFilter === category.value}
            onPress={() => setCategoryFilter(category.value)}
          />
        ))}
      </Row>
      {visible.length ? (
        visible.map((entry) => (
          <GuestFaqCard
            key={entry.id}
            entry={entry}
            preview={preview}
            onEdit={setEditing}
            onRemove={remove}
            onToggleVisibility={toggle}
            onMove={move}
          />
        ))
      ) : (
        <EmptyState
          icon="info"
          compact
          title={
            preview
              ? 'No published answers yet'
              : records.length
                ? 'No FAQ entries match'
                : 'Start your guest guide'
          }
          message={
            preview
              ? 'Publish answers in the editor to include them in the guest-facing preview.'
              : 'Write clear answers guests can scan before the wedding.'
          }
        />
      )}
    </Stack>
  );
}

export default WeddingGuestFaq;
