import React from 'react';
import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';

export function MenuItemCard({ item, onEdit, onRemove }) {
  return (
    <Card padding="md">
      <Stack gap="sm" testID={`menu-card-${item.id}`}>
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{item.dish}</Text>
            <Row gap="xs" wrap>
              {item.course ? <Chip label={item.course} size="sm" /> : null}
              <Chip label={item.status} size="sm" tone="accent" />
            </Row>
          </Stack>
          <Row gap="xs">
            <Button
              label="Edit"
              variant="ghost"
              size="sm"
              onPress={() => onEdit(item)}
              accessibilityLabel={`Edit ${item.dish}`}
            />
            <Button
              label="Remove"
              variant="ghost"
              size="sm"
              onPress={() => onRemove(item.id)}
              accessibilityLabel={`Remove ${item.dish}`}
            />
          </Row>
        </Row>
        {item.dietary ? <Text variant="bodySm">Dietary / allergens: {item.dietary}</Text> : null}
        {item.serving ? (
          <Text variant="caption" color="muted">
            Serving: {item.serving}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}

export default MenuItemCard;
