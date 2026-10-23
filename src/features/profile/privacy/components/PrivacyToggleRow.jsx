import React from 'react';
import { View } from 'react-native';

import { Card, Row, Stack, Text, Touchable } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

export function PrivacyToggleRow({ title, description, value, onChange, testID }) {
  const { colors, spacing, radii } = useTheme();
  const backgroundColor = value ? colors.brand : colors.surfaceSunken;
  const knobColor = value ? colors.inkOnBrand : colors.inkSubtle;

  return (
    <Card padding="md" tone="sunken">
      <Row align="center" gap="md">
        <Stack gap="xxs" style={{ flex: 1 }}>
          <Text variant="labelStrong">{title}</Text>
          <Text variant="caption" color="muted">
            {description}
          </Text>
        </Stack>
        <Touchable
          onPress={() => onChange(!value)}
          accessibilityRole="switch"
          accessibilityLabel={title}
          accessibilityState={{ checked: value }}
          testID={testID}
          style={{
            width: 48,
            height: 28,
            padding: 3,
            borderRadius: radii.pill,
            backgroundColor,
            justifyContent: 'center',
          }}
        >
          <View
            accessibilityElementsHidden
            style={{
              width: 22,
              height: 22,
              borderRadius: radii.pill,
              backgroundColor: knobColor,
              alignSelf: value ? 'flex-end' : 'flex-start',
              marginHorizontal: spacing.xxs,
            }}
          />
        </Touchable>
      </Row>
    </Card>
  );
}

export default PrivacyToggleRow;
