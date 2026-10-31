import React from 'react';
import { Image } from 'react-native';

import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { PHOTOS_SUPPORTED, photoUri } from '@/services/photos';
import { visionCategoryLabel, visionMoodLabel, visionPhotoAspect } from '../lib/visionHelpers';

export function VisionIdeaCard({ idea, weddingId = null, onToggleSaved, onRemove }) {
  const { radii } = useTheme();
  // Photos stay on the phone that added them (J1); the idea itself syncs.
  const uri = idea.photo ? photoUri(weddingId, idea.photo.key) : null;
  return (
    <Card padding="md" tone={idea.saved ? 'accent' : 'plain'}>
      <Stack gap="sm">
        {uri ? (
          <Image
            source={{ uri }}
            accessibilityLabel={`Photo: ${idea.title}`}
            style={{ width: '100%', aspectRatio: visionPhotoAspect(idea.photo), borderRadius: radii.md }}
          />
        ) : null}
        {idea.photo && !uri ? (
          <Text variant="caption" color="subtle">
            {PHOTOS_SUPPORTED
              ? 'The photo for this idea is on the phone that added it.'
              : 'The photo for this idea is in the phone app.'}
          </Text>
        ) : null}
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{idea.title}</Text>
            <Row gap="xs" wrap>
              <Chip label={visionCategoryLabel(idea.category)} size="sm" />
              {(idea.moods ?? []).map((mood) => (
                <Chip key={mood} label={visionMoodLabel(mood)} size="sm" tone="accent" />
              ))}
            </Row>
          </Stack>
          <Button
            label={idea.saved ? 'Unpin' : 'Pin'}
            variant={idea.saved ? 'secondary' : 'soft'}
            size="sm"
            onPress={() => onToggleSaved(idea.id, !idea.saved)}
            accessibilityLabel={`${idea.saved ? 'Unpin' : 'Pin'} ${idea.title}`}
          />
        </Row>
        {idea.note ? <Text variant="bodySm">{idea.note}</Text> : null}
        <Button
          label="Remove"
          variant="ghost"
          size="sm"
          onPress={() => onRemove(idea.id)}
          accessibilityLabel={`Remove idea ${idea.title}`}
        />
      </Stack>
    </Card>
  );
}

export default VisionIdeaCard;
