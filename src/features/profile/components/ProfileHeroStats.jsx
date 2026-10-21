import React, { useMemo } from 'react';
import { View } from 'react-native';

import { Row, Text, Icon } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { daysUntil } from '@/lib/date';
import { formatMoneyCompact } from '@/lib/currency';

import { PROFILE_LAYOUT_COPY } from '../lib/profileConstants';

/**
 * Three-up stats strip under the hero: days to go, guests, budget.
 * Missing values show an em dash rather than a zero, so "not set" never
 * reads as "none".
 */
export function ProfileHeroStats({ values, style }) {
  const { colors, spacing, radii, borderWidths } = useTheme();
  const empty = PROFILE_LAYOUT_COPY.statEmpty;

  const stats = useMemo(() => {
    const days = values?.date ? daysUntil(values.date) : null;
    const guests = Number(values?.guestCountEstimate);
    const budget = Number(values?.budgetTotal);
    return [
      {
        id: 'days',
        icon: 'calendar',
        label: PROFILE_LAYOUT_COPY.statDays,
        value: days !== null && days >= 0 ? String(days) : empty,
      },
      {
        id: 'guests',
        icon: 'guests',
        label: PROFILE_LAYOUT_COPY.statGuests,
        value: values?.guestCountEstimate != null && guests > 0 ? String(guests) : empty,
      },
      {
        id: 'budget',
        icon: 'budget',
        label: PROFILE_LAYOUT_COPY.statBudget,
        value:
          values?.budgetTotal != null && Number.isFinite(budget) && budget > 0
            ? formatMoneyCompact(budget, values.currency)
            : empty,
      },
    ];
  }, [values, empty]);

  return (
    <Row
      gap="none"
      align="stretch"
      style={[
        {
          paddingVertical: spacing.sm,
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
        },
        style,
      ]}
      testID="profile-hero-stats"
    >
      {stats.map((stat, index) => (
        <View
          key={stat.id}
          accessible
          accessibilityLabel={`${stat.label}: ${stat.value === empty ? 'not set' : stat.value}`}
          style={{
            flex: 1,
            alignItems: 'center',
            gap: spacing.hair,
            paddingHorizontal: spacing.xxs,
            borderLeftWidth: index === 0 ? 0 : borderWidths.hairline,
            borderLeftColor: colors.border,
          }}
        >
          <Icon name={stat.icon} size="sm" color="inkSubtle" />
          <Text variant="h4" numberOfLines={1}>
            {stat.value}
          </Text>
          <Text variant="caption" color="subtle" numberOfLines={1}>
            {stat.label}
          </Text>
        </View>
      ))}
    </Row>
  );
}

export default ProfileHeroStats;
