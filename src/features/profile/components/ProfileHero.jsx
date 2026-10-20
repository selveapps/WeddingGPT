import React, { useMemo } from 'react';
import { View } from 'react-native';

import {
  Stack,
  Row,
  Text,
  Avatar,
  Badge,
  Card,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

import {
  displayCoupleName,
  formatCountdownLine,
  formatWeddingDateLine,
  formatLocationLine,
  heroSubtitle,
} from '../lib/profileHelpers';
import { PROFILE_COPY } from '../lib/profileConstants';

/**
 * The identity block at the top of Profile.
 *
 * Brand-adjacent rather than loud: a large avatar, the couple name, and a short
 * line for date/place. The countdown badge only appears when there is a date
 * worth counting toward - otherwise the hero stays quiet.
 */
export function ProfileHero({ values, completenessPercent = 0, style }) {
  const { colors, spacing, radii } = useTheme();

  const name = useMemo(() => displayCoupleName(values), [values]);
  const subtitle = useMemo(() => heroSubtitle(values), [values]);
  const countdown = useMemo(() => formatCountdownLine(values), [values]);
  const dateLine = useMemo(() => formatWeddingDateLine(values), [values]);
  const locationLine = useMemo(() => formatLocationLine(values), [values]);

  const avatarName =
    values?.ownerName?.trim() ||
    values?.partnerName?.trim() ||
    PROFILE_COPY.heroEmptyName;

  return (
    <Card tone="raised" style={style} testID="profile-hero">
      <Stack gap="md">
        <Row gap="md" align="center">
          <View
            style={{
              padding: spacing.xxs,
              borderRadius: radii.pill,
              backgroundColor: colors.brandSoft,
            }}
          >
            <Avatar name={avatarName} size={72} tone="brand" />
          </View>

          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="eyebrow" color="subtle">
              {PROFILE_COPY.screenEyebrow}
            </Text>
            <Text variant="h2" heading numberOfLines={2}>
              {name}
            </Text>
            <Text variant="bodySm" color="muted" numberOfLines={2}>
              {subtitle}
            </Text>
          </Stack>
        </Row>

        <Row gap="xs" wrap align="flex-start">
          {countdown ? (
            <Badge label={countdown} tone="brand" icon="calendar" />
          ) : (
            <Badge label={dateLine} tone="neutral" icon="calendar" />
          )}
          {locationLine !== 'Location not set yet' ? (
            <Badge label={locationLine} tone="accent" icon="location" />
          ) : null}
          <Badge
            label={`${completenessPercent}% complete`}
            tone={completenessPercent >= 90 ? 'success' : completenessPercent >= 60 ? 'brand' : 'neutral'}
          />
        </Row>

        {!values?.partnerName?.trim() ? (
          <Text variant="caption" color="subtle">
            {PROFILE_COPY.heroEmptyPartner} when you are ready - the dashboard will greet you both.
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}

export default ProfileHero;
