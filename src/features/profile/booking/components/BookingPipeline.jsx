import React from 'react';

import { Card, Row, Stack, Text } from '@/design-system/components';
import { formatMoney } from '@/lib/currency';

function Metric({ value, label }) {
  return (
    <Stack gap="xxs" style={{ flex: 1 }}>
      <Text variant="h3" heading>{value}</Text>
      <Text variant="caption" color="subtle">{label}</Text>
    </Stack>
  );
}

export function BookingPipeline({ summary, currency = 'USD' }) {
  return (
    <Card tone="brand">
      <Stack gap="md">
        <Stack gap="xxs">
          <Text variant="eyebrow" color="brand">Pipeline</Text>
          <Text variant="h3" heading>Where things stand</Text>
        </Stack>
        <Row gap="sm" align="flex-start">
          <Metric value={summary.total} label="tracked" />
          <Metric value={summary.inProgress} label="in motion" />
          <Metric value={summary.booked} label="booked" />
        </Row>
        {summary.bookedAmount > 0 ? (
          <Text variant="caption" color="muted">
            {formatMoney(summary.bookedAmount, currency)} across booked vendors
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}

export default BookingPipeline;
