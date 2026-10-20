import React from 'react';

import { Card, Chip, Row, Stack, Text } from '@/design-system/components';
import { VENDOR_CATEGORIES } from '@/models';
import { BOOKING_COPY } from '../lib/bookingConstants';

export function BookingCategories({ bookings, onCategoryPress }) {
  const tracked = VENDOR_CATEGORIES.map((category) => ({
    ...category,
    count: bookings.filter((booking) => booking.categoryKey === category.key).length,
  })).filter((category) => category.count > 0);

  return (
    <Stack gap="sm">
      <Stack gap="xxs">
        <Text variant="eyebrow" color="subtle">{BOOKING_COPY.categoriesEyebrow}</Text>
        <Text variant="h3" heading>{BOOKING_COPY.categoriesTitle}</Text>
      </Stack>
      {tracked.length ? (
        <Card padding="md">
          <Row gap="xs" wrap align="flex-start">
            {tracked.map((category) => (
              <Chip
                key={category.key}
                label={`${category.name} · ${category.count}`}
                icon={category.icon}
                size="sm"
                onPress={() => onCategoryPress?.(category.key)}
              />
            ))}
          </Row>
        </Card>
      ) : (
        <Text variant="caption" color="subtle">Your tracked vendor categories will appear here.</Text>
      )}
    </Stack>
  );
}

export default BookingCategories;
