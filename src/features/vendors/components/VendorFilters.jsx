import React from 'react';

import { Chip, Row } from '@/design-system/components';
import { VENDOR_FILTER_META, VendorFilter } from '../lib/vendorConstants';

export function VendorFilters({ value, onChange }) {
  return (
    <Row gap="xs" wrap align="flex-start">
      {Object.values(VendorFilter).map((filter) => (
        <Chip
          key={filter}
          label={VENDOR_FILTER_META[filter].label}
          selected={value === filter}
          onPress={() => onChange(filter)}
        />
      ))}
    </Row>
  );
}

export default VendorFilters;
