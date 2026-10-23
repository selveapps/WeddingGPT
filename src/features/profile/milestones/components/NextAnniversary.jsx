import React from 'react';

import { Card, Row, Stack, Text } from '@/design-system/components';
import { getNextAnniversary } from '../lib/anniversaryHelpers';

export function NextAnniversary({ milestones, now }) {
  const next = getNextAnniversary(milestones, now);
  if (!next) return null;

  return (
    <Card tone="accent" padding="md">
      <Row justify="space-between" align="center" gap="sm">
        <Stack gap="xxs" style={{ flex: 1 }}>
          <Text variant="eyebrow" color="accent">
            Next anniversary
          </Text>
          <Text variant="labelStrong">{next.title}</Text>
          <Text variant="caption" color="muted">
            {next.dateLabel}
          </Text>
        </Stack>
        <Stack gap="xxs" align="center">
          <Text variant="h2" heading>
            {next.daysUntil}
          </Text>
          <Text variant="caption" color="muted">
            {next.daysUntil === 1 ? 'day' : 'days'}
          </Text>
        </Stack>
      </Row>
      <Text variant="caption" color="muted">
        {next.years} {next.years === 1 ? 'year' : 'years'} since this moment
      </Text>
    </Card>
  );
}

export default NextAnniversary;
