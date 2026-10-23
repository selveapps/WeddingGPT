import React, { useMemo, useState } from 'react';

import {
  Card,
  EmptyState,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { useWeddingVision } from './hooks/useWeddingVision';
import { VisionFilters, VisionIdeaCard, VisionIdeaForm } from './components';
import { filterVisionIdeas, searchVisionIdeas, summariseVision } from './lib/visionHelpers';

const DEFAULT_FILTERS = { category: 'all', mood: 'all', savedOnly: false };

export function WeddingVisionBoard() {
  const toast = useToast();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [query, setQuery] = useState('');
  const { ideas, addRecord, updateRecord, removeRecord } = useWeddingVision();
  const visibleIdeas = useMemo(
    () => searchVisionIdeas(filterVisionIdeas(ideas, filters), query),
    [ideas, filters, query]
  );
  const summary = summariseVision(ideas);

  const saveIdea = (values) => {
    if (!addRecord(values)) {
      toast.error('Set up a wedding workspace before saving inspiration.');
      return false;
    }
    toast.success('Idea saved.');
    return true;
  };

  const toggleSaved = (id, saved) => {
    if (updateRecord(id, { saved })) toast.info(saved ? 'Idea pinned.' : 'Idea unpinned.');
  };

  const removeIdea = (id) => {
    if (removeRecord(id)) toast.info('Idea removed.');
  };

  return (
    <Stack gap="sm" testID="profile-vision-board">
      <SectionHeader
        eyebrow="Make the feeling tangible"
        title="Wedding vision"
        subtitle={`${summary.total} ideas · ${summary.saved} pinned · ${summary.categories} areas`}
      />
      <Card>
        <VisionIdeaForm onSave={saveIdea} />
      </Card>
      {ideas.length ? (
        <Stack gap="md">
          <TextField
            label="Search ideas"
            value={query}
            onChangeText={setQuery}
            placeholder="Search titles, notes, areas or moods"
            icon="search"
          />
          <VisionFilters value={filters} onChange={setFilters} />
          {visibleIdeas.length ? (
            <Stack gap="sm">
              {visibleIdeas.map((idea) => (
                <VisionIdeaCard key={idea.id} idea={idea} onToggleSaved={toggleSaved} onRemove={removeIdea} />
              ))}
            </Stack>
          ) : (
            <EmptyState
              icon="search"
              compact
              title="No ideas match these filters"
              message="Try another area or feeling, or show all your saved ideas."
              actionLabel="Clear filters"
              onAction={() => {
                setFilters(DEFAULT_FILTERS);
                setQuery('');
              }}
            />
          )}
        </Stack>
      ) : (
        <EmptyState
          icon="sparkle"
          compact
          title="Collect the details that feel like you"
          message="Save notes for colors, flowers, music and the atmosphere you want to create."
        />
      )}
      <Text variant="caption" color="subtle">
        This board stores notes and tags only; add links to your own trusted inspiration sources in a note.
      </Text>
    </Stack>
  );
}

export default WeddingVisionBoard;
