import React from 'react';
import { View } from 'react-native';

import { Card, Icon, Row, ScreenHeader, Stack, Text } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

export const PROFILE_FEATURE_CATEGORIES = [
  {
    id: 'wedding',
    title: 'Your wedding',
    subtitle: 'Details, countdown, budget and timeline.',
    icon: 'rings',
    features: [
      { id: 'details', title: 'Wedding profile', subtitle: 'Names, date, place and style.', icon: 'user' },
      {
        id: 'venueDetails',
        title: 'Venue details',
        subtitle: 'Venue contact, capacity and day-of logistics.',
        icon: 'location',
      },
      {
        id: 'countdown',
        title: 'Countdown',
        subtitle: 'Days to go and upcoming deadlines.',
        icon: 'calendar',
      },
      { id: 'budget', title: 'Budget snapshot', subtitle: 'Paid, committed and remaining.', icon: 'budget' },
      { id: 'timeline', title: 'Wedding timeline', subtitle: 'The day-of schedule.', icon: 'clock' },
      {
        id: 'dayChecklist',
        title: 'Wedding-day checklist',
        subtitle: 'Tasks, owners and progress for the day.',
        icon: 'checklist',
      },
    ],
  },
  {
    id: 'planning',
    title: 'Planning tools',
    subtitle: 'Keep paperwork, people and decisions organized.',
    icon: 'checklist',
    features: [
      { id: 'documents', title: 'Documents', subtitle: 'Contracts and review reminders.', icon: 'note' },
      { id: 'party', title: 'Wedding party', subtitle: 'People, roles and contact details.', icon: 'guests' },
      {
        id: 'contacts',
        title: 'Vendor contacts',
        subtitle: 'Email, call or visit a vendor website.',
        icon: 'vendors',
      },
      {
        id: 'decisions',
        title: 'Decision log',
        subtitle: 'Compare options and track choices.',
        icon: 'check',
      },
      {
        id: 'vision',
        title: 'Wedding vision',
        subtitle: 'Collect and organize inspiration.',
        icon: 'vision',
      },
    ],
  },
  {
    id: 'together',
    title: 'Together',
    subtitle: 'Shared goals, memories and relationship moments.',
    icon: 'heart',
    features: [
      {
        id: 'checkins',
        title: 'Couple check-ins',
        subtitle: 'Make space for planning conversations.',
        icon: 'heart',
      },
      {
        id: 'goals',
        title: 'Shared goals',
        subtitle: 'Track the things you want to do together.',
        icon: 'checklist',
      },
      {
        id: 'journal',
        title: 'Couple journal',
        subtitle: 'Save notes and moments along the way.',
        icon: 'note',
      },
      { id: 'keepsakes', title: 'Keepsakes', subtitle: 'Collect meaningful memories.', icon: 'star' },
      {
        id: 'milestones',
        title: 'Milestones',
        subtitle: 'Celebrate relationship and wedding dates.',
        icon: 'rings',
      },
      {
        id: 'sharing',
        title: 'Share summary',
        subtitle: 'Choose what to share about your wedding.',
        icon: 'send',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Preferences & settings',
    subtitle: 'Personalize your experience and manage your data.',
    icon: 'settings',
    features: [
      {
        id: 'preferences',
        title: 'Preferences',
        subtitle: 'Set planning and communication choices.',
        icon: 'settings',
      },
      { id: 'privacy', title: 'Privacy', subtitle: 'Choose which details stay private.', icon: 'lock' },
      {
        id: 'accountSettings',
        title: 'Account & device',
        subtitle: 'Account shortcuts and device reset.',
        icon: 'user',
      },
    ],
  },
  {
    id: 'more-planning',
    title: 'More wedding tools',
    subtitle: 'Guest experiences, details and plans for the celebration.',
    icon: 'checklist',
    features: [
      {
        id: 'guestRsvp',
        title: 'Guest RSVPs',
        subtitle: 'Track replies, party sizes and meal choices.',
        icon: 'guests',
      },
      {
        id: 'seating',
        title: 'Seating planner',
        subtitle: 'Keep table and seat assignments organized.',
        icon: 'guests',
      },
      {
        id: 'menu',
        title: 'Menu planner',
        subtitle: 'Plan courses and capture dietary needs.',
        icon: 'note',
      },
      {
        id: 'music',
        title: 'Music requests',
        subtitle: 'Collect must-play and do-not-play tracks.',
        icon: 'note',
      },
      {
        id: 'photoShotList',
        title: 'Photo shot list',
        subtitle: 'Prioritize the moments you want captured.',
        icon: 'vision',
      },
      {
        id: 'attire',
        title: 'Attire & fittings',
        subtitle: 'Track fittings, alterations and pickups.',
        icon: 'user',
      },
      {
        id: 'registry',
        title: 'Gift registry',
        subtitle: 'Organize registry items and thank-yous.',
        icon: 'star',
      },
      {
        id: 'honeymoon',
        title: 'Honeymoon planner',
        subtitle: 'Keep your trip itinerary and bookings together.',
        icon: 'calendar',
      },
      {
        id: 'transport',
        title: 'Guest transport',
        subtitle: 'Coordinate routes, providers and capacity.',
        icon: 'vendors',
      },
      {
        id: 'weddingFaq',
        title: 'Guest FAQ & copy',
        subtitle: 'Prepare clear answers for your guests.',
        icon: 'note',
      },
    ],
  },
];

export function ProfileFeatureHub({ categoryId, onSelectCategory, onSelectFeature, onBack }) {
  const { colors, radii, spacing } = useTheme();
  const category = PROFILE_FEATURE_CATEGORIES.find((item) => item.id === categoryId);
  const options = category
    ? category.features.map((feature) => ({ ...feature, testID: `profile-feature-${feature.id}` }))
    : PROFILE_FEATURE_CATEGORIES.map((item) => ({
        ...item,
        testID: `profile-category-${item.id}`,
      }));

  return (
    <Stack gap="md" testID="profile-feature-hub">
      {category ? (
        <ScreenHeader
          eyebrow="Profile tools"
          title={category.title}
          backLabel="Back to profile categories"
          onBack={onBack}
        />
      ) : null}
      <Row gap="sm" wrap align="stretch">
        {options.map((option) => (
          <Card
            key={option.id}
            tone="plain"
            padding="md"
            radius="lg"
            onPress={() => (category ? onSelectFeature(option.id) : onSelectCategory(option.id))}
            accessibilityLabel={`${option.title}. ${option.subtitle}`}
            accessibilityRole="button"
            style={{ flexGrow: 1, flexBasis: '45%', minHeight: 112 }}
            testID={option.testID}
          >
            <Stack gap="sm">
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: radii.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.brandSoft,
                }}
              >
                <Icon name={option.icon} size="sm" color="brandSoftInk" />
              </View>
              <Stack gap="xxs">
                <Text variant="bodyStrong" numberOfLines={1}>
                  {option.title}
                </Text>
                <Text
                  variant="caption"
                  color="muted"
                  numberOfLines={2}
                  style={{ marginBottom: spacing.hair }}
                >
                  {option.subtitle}
                </Text>
              </Stack>
            </Stack>
          </Card>
        ))}
      </Row>
    </Stack>
  );
}

export default ProfileFeatureHub;
