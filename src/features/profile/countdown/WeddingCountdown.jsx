import React from 'react';

import { Card, EmptyState, Row, SectionHeader, Stack, Text } from '@/design-system/components';
import { useWeddingCountdown } from './hooks/useWeddingCountdown';
import { CountdownMetric } from './components/CountdownMetric';

export function WeddingCountdown() {
  const { countdown, breakdown, dateLabel } = useWeddingCountdown();

  return (
    <Stack gap="sm" testID="profile-wedding-countdown">
      <SectionHeader eyebrow="The day is getting closer" title="Wedding countdown" subtitle={dateLabel} />
      <Card tone="brand">
        <Stack gap="md" align="center">
          <Text variant="h2" heading align="center">
            {countdown.label}
          </Text>
          {breakdown ? (
            <Row gap="lg" justify="center" wrap>
              <CountdownMetric value={breakdown.months} label="months" />
              <CountdownMetric value={breakdown.weeks} label="weeks" />
              <CountdownMetric value={breakdown.days} label="days" />
            </Row>
          ) : !countdown.valid ? (
            <EmptyState
              icon="calendar"
              compact
              title="Your date is still open"
              message="Set an exact date in Wedding details to start counting down."
            />
          ) : null}
        </Stack>
      </Card>
    </Stack>
  );
}

export default WeddingCountdown;
