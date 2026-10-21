import React from 'react';
import { View } from 'react-native';

import { Stack, Card, Icon, Text, Row, Divider } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

/**
 * A titled card holding one group of Profile fields.
 *
 * The header (icon, eyebrow, title, subtitle) lives inside the card so a
 * section reads as one object under the section switcher. When `highlighted`
 * is true (a failed save or a "Next up" tap pointed here), a brand border and
 * a small badge draw the eye without shouting error.
 */
export function ProfileSection({
  eyebrow,
  title,
  subtitle,
  icon,
  children,
  highlighted = false,
  footer,
  style,
  testID,
}) {
  const { colors, spacing, radii, borderWidths } = useTheme();

  return (
    <Card
      tone="plain"
      padding="lg"
      radius="xl"
      style={[
        highlighted ? { borderWidth: borderWidths.thick, borderColor: colors.brand } : null,
        style,
      ]}
      testID={testID}
    >
      <Stack gap="lg">
        <Row gap="sm" align="flex-start">
          {icon ? (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radii.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: highlighted ? colors.brand : colors.brandSoft,
              }}
            >
              <Icon name={icon} size="md" color={highlighted ? 'inkOnBrand' : 'brandSoftInk'} />
            </View>
          ) : null}
          <Stack gap="hair" style={{ flex: 1 }}>
            {eyebrow ? (
              <Text variant="eyebrow" color={highlighted ? 'brand' : 'subtle'}>
                {highlighted ? 'Needs a look' : eyebrow}
              </Text>
            ) : null}
            <Text variant="h3" heading>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="bodySm" color="muted">
                {subtitle}
              </Text>
            ) : null}
          </Stack>
        </Row>

        {children}

        {footer ? (
          <Stack gap="none">
            <Divider spacing="none" />
            <View style={{ paddingTop: spacing.sm }}>{footer}</View>
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}

export default ProfileSection;
