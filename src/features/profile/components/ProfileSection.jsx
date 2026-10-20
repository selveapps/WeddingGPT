import React from 'react';
import { View } from 'react-native';

import { Stack, Card, SectionHeader, Icon, Text, Row } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

/**
 * A labelled card block inside the Profile form.
 *
 * Keeps every section on the same rhythm: eyebrow + title + optional subtitle,
 * then the fields. When `highlighted` is true (after a failed save that pointed
 * at this section), a soft brand tint draws the eye without shouting error.
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
  const { colors, spacing, radii } = useTheme();

  return (
    <Stack gap="sm" style={style} testID={testID}>
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <Card
        tone={highlighted ? 'brand' : 'plain'}
        padding="lg"
        style={
          highlighted
            ? {
                borderWidth: 1,
                borderColor: colors.brand,
              }
            : undefined
        }
      >
        <Stack gap="md">
          {icon ? (
            <Row gap="sm" align="center">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radii.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: highlighted ? colors.surface : colors.brandSoft,
                }}
              >
                <Icon name={icon} size="sm" color={highlighted ? 'brand' : 'brandSoftInk'} />
              </View>
              <Text variant="labelStrong" color="muted">
                {title}
              </Text>
            </Row>
          ) : null}

          {children}

          {footer ? (
            <View style={{ marginTop: spacing.xs }}>{footer}</View>
          ) : null}
        </Stack>
      </Card>
    </Stack>
  );
}

export default ProfileSection;
