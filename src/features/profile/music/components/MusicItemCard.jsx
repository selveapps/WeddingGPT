import React from 'react';
import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';

export function MusicItemCard({ item, onEdit, onRemove }) {
  const requestLabel = item.kind === 'do-not-play' ? 'Do not play' : 'Request';
  return (
    <Card padding="md">
      <Stack gap="sm" testID={`music-card-${item.id}`}>
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{item.title}</Text>
            <Row gap="xs" wrap>
              <Chip
                label={requestLabel}
                size="sm"
                tone={item.kind === 'do-not-play' ? 'neutral' : 'accent'}
              />
              <Chip label={item.status} size="sm" />
            </Row>
          </Stack>
          <Row gap="xs">
            <Button
              label="Edit"
              variant="ghost"
              size="sm"
              onPress={() => onEdit(item)}
              accessibilityLabel={`Edit ${item.title}`}
            />
            <Button
              label="Remove"
              variant="ghost"
              size="sm"
              onPress={() => onRemove(item.id)}
              accessibilityLabel={`Remove ${item.title}`}
            />
          </Row>
        </Row>
        {item.artist ? (
          <Text variant="caption" color="muted">
            {item.artist}
          </Text>
        ) : null}
        {item.moment ? <Text variant="bodySm">Moment: {item.moment}</Text> : null}
      </Stack>
    </Card>
  );
}

export default MusicItemCard;
