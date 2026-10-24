import React, { useMemo } from 'react';

import { Badge, Card, ListRow, SectionHeader, Stack } from '@/design-system/components';
import { daysUntil, formatMediumDate } from '@/lib/date';

function followUpLabel(date) {
  const remaining = daysUntil(date);
  if (remaining < 0) return { label: `${Math.abs(remaining)} days overdue`, tone: 'danger' };
  if (remaining === 0) return { label: 'Today', tone: 'warning' };
  if (remaining === 1) return { label: 'Tomorrow', tone: 'warning' };
  return { label: `In ${remaining} days`, tone: 'neutral' };
}

export function VendorFollowUpOverview({ vendors, onVendorPress }) {
  const followUps = useMemo(
    () =>
      vendors
        .filter((vendor) => vendor.followUpAt)
        .sort((left, right) => {
          const leftDays = daysUntil(left.followUpAt);
          const rightDays = daysUntil(right.followUpAt);
          const leftOverdue = leftDays < 0;
          const rightOverdue = rightDays < 0;
          if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
          return leftOverdue
            ? right.followUpAt.localeCompare(left.followUpAt)
            : left.followUpAt.localeCompare(right.followUpAt);
        }),
    [vendors]
  );

  if (!followUps.length) return null;

  return (
    <Stack gap="sm" testID="vendor-follow-up-overview">
      <SectionHeader
        eyebrow="Next steps"
        title="Vendor follow-ups"
        subtitle={`${followUps.length} ${followUps.length === 1 ? 'check-in' : 'check-ins'} scheduled`}
      />
      <Card padding="none">
        {followUps.map((vendor) => {
          const timing = followUpLabel(vendor.followUpAt);
          return (
            <ListRow
              key={vendor.id}
              icon="calendar"
              title={vendor.name}
              subtitle={[formatMediumDate(vendor.followUpAt), vendor.followUpNote?.trim()]
                .filter(Boolean)
                .join(' · ')}
              trailing={<Badge label={timing.label} tone={timing.tone} />}
              onPress={() => onVendorPress(vendor)}
            />
          );
        })}
      </Card>
    </Stack>
  );
}

export default VendorFollowUpOverview;
