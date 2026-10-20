import React from 'react';

import { Card, Row, Stack, Text } from '@/design-system/components';

function SummaryItem({ count, label }) {
  return (
    <Stack gap="xxs" style={{ flex: 1 }}>
      <Text variant="h3" heading>{count}</Text>
      <Text variant="caption" color="subtle">{label}</Text>
    </Stack>
  );
}

export function ContactSummary({ contactCount, methods }) {
  return (
    <Card tone="brand">
      <Stack gap="md">
        <Stack gap="xxs">
          <Text variant="eyebrow" color="brand">Vendor address book</Text>
          <Text variant="h3" heading>Your contacts, together</Text>
        </Stack>
        <Row gap="sm" align="flex-start">
          <SummaryItem count={contactCount} label="vendors" />
          <SummaryItem count={methods.email} label="with email" />
          <SummaryItem count={methods.phone} label="with phone" />
        </Row>
      </Stack>
    </Card>
  );
}

export default ContactSummary;
