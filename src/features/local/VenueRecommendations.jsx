import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';

import {
  Stack,
  Row,
  Text,
  Card,
  Chip,
  Icon,
  Badge,
  ListRow,
  SectionHeader,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { recommendVenues } from '@/models';
import { openVenue, openVenueStyle } from './openLocalSearch';

const MAPS_ERROR = 'Could not open maps. Try again in a moment.';

/**
 * Famous wedding venues near the couple's city.
 *
 * `variant="carousel"` is the compact Home version: a swipeable row of venue
 * cards. `variant="list"` is the full Local picks version: every curated venue
 * plus searches by style. Cities without a curated list still get the style
 * searches, so nobody sees an empty section.
 */
export function VenueRecommendations({ city, variant = 'list', source = 'local', onSeeAll }) {
  const toast = useToast();
  const { venues, metro, styles } = useMemo(() => recommendVenues(city), [city]);

  if (!city?.trim()) return null;

  const open = async (venue) => {
    if (!(await openVenue(venue, source))) toast.error(MAPS_ERROR);
  };
  const openStyle = async (style) => {
    if (!(await openVenueStyle(style, city, source))) toast.error(MAPS_ERROR);
  };

  if (variant === 'carousel') {
    return (
      <Stack gap="sm">
        <SectionHeader
          eyebrow={`Near ${city}`}
          title={venues.length ? 'Famous venues' : 'Find your venue'}
          actionLabel={onSeeAll ? 'See all' : undefined}
          onActionPress={onSeeAll}
        />
        {venues.length ? (
          <EdgeToEdge snap>
            {venues.map((venue) => (
              <VenueCard key={venue.key} venue={venue} onPress={() => open(venue)} />
            ))}
          </EdgeToEdge>
        ) : (
          <StyleChips styles={styles} onPress={openStyle} />
        )}
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      {venues.length ? (
        <Stack gap="sm">
          <SectionHeader
            eyebrow={`Famous in ${metro?.name ?? city}`}
            title="Iconic venues"
            subtitle="Well-known places couples love. Check dates and pricing directly."
          />
          <Card padding="none">
            {venues.map((venue) => (
              <ListRow
                key={venue.key}
                icon="location"
                title={venue.name}
                subtitle={`${venue.style} · ${venue.area}\n${venue.blurb}`}
                subtitleLines={3}
                onPress={() => open(venue)}
                accessibilityHint="Opens this venue in maps"
              />
            ))}
          </Card>
        </Stack>
      ) : null}

      <Stack gap="sm">
        <SectionHeader
          eyebrow="Explore by style"
          title={venues.length ? 'More venues nearby' : `Venues near ${city}`}
          subtitle="Opens a map of real venues with photos, reviews and hours."
        />
        <StyleChips styles={styles} onPress={openStyle} wrap />
      </Stack>
    </Stack>
  );
}

/** A horizontal scroller that runs to the screen edges but starts in line with the page gutter. */
function EdgeToEdge({ children, snap = false }) {
  const { layout, spacing } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate={snap ? 'fast' : 'normal'}
      snapToInterval={snap ? CARD_WIDTH + spacing.sm : undefined}
      snapToAlignment="start"
      style={{ marginHorizontal: -layout.gutter }}
      contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: spacing.sm, paddingBottom: spacing.xxs }}
    >
      {children}
    </ScrollView>
  );
}

const CARD_WIDTH = 248;

function VenueCard({ venue, onPress }) {
  const { colors } = useTheme();
  return (
    <Card
      onPress={onPress}
      padding="lg"
      style={{ width: CARD_WIDTH }}
      accessibilityLabel={`${venue.name}, ${venue.area}. ${venue.blurb}`}
      accessibilityHint="Opens this venue in maps"
    >
      <Stack gap="sm" style={{ flex: 1 }}>
        <Badge label={venue.style} tone="brand" />
        <Stack gap="xxs">
          <Text variant="h4" numberOfLines={2}>
            {venue.name}
          </Text>
          <Text variant="caption" color="subtle" numberOfLines={1}>
            {venue.area}
          </Text>
        </Stack>
        <Text variant="bodySm" color="muted" numberOfLines={2} style={{ flex: 1 }}>
          {venue.blurb}
        </Text>
        <Row gap="xxs">
          <Text variant="actionSm" color="brand">
            View on map
          </Text>
          <Icon name="arrowRight" size="sm" color={colors.brand} />
        </Row>
      </Stack>
    </Card>
  );
}

function StyleChips({ styles, onPress, wrap = false }) {
  const chips = styles.map((style) => (
    <Chip key={style.key} label={style.label} icon={style.icon} onPress={() => onPress(style)} />
  ));

  if (wrap) {
    return (
      <Row gap="xs" wrap align="flex-start">
        {chips}
      </Row>
    );
  }
  return <EdgeToEdge>{chips}</EdgeToEdge>;
}

export default VenueRecommendations;
