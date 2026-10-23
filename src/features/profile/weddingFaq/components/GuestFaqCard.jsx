import React from 'react';
import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';
import { faqCategoryLabel } from '../lib/weddingFaqHelpers';

export function GuestFaqCard({ entry, preview = false, onEdit, onRemove, onToggleVisibility, onMove }) {
  return (
    <Card padding="md" tone={preview ? 'brand' : 'plain'} testID={`faq-card-${entry.id}`}>
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{entry.question}</Text>
            <Row gap="xs" wrap>
              <Chip label={faqCategoryLabel(entry.category)} size="sm" />
              <Chip
                label={entry.visible ? 'Published' : 'Hidden'}
                size="sm"
                tone={entry.visible ? 'success' : 'neutral'}
              />
              <Chip label={`#${entry.order}`} size="sm" />
            </Row>
          </Stack>
        </Row>
        <Text variant="bodySm" color="muted">
          {entry.answer}
        </Text>
        {!preview ? (
          <Row gap="xs" wrap>
            <Button label="Edit" variant="soft" size="sm" onPress={() => onEdit(entry)} />
            <Button
              label={entry.visible ? 'Hide from guests' : 'Publish'}
              variant="ghost"
              size="sm"
              onPress={() => onToggleVisibility(entry)}
              accessibilityLabel={`${entry.visible ? 'Hide' : 'Publish'} ${entry.question}`}
            />
            <Button
              label="Move up"
              variant="ghost"
              size="sm"
              onPress={() => onMove(entry, -1)}
              accessibilityLabel={`Move ${entry.question} up`}
            />
            <Button
              label="Move down"
              variant="ghost"
              size="sm"
              onPress={() => onMove(entry, 1)}
              accessibilityLabel={`Move ${entry.question} down`}
            />
            <Button
              label="Remove"
              variant="ghost"
              size="sm"
              onPress={() => onRemove(entry.id)}
              accessibilityLabel={`Remove ${entry.question}`}
            />
          </Row>
        ) : null}
      </Stack>
    </Card>
  );
}

export default GuestFaqCard;
