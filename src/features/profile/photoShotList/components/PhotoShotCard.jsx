import React from 'react';
import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';

export function PhotoShotCard({ item, onEdit, onRemove, onToggle }) {
  return (
    <Card padding="md">
      <Stack gap="sm" testID={`photo-shot-card-${item.id}`}>
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{item.shot}</Text>
            <Row gap="xs" wrap>
              <Chip
                label={
                  item.priority === 'must-have'
                    ? 'Must-have'
                    : item.priority === 'nice-to-have'
                      ? 'Nice to have'
                      : 'Important'
                }
                size="sm"
                tone={item.priority === 'must-have' ? 'accent' : 'neutral'}
              />
              {item.group ? <Chip label={item.group} size="sm" /> : null}
            </Row>
          </Stack>
          <Stack gap="xs">
            <Button
              label={item.completed ? 'Mark needed' : 'Mark done'}
              variant="ghost"
              size="sm"
              onPress={() => onToggle(item)}
              accessibilityLabel={`${item.completed ? 'Mark incomplete' : 'Mark complete'}: ${item.shot}`}
            />
            <Row gap="xs">
              <Button
                label="Edit"
                variant="ghost"
                size="sm"
                onPress={() => onEdit(item)}
                accessibilityLabel={`Edit ${item.shot}`}
              />
              <Button
                label="Remove"
                variant="ghost"
                size="sm"
                onPress={() => onRemove(item.id)}
                accessibilityLabel={`Remove ${item.shot}`}
              />
            </Row>
          </Stack>
        </Row>
        <Text variant="caption" color="muted">
          {item.completed ? 'Captured' : 'To capture'}
        </Text>
      </Stack>
    </Card>
  );
}

export default PhotoShotCard;
