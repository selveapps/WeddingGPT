import React from 'react';

import { Chip, Row } from '@/design-system/components';
import { CONTACT_FILTER_OPTIONS } from '../lib/contactConstants';

export function ContactFilters({ value, onChange }) {
  return (
    <Row gap="xs" wrap align="flex-start">
      {CONTACT_FILTER_OPTIONS.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </Row>
  );
}

export default ContactFilters;
