import React from 'react';

import { Button, Card, Row, Stack, Text } from '@/design-system/components';
import { formatJournalDate } from '../lib/journalHelpers';

export function JournalEntryCard({ entry, onRemove }) {
  return (
    <Card padding="md">
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xxs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{entry.title}</Text>
            <Text variant="caption" color="subtle">
              {formatJournalDate(entry.createdAt)}
            </Text>
          </Stack>
          <Button
            label="Remove"
            variant="ghost"
            size="sm"
            onPress={() => onRemove(entry.id)}
            accessibilityLabel={`Remove journal note ${entry.title}`}
          />
        </Row>
        <Text variant="bodySm">{entry.body}</Text>
      </Stack>
    </Card>
  );
}

export default JournalEntryCard;
