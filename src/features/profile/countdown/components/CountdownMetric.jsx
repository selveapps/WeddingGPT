import React from 'react';

import { Stack, Text } from '@/design-system/components';

export function CountdownMetric({ value, label }) {
  return (
    <Stack gap="xxs" align="center" style={{ minWidth: 54 }}>
      <Text variant="h3" heading>
        {value}
      </Text>
      <Text variant="caption" color="muted">
        {label}
      </Text>
    </Stack>
  );
}

export default CountdownMetric;
