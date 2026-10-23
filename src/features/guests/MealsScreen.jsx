import React, { useMemo } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Screen,
  ScreenHeader,
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Button,
  ListRow,
  SectionHeader,
  EmptyState,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useGuestStore, useWeddingStore, selectAllGuests, selectWedding } from '@/store';
import {
  buildCateringReport,
  cateringCsv,
  cateringReportText,
  coupleDisplayName,
  guestFullName,
} from '@/models';
import { datedFilename, exportTextFile } from '@/services/files';
import { Routes } from '@/navigation/routes';

/**
 * Meals and dietary needs: the numbers the caterer asks for, from attending
 * guests' meal choices and notes (graduated from Labs). Allergy flags are a
 * keyword check - always confirm with the guest.
 */
export function MealsScreen() {
  const router = useRouter();
  const toast = useToast();
  const guests = useGuestStore(selectAllGuests);
  const wedding = useWeddingStore(selectWedding);
  const report = useMemo(() => buildCateringReport(guests), [guests]);

  const { spacing } = useTheme();

  const shareSummary = async () => {
    try {
      await Share.share({ message: cateringReportText(report, { title }), title: 'Catering numbers' });
    } catch {
      toast.error('Sharing is not available here');
    }
  };

  const exportCsv = async () => {
    const result = await exportTextFile({
      filename: datedFilename('catering'),
      text: cateringCsv(guests),
      title: 'Catering list',
    });
    if (result === 'downloaded') toast.success('Catering list downloaded');
    else if (result === 'failed') toast.error('Could not export the list');
  };

  const title = wedding ? coupleDisplayName(wedding) : 'Our wedding';

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <ScreenHeader eyebrow="Guests" title="Meals for the caterer" />
        <Text variant="bodySm" color="muted">
          From the meal choices and notes of attending guests. Allergy flags are a keyword check - always
          confirm with the guest.
        </Text>
        {report.headcount === 0 ? (
          <EmptyState
            icon="guests"
            title="No one is attending yet"
            message="Mark guests as attending in the Guests tab and their meals will show up here."
          />
        ) : (
          <>
            <Card tone="brand">
              <Row justify="space-between">
                <Stat label="Plates" value={report.headcount} />
                <Stat label="Adults" value={report.adults} />
                <Stat label="Children" value={report.children} />
                <Stat label="Plus ones" value={report.plusOnes} />
              </Row>
            </Card>

            <Stack gap="sm">
              <SectionHeader title="Meals" />
              <Card padding="none">
                {report.meals.map((meal) => (
                  <ListRow key={meal.key} title={meal.label} meta={String(meal.count)} showChevron={false} />
                ))}
              </Card>
            </Stack>

            {report.allergens.length ? (
              <Stack gap="sm">
                <SectionHeader title="Allergies to check" />
                {report.allergens.map((allergen) => (
                  <Card key={allergen.key} tone="danger">
                    <Stack gap="xxs">
                      <Row gap="xs">
                        <Badge label={allergen.label} tone="danger" />
                        <Text variant="caption" color="muted">
                          {`${allergen.guests.length} guest${allergen.guests.length === 1 ? '' : 's'}`}
                        </Text>
                      </Row>
                      <Text variant="bodySm">{allergen.guests.join(', ')}</Text>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            ) : null}

            {report.notes.length ? (
              <Stack gap="sm">
                <SectionHeader title="Dietary notes" />
                <Card padding="none">
                  {report.notes.map((note) => (
                    <ListRow
                      key={note.guestId}
                      title={note.name}
                      subtitle={note.note}
                      onPress={() => router.push(Routes.guestDetail(note.guestId))}
                    />
                  ))}
                </Card>
              </Stack>
            ) : null}

            {report.missingChoice.length ? (
              <Stack gap="sm">
                <SectionHeader
                  title={`No meal choice yet (${report.missingChoice.length})`}
                  subtitle="Tap a guest to set it."
                />
                <Card padding="none">
                  {report.missingChoice.slice(0, 30).map((guest) => (
                    <ListRow
                      key={guest.id}
                      title={guestFullName(guest) || 'Unnamed guest'}
                      onPress={() => router.push(Routes.guestDetail(guest.id))}
                    />
                  ))}
                </Card>
              </Stack>
            ) : null}

            <Stack gap="sm">
              <Button label="Send summary to caterer" iconLeft="send" onPress={shareSummary} />
              <Button label="Export as a spreadsheet (CSV)" variant="secondary" onPress={exportCsv} />
            </Stack>
          </>
        )}
      </Stack>
    </Screen>
  );
}

function Stat({ label, value }) {
  return (
    <Stack gap="hair">
      <Text variant="caption" color="muted">
        {label}
      </Text>
      <Text variant="bodyStrong">{String(value)}</Text>
    </Stack>
  );
}

export default MealsScreen;
