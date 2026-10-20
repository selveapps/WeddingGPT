import React from 'react';

import { Chip, Row } from '@/design-system/components';
import { BOOKING_FILTER_META, BookingFilter } from '../lib/bookingConstants';

export function BookingFilters({ value, onChange }) {
  return (
    <Row gap="xs" wrap align="flex-start">
      {Object.values(BookingFilter).map((filter) => (
        <Chip
          key={filter}
          label={BOOKING_FILTER_META[filter].label}
          selected={value === filter}
          onPress={() => onChange(filter)}
        />
      ))}
    </Row>
  );
}

export default BookingFilters;
