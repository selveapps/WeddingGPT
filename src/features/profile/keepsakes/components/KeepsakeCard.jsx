import React from 'react';

import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';
import { keepsakeCategoryLabel } from '../lib/keepsakeHelpers';

export function KeepsakeCard({ item, onRemove }) {
  return (
    <Card padding="md">
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{item.title}</Text>
            <Row gap="xs" align="center">
              <Chip label={keepsakeCategoryLabel(item.category)} size="sm" />
              {item.date ? (
                <Text variant="caption" color="subtle">
                  {item.date}
                </Text>
              ) : null}
            </Row>
          </Stack>
          <Button
            label="Remove"
            variant="ghost"
            size="sm"
            onPress={() => onRemove(item.id)}
            accessibilityLabel={`Remove keepsake ${item.title}`}
          />
        </Row>
        {item.note ? <Text variant="bodySm">{item.note}</Text> : null}
      </Stack>
    </Card>
  );
}

export default KeepsakeCard;
