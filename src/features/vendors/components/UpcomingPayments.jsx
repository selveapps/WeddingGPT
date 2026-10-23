import React, { useMemo } from 'react';

import { Badge, Card, ListRow, SectionHeader, Stack, Text } from '@/design-system/components';
import { upcomingVendorPayments } from '@/models';
import { formatMoney } from '@/lib/currency';
import { formatMediumDate } from '@/lib/date';

import { VENDOR_COPY } from '../lib/vendorConstants';

/**
 * Unpaid deposits and balances for booked vendors, soonest first. Tapping one
 * marks it paid - the most common thing to do with this list.
 */
export function UpcomingPayments({ vendors, currency = 'USD', onTogglePaid, limit = 5 }) {
  const payments = useMemo(() => upcomingVendorPayments(vendors, { limit }), [vendors, limit]);
  if (!payments.length) return null;

  return (
    <Stack gap="sm">
      <SectionHeader title={VENDOR_COPY.upcomingTitle} />
      <Card padding="none">
        {payments.map((payment) => (
          <ListRow
            key={payment.key}
            title={`${payment.label} - ${payment.vendorName}`}
            subtitle={payment.dueDate ? `Due ${formatMediumDate(payment.dueDate)}` : 'No due date'}
            meta={formatMoney(payment.amount, currency)}
            trailing={payment.overdue ? <Badge label="Overdue" tone="danger" /> : null}
            onPress={() => onTogglePaid?.(payment)}
            accessibilityHint="Marks this payment as paid"
            showChevron={false}
          />
        ))}
      </Card>
      <Text variant="caption" color="subtle">
        {VENDOR_COPY.paymentsHint}
      </Text>
    </Stack>
  );
}

export default UpcomingPayments;
