import React from 'react';

import { Chip, Row, Stack, Text } from '@/design-system/components';

export function PreferenceChoice({ label, description, options, value, onChange, testID }) {
  return (
    <Stack gap="sm">
      <Stack gap="xxs">
        <Text variant="labelStrong">{label}</Text>
        {description ? (
          <Text variant="caption" color="muted">
            {description}
          </Text>
        ) : null}
      </Stack>
      <Row wrap gap="xs">
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onPress={() => onChange(option.value)}
            testID={`${testID}-${option.value}`}
          />
        ))}
      </Row>
    </Stack>
  );
}

export default PreferenceChoice;
