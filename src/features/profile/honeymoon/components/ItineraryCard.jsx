import React from 'react';
import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';

const LABELS = { planned: 'Planned', booked: 'Booked', complete: 'Complete' };

export function ItineraryCard({ entry, onEdit, onRemove, onStatusChange }) {
  const nextStatus = entry.status === 'planned' ? 'booked' : entry.status === 'booked' ? 'complete' : null;
  return (
    <Card padding="md" testID={`honeymoon-card-${entry.id}`}>
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{entry.item}</Text>
            <Text variant="bodySm" color="muted">
              {entry.destination}
            </Text>
          </Stack>
          <Chip
            label={LABELS[entry.status] || 'Planned'}
            size="sm"
            tone={entry.status === 'complete' ? 'success' : 'warning'}
          />
        </Row>
        <Text variant="caption" color="muted">
          {[entry.date, entry.time].filter(Boolean).join(' · ') || 'Date not set'}
          {entry.bookingReference ? ` · Ref ${entry.bookingReference}` : ''}
        </Text>
        {entry.notes ? (
          <Text variant="caption" color="muted">
            {entry.notes}
          </Text>
        ) : null}
        <Row gap="xs" wrap>
          <Button label="Edit" variant="soft" size="sm" onPress={() => onEdit(entry)} />
          {nextStatus ? (
            <Button
              label={`Mark ${LABELS[nextStatus].toLowerCase()}`}
              variant="ghost"
              size="sm"
              onPress={() => onStatusChange(entry, nextStatus)}
            />
          ) : null}
          <Button
            label="Remove"
            variant="ghost"
            size="sm"
            onPress={() => onRemove(entry.id)}
            accessibilityLabel={`Remove ${entry.item}`}
          />
        </Row>
      </Stack>
    </Card>
  );
}

export default ItineraryCard;
