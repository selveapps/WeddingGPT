import React from 'react';

import { Avatar, Badge, Icon, Row, Stack, Text, Touchable } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { VENDOR_STATUS_META, VENDOR_CATEGORIES } from '@/models';
import { formatMoney } from '@/lib/currency';

export function BookingRow({ booking, currency = 'USD', onPress }) {
  const { colors, spacing, borderWidths } = useTheme();
  const category = VENDOR_CATEGORIES.find((item) => item.key === booking.categoryKey);
  const status = VENDOR_STATUS_META[booking.status] ?? VENDOR_STATUS_META.saved;

  return (
    <Touchable
      onPress={() => onPress?.(booking)}
      scaleOnPress={false}
      accessibilityLabel={`${booking.name}, ${category?.name ?? 'Vendor'}, ${status.label}`}
      accessibilityHint="Opens booking details"
      style={{
        paddingVertical: spacing.sm,
        borderBottomWidth: borderWidths.hairline,
        borderBottomColor: colors.border,
      }}
    >
      <Row gap="sm" align="center">
        <Avatar name={booking.name} icon={category?.icon ?? 'vendors'} size="md" />
        <Stack gap="xxs" style={{ flex: 1 }}>
          <Text variant="body" numberOfLines={1}>{booking.name}</Text>
          <Text variant="caption" color="subtle" numberOfLines={1}>
            {[category?.name, booking.city].filter(Boolean).join(' · ')}
          </Text>
        </Stack>
        <Stack gap="xxs" align="flex-end">
          <Badge label={status.label} tone={status.tone} />
          {booking.quotedAmount != null ? (
            <Text variant="caption" color="muted">{formatMoney(booking.quotedAmount, currency)}</Text>
          ) : null}
        </Stack>
        <Icon name="chevronRight" size="sm" color="inkSubtle" />
      </Row>
    </Touchable>
  );
}

export default BookingRow;
