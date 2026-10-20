import React, { useMemo } from 'react';

import { Stack, Card, ListRow, SectionHeader } from '@/design-system/components';

import { buildSummaryRows } from '../lib/profileHelpers';

/**
 * Read-only snapshot of the wedding facts.
 *
 * Useful above the fold when the form is long - the couple can scan names,
 * date, place and budget without scrolling through every field. Rows are not
 * pressable here; editing happens in the form sections below.
 */
export function ProfileSummaryCard({ values, style }) {
  const rows = useMemo(() => buildSummaryRows(values), [values]);

  return (
    <Stack gap="sm" style={style} testID="profile-summary">
      <SectionHeader
        eyebrow="At a glance"
        title="Wedding snapshot"
        subtitle="Everything the plan already knows about your day."
      />
      <Card padding="none">
        {rows.map((row) => (
          <ListRow
            key={row.id}
            icon={row.icon}
            title={row.title}
            subtitle={row.value}
            meta={row.meta}
            showChevron={false}
          />
        ))}
      </Card>
    </Stack>
  );
}

export default ProfileSummaryCard;
