import React, { useMemo } from 'react';

import { Badge, Card, Row, Stack, Text, Touchable } from '@/design-system/components';
import { recommendLocalPicks } from '@/models';
import { VENDOR_COPY } from '../lib/vendorConstants';

export function VendorTimeline({ weddingDate, tasks = [], onCategoryPress }) {
  const picks = useMemo(() => recommendLocalPicks({ weddingDate, tasks }).slice(0, 4), [tasks, weddingDate]);

  return (
    <Stack gap="sm">
      <Stack gap="xxs">
        <Text variant="eyebrow" color="subtle">
          {VENDOR_COPY.timelineEyebrow}
        </Text>
        <Text variant="h3" heading>
          {VENDOR_COPY.timelineTitle}
        </Text>
        <Text variant="caption" color="muted">
          {VENDOR_COPY.timelineSubtitle}
        </Text>
      </Stack>
      <Card padding="md">
        <Stack gap="xs">
          {picks.map((item) => (
            <Touchable
              key={item.key}
              onPress={() => onCategoryPress?.(item.key)}
              scaleOnPress={false}
              accessibilityLabel={`${item.name}. ${item.urgencyLabel}. ${item.reason}`}
            >
              <Row gap="sm" align="center" style={{ paddingVertical: 4 }}>
                <Stack gap="xxs" style={{ flex: 1 }}>
                  <Text variant="label">{item.name}</Text>
                  <Text variant="caption" color="subtle">
                    {item.reason}
                  </Text>
                </Stack>
                <Badge
                  label={item.urgencyLabel}
                  tone={
                    item.urgency === 'now' ? 'warning' : item.urgency === 'booked' ? 'success' : 'neutral'
                  }
                />
              </Row>
            </Touchable>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}

export default VendorTimeline;
