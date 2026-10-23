import React from 'react';

import { Button, Card, Row, Stack, Text } from '@/design-system/components';
import { formatJournalDate } from '../../journal/lib/journalHelpers';
import { countCheckInResponses } from '../lib/checkinHelpers';

export function CheckInCard({ checkIn, onRemove }) {
  const responseCount = countCheckInResponses(checkIn);
  return (
    <Card padding="md">
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xxs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{checkIn.prompt}</Text>
            <Text variant="caption" color="subtle">
              {formatJournalDate(checkIn.createdAt)} · {responseCount} of 2 responses
            </Text>
          </Stack>
          <Button label="Remove" variant="ghost" size="sm" onPress={() => onRemove(checkIn.id)} />
        </Row>
        {checkIn.firstResponse ? (
          <Stack gap="xxs">
            <Text variant="caption" color="muted">
              Your thought
            </Text>
            <Text variant="bodySm">{checkIn.firstResponse}</Text>
          </Stack>
        ) : null}
        {checkIn.secondResponse ? (
          <Stack gap="xxs">
            <Text variant="caption" color="muted">
              Your partner&apos;s thought
            </Text>
            <Text variant="bodySm">{checkIn.secondResponse}</Text>
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}

export default CheckInCard;
