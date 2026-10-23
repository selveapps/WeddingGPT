import React from 'react';

import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';
import { visionCategoryLabel, visionMoodLabel } from '../lib/visionHelpers';

export function VisionIdeaCard({ idea, onToggleSaved, onRemove }) {
  return (
    <Card padding="md" tone={idea.saved ? 'accent' : 'plain'}>
      <Stack gap="sm">
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
