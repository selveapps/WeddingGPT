import React from 'react';

import { Card, Checkbox, Row, Stack, Text } from '@/design-system/components';
import { paymentTotals } from '@/models';
import { formatMoney } from '@/lib/currency';
import { formatMediumDate } from '@/lib/date';

import { VENDOR_COPY } from '../lib/vendorConstants';

/**
 * A vendor's deposit and balance. Each can be ticked off as paid; the footer
 * shows what is left to pay against the quote.
 */
export function VendorPaymentPlan({ vendor, currency = 'USD', onTogglePaid }) {
  const payments = (vendor.payments ?? []).filter((payment) => payment.amount > 0 || payment.dueDate);

  if (!payments.length) {
    return (
      <Card tone="muted">
        <Text variant="body" color="muted">
          {VENDOR_COPY.paymentsEmpty}
        </Text>
      </Card>
    );
  }

  const totals = paymentTotals(vendor);

  return (
    <Card padding="md">
      <Stack gap="sm">
        {payments.map((payment) => (
          <Row key={payment.id} align="center" gap="sm">
            <Checkbox
              checked={Boolean(payment.paidAt)}
              onChange={() => onTogglePaid?.(payment)}
              label={`${payment.label} paid`}
            />
            <Stack gap="xxs" style={{ flex: 1 }}>
              <Text variant="label">{payment.label}</Text>
              <Text variant="caption" color="subtle">
                {payment.paidAt
                  ? `Paid ${formatMediumDate(payment.paidAt.slice(0, 10))}`
                  : payment.dueDate
                    ? `Due ${formatMediumDate(payment.dueDate)}`
                    : 'No due date'}
              </Text>
            </Stack>
            <Text variant="body">{formatMoney(payment.amount ?? 0, currency)}</Text>
          </Row>
        ))}
        {totals.total > 0 ? (
          <Text variant="caption" color="muted">
            {totals.outstanding > 0
              ? `${formatMoney(totals.outstanding, currency)} still to pay of ${formatMoney(totals.total, currency)}`
              : `Paid in full - ${formatMoney(totals.total, currency)}`}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}

export default VendorPaymentPlan;
