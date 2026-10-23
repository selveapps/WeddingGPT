import React from 'react';
import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';

const LABELS = { planned: 'Planned', fitting: 'Fitting', ready: 'Ready', 'picked-up': 'Picked up' };

export function AttireCard({ item, onEdit, onRemove, onStatusChange }) {
  return (
    <Card padding="md" testID={`attire-card-${item.id}`}>
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{item.garment}</Text>
            <Text variant="bodySm" color="muted">
              For {item.person}
            </Text>
          </Stack>
          <Chip
            label={LABELS[item.status] || 'Planned'}
            tone={item.status === 'ready' || item.status === 'picked-up' ? 'success' : 'warning'}
            size="sm"
          />
        </Row>
        <Text variant="caption" color="muted">
          {[item.fittingDate && `Fitting ${item.fittingDate}`, item.pickupDate && `Pickup ${item.pickupDate}`]
            .filter(Boolean)
            .join(' · ') || 'Add fitting or pickup dates'}
        </Text>
        {item.notes ? (
          <Text variant="caption" color="muted">
            {item.notes}
          </Text>
        ) : null}
        <Row gap="xs" wrap>
          <Button
            label="Edit"
            variant="soft"
            size="sm"
            onPress={() => onEdit(item)}
            testID={`attire-edit-${item.id}`}
          />
          {item.status !== 'picked-up' ? (
            <Button
              label="Advance status"
              variant="ghost"
              size="sm"
              onPress={() => onStatusChange(item)}
              accessibilityLabel={`Advance status for ${item.garment}`}
            />
          ) : null}
          <Button
            label="Remove"
            variant="ghost"
            size="sm"
            onPress={() => onRemove(item.id)}
            accessibilityLabel={`Remove ${item.garment}`}
          />
        </Row>
      </Stack>
    </Card>
  );
}

export default AttireCard;
