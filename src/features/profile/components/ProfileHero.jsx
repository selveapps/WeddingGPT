import React, { useMemo } from 'react';
import { View } from 'react-native';

import { Stack, Row, Text, Avatar, Icon, Touchable } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

import { displayCoupleName, heroSubtitle } from '../lib/profileHelpers';
import { PROFILE_COPY } from '../lib/profileConstants';
import { ProfileHeroStats } from './ProfileHeroStats';

const AVATAR_SIZE = 64;

/**
 * The identity block at the top of Profile.
 *
 * A brand-coloured header with the couple's avatars overlapping, their names,
 * a date/place line and a small strength pill. A stats strip (days, guests,
 * budget) sits on a plain surface underneath so the numbers stay legible in
 * both colour schemes. With no partner yet, the second avatar becomes a
 * dashed "+" that opens the partner section via `onPartnerPress`.
 */
export function ProfileHero({ values, completenessPercent = 0, onPartnerPress, style }) {
  const { colors, spacing, radii, shadows, borderWidths } = useTheme();

  const name = useMemo(() => displayCoupleName(values), [values]);
  const subtitle = useMemo(() => heroSubtitle(values), [values]);

  const ownerName = values?.ownerName?.trim() || PROFILE_COPY.heroEmptyName;
  const partnerName = values?.partnerName?.trim() || '';

  const ring = {
    borderRadius: radii.pill,
    borderWidth: borderWidths.thick + 1,
    borderColor: colors.brand,
  };

  return (
    <View
      style={[{ borderRadius: radii.xl, backgroundColor: colors.brand, ...shadows.md }, style]}
      testID="profile-hero"
    >
      <Stack gap="md" style={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
        <Row justify="space-between" align="flex-start">
          <Row gap="none">
            <View style={ring}>
              <Avatar name={ownerName} size={AVATAR_SIZE} tone="accent" />
            </View>
            <View style={[ring, { marginLeft: -spacing.md }]}>
              {partnerName ? (
                <Avatar name={partnerName} size={AVATAR_SIZE} tone="brandHover" />
              ) : (
                <Touchable
                  onPress={onPartnerPress}
                  disabled={!onPartnerPress}
                  haptic="selection"
                  accessibilityLabel={PROFILE_COPY.heroEmptyPartner}
                  style={{
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                    borderRadius: radii.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.brandHover,
                    borderWidth: borderWidths.thin,
                    borderStyle: 'dashed',
                    borderColor: colors.inkOnBrand,
                  }}
                  testID="profile-hero-add-partner"
                >
                  <Icon name="plus" size="lg" color="inkOnBrand" />
                </Touchable>
              )}
            </View>
          </Row>

          <View
            accessible
            accessibilityLabel={`Profile ${completenessPercent}% complete`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xxs,
              paddingVertical: spacing.xxs,
              paddingHorizontal: spacing.xs,
              borderRadius: radii.pill,
              backgroundColor: colors.surface,
            }}
          >
            <Icon name="star" size="xs" color="brand" />
            <Text variant="caption" color="brand">
              {completenessPercent}% complete
            </Text>
          </View>
        </Row>

        <Stack gap="xxs">
          <Text variant="displaySm" color="onBrand" heading numberOfLines={2}>
            {name}
          </Text>
          <Text variant="bodySm" color="onBrand" numberOfLines={2} style={{ opacity: 0.9 }}>
            {subtitle}
          </Text>
          {!partnerName ? (
            <Text variant="caption" color="onBrand" style={{ opacity: 0.85 }}>
              {PROFILE_COPY.heroEmptyPartner} - the dashboard will greet you both.
            </Text>
          ) : null}
        </Stack>
      </Stack>

      <ProfileHeroStats
        values={values}
        style={{ marginHorizontal: spacing.sm, marginBottom: spacing.sm, marginTop: -spacing.xs }}
      />
    </View>
  );
}

export default ProfileHero;
