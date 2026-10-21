import React, { useMemo } from 'react';
import { View } from 'react-native';

import {
  Stack,
  Row,
  Text,
  Card,
  Icon,
  ProgressRing,
  Touchable,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

import {
  PROFILE_COPY,
  PROFILE_LAYOUT_COPY,
  PROFILE_TIP_COPY,
  PROFILE_SECTION_META,
  PROFILE_SECTIONS,
} from '../lib/profileConstants';
import { completenessTone } from '../lib/profileHelpers';

/**
 * Compact profile-strength card.
 *
 * A ring with the percentage inside, one line of copy, and a single "Next up"
 * row pointing at the most useful missing detail. Tapping it opens that
 * section via `onMissingPress(sectionId)`. When nothing is missing the card
 * turns into a quiet success note.
 */
export function ProfileCompleteness({ completeness, onMissingPress, style }) {
  const { colors, spacing, radii } = useTheme();

  const tone = completenessTone(completeness.percent);
  const ringTone = tone === 'neutral' ? 'brand' : tone;
  const subtitle = useMemo(
    () => PROFILE_COPY.completenessSubtitle(completeness.percent),
    [completeness.percent]
  );

  const next = useMemo(() => {
    const item = (completeness.missing ?? []).find((m) => PROFILE_TIP_COPY[m.key]);
    if (!item) return null;
    const meta = PROFILE_SECTION_META[item.section] ?? PROFILE_SECTION_META[PROFILE_SECTIONS.PERSONAL];
    return { ...PROFILE_TIP_COPY[item.key], section: item.section, icon: meta.icon };
  }, [completeness.missing]);

  const remaining = (completeness.missing ?? []).length;

  return (
    <Card tone="plain" style={style} testID="profile-completeness">
      <Stack gap="md">
        <Row gap="md" align="center">
          <ProgressRing
            value={completeness.percent / 100}
            size={68}
            thickness={7}
            tone={ringTone}
            accessibilityLabel={`${PROFILE_COPY.completenessTitle} ${completeness.percent}%`}
          >
            <Text variant="labelStrong">{completeness.percent}%</Text>
          </ProgressRing>
          <Stack gap="xxs" style={{ flex: 1 }}>
            <Text variant="eyebrow" color="subtle">
              {PROFILE_COPY.completenessTitle}
            </Text>
            <Text variant="bodyStrong">
              {completeness.filledCount} of {completeness.totalCount} details filled
            </Text>
            <Text variant="bodySm" color="muted">
              {subtitle}
            </Text>
          </Stack>
        </Row>

        {next ? (
          <Touchable
            onPress={onMissingPress ? () => onMissingPress(next.section) : undefined}
            disabled={!onMissingPress}
            haptic="selection"
            scaleOnPress={false}
            accessibilityLabel={`${PROFILE_LAYOUT_COPY.nextUpLabel}: ${next.title}`}
            accessibilityHint={next.subtitle}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              padding: spacing.sm,
              borderRadius: radii.md,
              backgroundColor: colors.brandSoft,
            }}
            testID="profile-completeness-next"
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radii.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
              }}
            >
              <Icon name={next.icon} size="sm" color="brand" />
            </View>
            <Stack gap="hair" style={{ flex: 1 }}>
              <Text variant="caption" color="brandSoftInk">
                {PROFILE_LAYOUT_COPY.nextUpLabel}
                {remaining > 1 ? ` · ${remaining - 1} more after this` : ''}
              </Text>
              <Text variant="bodyStrong" color="brandSoftInk" numberOfLines={1}>
                {next.title}
              </Text>
              <Text variant="bodySm" color="brandSoftInk" numberOfLines={2}>
                {next.subtitle}
              </Text>
            </Stack>
            <Icon name="chevronRight" size="md" color="brandSoftInk" />
          </Touchable>
        ) : (
          <Row
            gap="sm"
            style={{ padding: spacing.sm, borderRadius: radii.md, backgroundColor: colors.successSoft }}
            testID="profile-completeness-done"
          >
            <Icon name="check" size="md" color="successSoftInk" />
            <Stack gap="hair" style={{ flex: 1 }}>
              <Text variant="bodyStrong" color="successSoftInk">
                {PROFILE_LAYOUT_COPY.completeTitle}
              </Text>
              <Text variant="bodySm" color="successSoftInk">
                {PROFILE_LAYOUT_COPY.completeSubtitle}
              </Text>
            </Stack>
          </Row>
        )}
      </Stack>
    </Card>
  );
}

export default ProfileCompleteness;
