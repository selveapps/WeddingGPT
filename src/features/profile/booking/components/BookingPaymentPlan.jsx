import React from 'react';

import { Card, Row, Stack, Text } from '@/design-system/components';
import { formatMoney } from '@/lib/currency';
import { formatMediumDate } from '@/lib/date';
import { BOOKING_COPY } from '../lib/bookingConstants';
import { buildPaymentMilestones } from '../lib/bookingHelpers';

export function BookingPaymentPlan({ booking, currency = 'USD' }) {
  const milestones = buildPaymentMilestones(booking);

  if (!milestones.length) {
    return (
      <Card tone="muted">
        <Text variant="body" color="muted">{BOOKING_COPY.paymentsEmpty}</Text>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <Stack gap="sm">
        {milestones.map((milestone) => (
          <Row key={milestone.id} align="center" justify="space-between">
            <Stack gap="xxs" style={{ flex: 1 }}>
              <Text variant="label">{milestone.label}</Text>
              {milestone.dueAt ? (
                <Text variant="caption" color="subtle">Due {formatMediumDate(milestone.dueAt)}</Text>
              ) : null}
            </Stack>
            <Text variant="body">{formatMoney(milestone.amount ?? 0, currency)}</Text>
          </Row>
        ))}
      </Stack>
    </Card>
  );
}

export default BookingPaymentPlan;
