import React, { useMemo } from 'react';

import { Stack, Card, Text, ListRow, SectionHeader } from '@/design-system/components';

import { PROFILE_SECTIONS, PROFILE_SECTION_META } from '../lib/profileConstants';

/**
 * Gentle, ranked prompts for the next profile detail worth filling.
 *
 * Built from the completeness `missing` list so tips stay truthful - we never
 * ask for something that is already present. Limited to three so the block
 * never becomes a wall of homework.
 */
const TIP_COPY = {
  ownerName: {
    title: 'Add your name',
    subtitle: 'So greetings and the dashboard feel like yours.',
  },
  email: {
    title: 'Add an email',
    subtitle: 'Optional, and kept on this device for now.',
  },
  phone: {
    title: 'Add a phone number',
    subtitle: 'Handy later for vendors and day-of contacts.',
  },
  partnerName: {
    title: 'Name your partner',
    subtitle: 'The home screen will greet you both.',
  },
  date: {
    title: 'Set the wedding date',
    subtitle: 'Even a rough month unlocks the countdown and pacing.',
  },
  city: {
    title: 'Add your city',
    subtitle: 'Local venue and vendor picks need a place to search near.',
  },
  guestCountEstimate: {
    title: 'Estimate your guest count',
    subtitle: 'A band is enough - it shapes budget and seating later.',
  },
  budgetTotal: {
    title: 'Set a starting budget',
    subtitle: 'A number you can change. The Budget tab will refine it.',
  },
  ceremonyType: {
    title: 'Choose the kind of celebration',
    subtitle: 'Ceremony, reception, multi-day - it tunes the checklist.',
  },
  planningStage: {
    title: 'Say where you are in planning',
    subtitle: 'Early or final stretch changes what I nudge you about.',
  },
  styleTags: {
    title: 'Pick a style or two',
    subtitle: 'Helps inspiration and how the assistant talks about your day.',
  },
};

export function ProfileTips({ missing = [], onTipPress, style }) {
  const tips = useMemo(() => {
    return (missing ?? [])
      .map((item) => {
        const copy = TIP_COPY[item.key];
        if (!copy) return null;
        const sectionMeta = PROFILE_SECTION_META[item.section] ?? PROFILE_SECTION_META[PROFILE_SECTIONS.PERSONAL];
        return {
          id: item.key,
          section: item.section,
          icon: sectionMeta.icon,
          title: copy.title,
          subtitle: copy.subtitle,
        };
      })
      .filter(Boolean)
      .slice(0, 3);
  }, [missing]);

  if (tips.length === 0) {
    return (
      <Card tone="brand" style={style} testID="profile-tips-complete">
        <Stack gap="xs">
          <Text variant="eyebrow" color="brandSoftInk">
            Looking good
          </Text>
          <Text variant="bodyStrong" color="brandSoftInk">
            Your profile has what the plan needs.
          </Text>
          <Text variant="bodySm" color="brandSoftInk">
            You can still refine names, style and focus any time.
          </Text>
        </Stack>
      </Card>
    );
  }

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
