import React from 'react';
import { View } from 'react-native';

import { Stack, Row, Text, Icon, Touchable, Chip } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

/**
 * The single-select answer surface for onboarding.
 *
 * Rendered as full-width option cards rather than a picker or a dropdown: the
 * PRD asks for one large, calm question per screen (s.4.1), and a card the
 * whole thumb can hit is both easier to read and easier to tap than a row in a
 * list. Selection is immediate and visible, which is the "immediate visual
 * feedback" the same section asks for.
 */
export function ChoiceAnswer({ options = [], value, onChange }) {
  const { colors, spacing, radii, borderWidths } = useTheme();

  return (
    <Stack gap="xs">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Touchable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            haptic="light"
            scaleOnPress={false}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            accessibilityHint={option.description}
            style={{
              borderRadius: radii.lg,
              borderWidth: borderWidths.thin,
              borderColor: selected ? colors.brand : colors.border,
              backgroundColor: selected ? colors.brandSoft : colors.surface,
              padding: spacing.md,
            }}
          >
            <Row gap="sm">
              <Stack gap="hair" style={{ flex: 1 }}>
                <Text variant="h4" color={selected ? 'brandSoftInk' : 'default'}>
                  {option.label}
                </Text>
                {option.description ? (
                  <Text variant="bodySm" color="muted">
                    {option.description}
                  </Text>
                ) : null}
              </Stack>

              {/* A reserved slot rather than a conditional icon, so selecting an
                  option does not shift the text sideways. */}
              <View style={{ width: 24, alignItems: 'center' }}>
                {selected ? <Icon name="check" size="md" color="brand" /> : null}
              </View>
            </Row>
          </Touchable>
        );
      })}
    </Stack>
  );
}

/**
 * The multi-select answer surface.
 *
 * Chips rather than cards: these questions ("what are you drawn to", "what is
 * worrying you") invite several answers, and a wrapped chip field shows eight
 * options at once where eight cards would need scrolling.
 */
export function MultiAnswer({ options = [], value = [], onChange }) {
  const selected = new Set(value ?? []);

  const toggle = (optionValue) => {
    const next = new Set(selected);
    if (next.has(optionValue)) next.delete(optionValue);
    else next.add(optionValue);
    // Emit in the options' own order, so the stored array is stable regardless
    // of the order the couple happened to tap things in.
    onChange(options.map((o) => o.value).filter((v) => next.has(v)));
  };

  return (
    <Row gap="xs" wrap align="flex-start">
      {options.map((option) => (
        <Chip
          key={String(option.value)}
          label={option.label}
          selected={selected.has(option.value)}
          onPress={() => toggle(option.value)}
        />
      ))}
    </Row>
  );
}

export default ChoiceAnswer;
