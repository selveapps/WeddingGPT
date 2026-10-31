import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Icon,
  Button,
  ScreenHeader,
  SectionHeader,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useWeddingStore, usePlanningStore, selectWedding, selectAllTasks } from '@/store';
import { recommendLocalPicks } from '@/models';
import { Mascot } from '@/features/mascot/Mascot';
import { LocationField } from '@/features/local/LocationField';
import { LocalPickRow } from '@/features/local/LocalPickRow';
import { VenueRecommendations } from '@/features/local/VenueRecommendations';

/**
 * Local recommendations.
 *
 * There is no vendor directory behind the app yet, and inventing vendor names
 * would be worse than useless - so recommendations are about *what* to look
 * for and *when*, and the businesses themselves come from a map search near
 * the wedding city (real places, real reviews, real hours). The order is
 * personal: categories whose booking window is open given the wedding date
 * come first, and anything the plan already marks as booked drops to the end.
 *
 * The city can be typed or taken from the phone's location. It is saved to
 * the wedding, so the assistant and the dashboard pick it up too.
 */
export default function LocalScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing, colors } = useTheme();

  const wedding = useWeddingStore(selectWedding);
  const tasks = usePlanningStore(selectAllTasks);
  const updateWedding = useWeddingStore((state) => state.updateWedding);

  const [city, setCity] = useState(wedding?.city ?? '');
  const [showAll, setShowAll] = useState(false);
  const savedCity = wedding?.city?.trim() ?? '';
  const dirty = city.trim() !== savedCity;

  const picks = useMemo(
    () => recommendLocalPicks({ weddingDate: wedding?.date ?? null, tasks }),
    [wedding?.date, tasks]
  );
  const priority = picks.filter((pick) => pick.urgency === 'now' || pick.urgency === 'soon');
  const rest = picks.filter((pick) => !priority.includes(pick));

  const savePlace = (place) => {
    const next = (place?.label ?? city).trim();
    if (!wedding || !next || next === savedCity) return;
    updateWedding(
      place ? { city: next, region: place.region ?? '', country: place.country ?? '' } : { city: next }
    );
    toast.success(`Showing picks near ${next}`);
  };

  const askAssistant = () =>
    router.push(
      Routes.assistantNew(
        `We're getting married in ${savedCity}. What should we know about planning a wedding there - best months, typical costs, and what to book first?`
      )
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="xl">
          <ScreenHeader eyebrow="Home" title="Venues and vendors" />

          <Row gap="md">
            <Mascot size={72} mood={savedCity ? 'happy' : 'think'} />
            <Stack gap="xxs" style={{ flex: 1 }}>
              <Text variant="h2" heading>
                {savedCity ? `Near ${savedCity}` : 'Where is the wedding?'}
              </Text>
              <Text variant="bodySm" color="muted">
                {savedCity
                  ? 'Famous venues nearby, then the vendors to book first for your date.'
                  : 'Tell me where, and I will show you famous venues and what to book first.'}
              </Text>
            </Stack>
          </Row>

          <Stack gap="sm">
            <LocationField
              value={city}
              onChangeText={setCity}
              onLocate={savePlace}
              onSubmitEditing={() => savePlace()}
              autoFocus={!savedCity}
            />
            {dirty && city.trim() ? (
              <Button label={savedCity ? 'Update city' : 'Show local picks'} onPress={() => savePlace()} />
            ) : null}
          </Stack>

          {savedCity ? (
            <>
              <VenueRecommendations city={savedCity} />

              {priority.length > 0 ? (
                <Stack gap="sm">
                  <SectionHeader
                    eyebrow="Vendors"
                    title="Book these first"
                    subtitle="Tap one to see nearby options with reviews, photos and hours."
                  />
                  <Card padding="none">
                    {priority.map((pick) => (
                      <LocalPickRow key={pick.key} pick={pick} city={savedCity} />
                    ))}
                  </Card>
                </Stack>
              ) : null}

              <Card
                tone="accent"
                onPress={askAssistant}
                accessibilityLabel={`Ask WeddingGPT about weddings in ${savedCity}`}
              >
                <Row gap="sm">
                  <Icon name="sparkle" size="lg" color={colors.accentSoftInk} />
                  <Stack gap="hair" style={{ flex: 1 }}>
                    <Text variant="bodyStrong">Ask about {savedCity}</Text>
                    <Text variant="caption" color="muted">
                      Best months, typical costs and local customs.
                    </Text>
                  </Stack>
                  <Icon name="chevronRight" color={colors.accentSoftInk} />
                </Row>
              </Card>

              {rest.length > 0 ? (
                <Stack gap="sm">
                  <SectionHeader
                    eyebrow="Browse nearby"
                    title={priority.length > 0 ? 'Everything else' : 'Vendors'}
                    actionLabel={showAll ? 'Show less' : 'Show all'}
                    actionIcon={showAll ? 'chevronUp' : 'chevronDown'}
                    onActionPress={() => setShowAll((value) => !value)}
                  />
                  <Card padding="none">
                    {(showAll ? rest : rest.slice(0, 4)).map((pick) => (
                      <LocalPickRow key={pick.key} pick={pick} city={savedCity} />
                    ))}
                  </Card>
                </Stack>
              ) : null}
            </>
          ) : null}
        </Stack>
      </Screen>
    </KeyboardAvoidingView>
  );
}
