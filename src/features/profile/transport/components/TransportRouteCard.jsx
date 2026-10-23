import React from 'react';
import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';

const LABELS = { planned: 'Planned', requested: 'Requested', confirmed: 'Confirmed' };

export function TransportRouteCard({ route, onEdit, onRemove, onStatusChange }) {
  const next = route.status === 'planned' ? 'requested' : route.status === 'requested' ? 'confirmed' : null;
  return (
    <Card padding="md" testID={`transport-card-${route.id}`}>
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{route.route}</Text>
            <Text variant="bodySm" color="muted">
              {route.pickup}
              {route.time ? ` · ${route.time}` : ''}
            </Text>
          </Stack>
          <Chip
            label={LABELS[route.status] || 'Planned'}
            size="sm"
            tone={route.status === 'confirmed' ? 'success' : 'warning'}
          />
        </Row>
        <Text variant="caption" color="muted">
          {route.provider}
          {route.contact ? ` · ${route.contact}` : ''} · {route.capacity} seats
        </Text>
        <Row gap="xs" wrap>
          <Button label="Edit" variant="soft" size="sm" onPress={() => onEdit(route)} />
          {next ? (
            <Button
              label={`Mark ${LABELS[next].toLowerCase()}`}
              variant="ghost"
              size="sm"
              onPress={() => onStatusChange(route, next)}
            />
          ) : null}
          <Button
            label="Remove"
            variant="ghost"
            size="sm"
            onPress={() => onRemove(route.id)}
            accessibilityLabel={`Remove ${route.route}`}
          />
        </Row>
      </Stack>
    </Card>
  );
}

export default TransportRouteCard;
