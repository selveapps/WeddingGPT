import React from 'react';

import { Avatar, Badge, Icon, Row, Stack, Text, Touchable } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { VENDOR_STATUS_META, VENDOR_CATEGORIES } from '@/models';
import { formatMoney } from '@/lib/currency';

export function VendorRow({ vendor, currency = 'USD', onPress }) {
  const { colors, spacing, borderWidths } = useTheme();
  const category = VENDOR_CATEGORIES.find((item) => item.key === vendor.categoryKey);
  const status = VENDOR_STATUS_META[vendor.status] ?? VENDOR_STATUS_META.saved;

  return (
    <Touchable
      onPress={() => onPress?.(vendor)}
      scaleOnPress={false}
      accessibilityLabel={`${vendor.name}, ${category?.name ?? 'Vendor'}, ${status.label}`}
      accessibilityHint="Opens vendor details"
      style={{
        paddingVertical: spacing.sm,
        borderBottomWidth: borderWidths.hairline,
        borderBottomColor: colors.border,
      }}
    >
      <Row gap="sm" align="center">
        <Avatar name={vendor.name} icon={category?.icon ?? 'vendors'} size="md" />
        <Stack gap="xxs" style={{ flex: 1 }}>
          <Text variant="body" numberOfLines={1}>
            {vendor.name}
          </Text>
          <Text variant="caption" color="subtle" numberOfLines={1}>
            {[category?.name, vendor.city].filter(Boolean).join(' · ')}
          </Text>
        </Stack>
        <Stack gap="xxs" align="flex-end">
          <Badge label={status.label} tone={status.tone} />
          {vendor.quotedAmount != null ? (
            <Text variant="caption" color="muted">
              {formatMoney(vendor.quotedAmount, currency)}
            </Text>
          ) : null}
        </Stack>
        <Icon name="chevronRight" size="sm" color="inkSubtle" />
      </Row>
    </Touchable>
  );
}

export default VendorRow;
