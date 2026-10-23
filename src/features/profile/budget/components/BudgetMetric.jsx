import React from 'react';

import { Stack, Text } from '@/design-system/components';

export function BudgetMetric({ label, value, tone = 'default' }) {
  return (
    <Stack gap="xxs" style={{ flex: 1, minWidth: 90 }}>
      <Text variant="caption" color="muted">
        {label}
      </Text>
      <Text variant="labelStrong" color={tone}>
        {value}
      </Text>
    </Stack>
  );
}

export default BudgetMetric;
