import React, { useMemo } from 'react';

import { Stack, Card, ListRow, SectionHeader } from '@/design-system/components';

import {
  PROFILE_SECTIONS,
  PROFILE_SECTION_META,
  PROFILE_TIP_COPY,
} from '../lib/profileConstants';

/**
 * Ranked prompts for the next profile details worth filling.
 *
 * Built from the completeness `missing` list so tips stay truthful. Limited to
 * three so the block never becomes a wall of homework. Renders nothing when
 * the profile is complete - the completeness card already celebrates that.
 *
 * Not placed on the main Profile screen any more (the completeness card shows
 * the single best "Next up" tip), but kept for embeds that want a fuller list.
 */
export function ProfileTips({ missing = [], onTipPress, limit = 3, style }) {
  const tips = useMemo(
    () =>
      (missing ?? [])
        .filter((item) => PROFILE_TIP_COPY[item.key])
        .slice(0, limit)
        .map((item) => {
          const meta =
            PROFILE_SECTION_META[item.section] ?? PROFILE_SECTION_META[PROFILE_SECTIONS.PERSONAL];
          return {
            id: item.key,
            section: item.section,
            icon: meta.icon,
            ...PROFILE_TIP_COPY[item.key],
          };
        }),
    [missing, limit]
  );

  if (tips.length === 0) return null;

  return (
    <Stack gap="sm" style={style} testID="profile-tips">
      <SectionHeader
        eyebrow="Worth doing next"
        title="A few easy wins"
        subtitle="Small details that make the rest of the app sharper."
      />
      <Card padding="none">
        {tips.map((tip) => (
          <ListRow
            key={tip.id}
            icon={tip.icon}
            title={tip.title}
            subtitle={tip.subtitle}
            onPress={onTipPress ? () => onTipPress(tip.section) : undefined}
          />
        ))}
      </Card>
    </Stack>
  );
}

export default ProfileTips;
