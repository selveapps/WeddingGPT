import React, { useEffect, useMemo, useState } from 'react';

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
import { useWeddingStore, selectWedding } from '@/store';
import { PHOTOS_SUPPORTED, prunePhotos, removePhoto } from '@/services/photos';
import { VISION_FIELD } from './lib/visionConstants';
import { useWeddingVision } from './hooks/useWeddingVision';
import { VisionFilters, VisionIdeaCard, VisionIdeaForm } from './components';
import {
  filterVisionIdeas,
  searchVisionIdeas,
  sortVisionIdeas,
  summariseVision,
  visionPhotoKeys,
} from './lib/visionHelpers';

const DEFAULT_FILTERS = { category: 'all', mood: 'all', savedOnly: false };

export function WeddingVisionBoard() {
  const toast = useToast();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const { ideas, addRecord, updateRecord, removeRecord } = useWeddingVision();
  const weddingId = useWeddingStore(selectWedding)?.id ?? null;
  const visibleIdeas = useMemo(
    () => sortVisionIdeas(searchVisionIdeas(filterVisionIdeas(ideas, filters), query), sortBy),
    [ideas, filters, query, sortBy]
  );
  const summary = summariseVision(ideas);

  // Tidy this phone's photos when the board opens: drop ones picked for an
  // idea never saved, or whose idea was deleted on the other phone. Only on
  // open, so a photo waiting in the form is never swept up by a sync.
  useEffect(() => {
    const board = useWeddingStore.getState().wedding?.[VISION_FIELD];
    prunePhotos(weddingId, visionPhotoKeys(Array.isArray(board) ? board : []));
  }, [weddingId]);

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
    const photo = ideas.find((idea) => idea.id === id)?.photo;
    if (!removeRecord(id)) return;
    if (photo) removePhoto(weddingId, photo.key);
    toast.info('Idea removed.');
  };

  return (
    <Stack gap="sm" testID="profile-vision-board">
      <SectionHeader
        eyebrow="Make the feeling tangible"
        title="Wedding vision"
        subtitle={`${summary.total} ideas · ${summary.photos} photos · ${summary.saved} pinned`}
      />
      <Card>
        <VisionIdeaForm onSave={saveIdea} weddingId={weddingId} photoCount={summary.photos} />
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
          <Row gap="xs" wrap>
            <Chip
              label="Pinned and recent"
              selected={sortBy === 'recent'}
              onPress={() => setSortBy('recent')}
            />
            <Chip label="Pinned and A–Z" selected={sortBy === 'title'} onPress={() => setSortBy('title')} />
          </Row>
          <VisionFilters value={filters} onChange={setFilters} categoryCounts={summary.categoryCounts} />
          {visibleIdeas.length ? (
            <Stack gap="sm">
              {visibleIdeas.map((idea) => (
                <VisionIdeaCard
                  key={idea.id}
                  idea={idea}
                  weddingId={weddingId}
                  onToggleSaved={toggleSaved}
                  onRemove={removeIdea}
                />
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
          message={
            PHOTOS_SUPPORTED
              ? 'Save photos and notes for colors, flowers, music and the atmosphere you want to create.'
              : 'Save notes for colors, flowers, music and the atmosphere you want to create.'
          }
        />
      )}
      <Text variant="caption" color="subtle">
        {PHOTOS_SUPPORTED
          ? 'Ideas sync with your partner. Photos stay on the phone that added them.'
          : 'Ideas sync with your partner. Photos can be added from the phone app.'}
      </Text>
    </Stack>
  );
}

export default WeddingVisionBoard;
