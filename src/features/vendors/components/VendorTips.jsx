import React from 'react';

import { Card, Icon, Row, Stack, Text } from '@/design-system/components';
import { VENDOR_TIPS } from '../lib/vendorConstants';

export function VendorTips({ categoryKey = null }) {
  const tips = VENDOR_TIPS.filter(
    (tip) => !tip.categoryKey || !categoryKey || tip.categoryKey === categoryKey
  ).slice(0, 2);
  if (!tips.length) return null;

  return (
    <Stack gap="sm">
      {tips.map((tip) => (
        <Card key={tip.id} tone="muted" padding="md">
          <Row gap="sm" align="flex-start">
            <Icon name="sparkle" size="md" color="brand" />
            <Stack gap="xxs" style={{ flex: 1 }}>
              <Text variant="label">{tip.title}</Text>
              <Text variant="caption" color="muted">
                {tip.body}
              </Text>
            </Stack>
          </Row>
        </Card>
      ))}
    </Stack>
  );
}

export default VendorTips;
