import React from 'react';

import { Chip, Row, Stack, Text } from '@/design-system/components';
import { VISION_CATEGORIES, VISION_MOODS } from '../lib/visionConstants';

export function VisionFilters({ value, onChange }) {
  return (
    <Stack gap="sm">
      <Stack gap="xs">
        <Text variant="label">Filter by area</Text>
        <Row gap="xs" wrap>
          <Chip
            label="All"
            selected={value.category === 'all'}
            onPress={() => onChange({ ...value, category: 'all' })}
          />
          {VISION_CATEGORIES.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              selected={value.category === category.value}
              onPress={() => onChange({ ...value, category: category.value })}
            />
          ))}
        </Row>
      </Stack>
      <Stack gap="xs">
        <Text variant="label">Filter by feeling</Text>
        <Row gap="xs" wrap>
          <Chip
            label="Any feeling"
            selected={value.mood === 'all'}
            onPress={() => onChange({ ...value, mood: 'all' })}
          />
          {VISION_MOODS.map((mood) => (
            <Chip
              key={mood.value}
              label={mood.label}
              selected={value.mood === mood.value}
              onPress={() => onChange({ ...value, mood: mood.value })}
            />
          ))}
        </Row>
      </Stack>
      <Chip
        label="Pinned ideas only"
        selected={value.savedOnly}
        onPress={() => onChange({ ...value, savedOnly: !value.savedOnly })}
      />
    </Stack>
  );
}

export default VisionFilters;
