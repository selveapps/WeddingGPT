import React from 'react';

import { Card, Row, Stack, Text } from '@/design-system/components';
import { formatMoney } from '@/lib/currency';

function Metric({ value, label }) {
  return (
    <Stack gap="xxs" style={{ flex: 1 }}>
      <Text variant="h3" heading>
        {value}
      </Text>
      <Text variant="caption" color="subtle">
        {label}
      </Text>
    </Stack>
  );
}

/** Where things stand: counts, and for booked vendors what is paid and owed. */
export function VendorPipeline({ summary, currency = 'USD' }) {
  return (
    <Card tone="brand">
      <Stack gap="md">
        <Stack gap="xxs">
          <Text variant="eyebrow" color="brand">
            Pipeline
          </Text>
          <Text variant="h3" heading>
            Where things stand
          </Text>
        </Stack>
        <Row gap="sm" align="flex-start">
          <Metric value={summary.total} label="tracked" />
          <Metric value={summary.inProgress} label="in motion" />
          <Metric value={summary.booked} label="booked" />
        </Row>
        {summary.bookedAmount > 0 ? (
          <Row gap="sm" align="flex-start">
            <Metric value={formatMoney(summary.bookedAmount, currency)} label="contracted" />
            <Metric value={formatMoney(summary.paid, currency)} label="paid" />
            <Metric value={formatMoney(summary.outstanding, currency)} label="still owed" />
          </Row>
        ) : null}
      </Stack>
    </Card>
  );
}

export default VendorPipeline;
