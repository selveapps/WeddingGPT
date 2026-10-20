import React, { useMemo } from 'react';

import {
  Stack,
  Row,
  Text,
  Card,
  ProgressBar,
  ProgressRing,
  Chip,
} from '@/design-system/components';

import { PROFILE_COPY } from '../lib/profileConstants';
import { completenessTone } from '../lib/profileHelpers';

/**
 * Visual summary of how filled-in the profile is.
 *
 * Shows a ring + bar, a short line of product copy, and up to three missing
 * fields as soft chips. Tapping a chip scrolls/focuses that section via
 * `onMissingPress(sectionId)`.
 */
export function ProfileCompleteness({
  completeness,
  onMissingPress,
  style,
}) {
  const tone = completenessTone(completeness.percent);
  const subtitle = useMemo(
    () => PROFILE_COPY.completenessSubtitle(completeness.percent),
    [completeness.percent]
  );

  const missingPreview = (completeness.missing ?? []).slice(0, 3);

  return (
    <Card tone="sunken" style={style} testID="profile-completeness">
      <Stack gap="md">
        <Row gap="md" align="center">
          <ProgressRing
            value={completeness.percent / 100}
            size={64}
            thickness={6}
            tone={tone === 'neutral' ? 'brand' : tone}
          />
          <Stack gap="xxs" style={{ flex: 1 }}>
            <Text variant="eyebrow" color="subtle">
              {PROFILE_COPY.completenessTitle}
            </Text>
            <Text variant="h3" heading>
              {completeness.percent}%
            </Text>
            <Text variant="bodySm" color="muted">
              {completeness.filledCount} of {completeness.totalCount} details filled
            </Text>
          </Stack>
        </Row>

        <ProgressBar
          value={completeness.percent / 100}
          tone={tone === 'neutral' ? 'brand' : tone}
        />

        <Text variant="bodySm" color="muted">
          {subtitle}
        </Text>

        {missingPreview.length > 0 ? (
          <Stack gap="xs">
            <Text variant="caption" color="subtle">
              Still open
            </Text>
            <Row gap="xs" wrap align="flex-start">
              {missingPreview.map((item) => (
                <Chip
                  key={item.key}
                  label={item.label}
                  size="sm"
                  onPress={onMissingPress ? () => onMissingPress(item.section) : undefined}
                />
              ))}
            </Row>
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}

export default ProfileCompleteness;
