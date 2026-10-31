import React from 'react';
import { View } from 'react-native';

import { Stack, Row, Text, Icon, Touchable } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

/**
 * The single-select answer surface for onboarding.
 *
 * Full-width cards the whole thumb can hit, one tap to answer. The chosen one
 * fills and shows its check - the feedback has to be obvious, because on most
 * steps that tap also moves the journey on. Nothing cascades or pops in.
 */
export function ChoiceAnswer({ options = [], value, onChange }) {
  return (
    <Stack gap="xs">
      {options.map((option) => (
        <ChoiceCard
          key={String(option.value)}
          option={option}
          // `undefined` means unanswered, so a `null` option ("Not sure yet")
          // is not shown as picked before anyone has touched it.
          selected={value !== undefined && option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </Stack>
  );
}

function ChoiceCard({ option, selected, onPress }) {
  const { colors, spacing, radii, borderWidths } = useTheme();

  return (
    <View>
      <Touchable
        onPress={onPress}
        haptic="selection"
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={option.label}
        accessibilityHint={option.description}
        style={{
          borderRadius: radii.lg,
          borderWidth: borderWidths.thick,
          borderColor: selected ? colors.brand : colors.border,
          backgroundColor: selected ? colors.brandSoft : colors.surface,
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.md,
        }}
      >
        <Row gap="sm">
          {option.icon ? (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radii.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.surface : colors.brandSoft,
              }}
            >
              <Icon name={option.icon} size="md" color="brand" />
            </View>
          ) : null}

          <Text variant="bodyStrong" color={selected ? 'brandSoftInk' : 'default'} style={{ flex: 1 }}>
            {option.label}
          </Text>

          {option.description ? (
            <Text variant="caption" color="subtle">
              {option.description}
            </Text>
          ) : null}

          {/* A reserved slot, so selecting does not shift the text sideways. */}
          <View style={{ width: 24, alignItems: 'center' }}>
            {selected ? <Icon name="check" size="md" color="brand" /> : null}
          </View>
        </Row>
      </Touchable>
    </View>
  );
}

export default ChoiceAnswer;
