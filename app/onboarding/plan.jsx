import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Button,
  Badge,
  LoadingState,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  firstRecommendedActions,
  planningHorizonMonths,
  hasExactDate,
} from '@/models';
import { daysUntil, formatLongDate, formatMonthYear, formatRelativeDay } from '@/lib/date';
import { formatMoneyCompact } from '@/lib/currency';
import haptics from '@/lib/haptics';
import { Companion } from '@/features/onboarding/Companion';
import { buildWorkspace } from '@/features/onboarding/buildWorkspace';
import { VenueRecommendations } from '@/features/local/VenueRecommendations';

/**
 * The plan reveal - the payoff for answering.
 *
 * A payoff, not a report: the countdown, the headline numbers and the three
 * things to do first, all on screen at once - nothing counts up or staggers in.
 * The full plan is one tap away on the dashboard; this screen only has to make
 * it feel real.
 *
 * `buildWorkspace` is idempotent, so arriving here after the journey already
 * built everything only reads it back.
 */
export default function PlanScreen() {
  const router = useRouter();
  const { spacing } = useTheme();

  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    setWorkspace(buildWorkspace());
    haptics.success();
  }, []);

  const wedding = workspace?.wedding;
  const plan = workspace?.plan;
  const firstThree = useMemo(() => firstRecommendedActions(plan?.tasks ?? []), [plan]);

  if (!wedding) {
    return (
      <Screen>
        <Stack gap="lg" style={{ flex: 1, justifyContent: 'center' }}>
          <LoadingState message="Building your plan..." />
        </Stack>
      </Screen>
    );
  }

  const days = wedding.date ? daysUntil(wedding.date) : null;
  const exact = hasExactDate(wedding);
  const name = wedding.ownerName?.trim();

  const stats = [
    `${plan.tasks.length} tasks`,
    wedding.budgetTotal ? `${formatMoneyCompact(wedding.budgetTotal, wedding.currency)} budget` : null,
    wedding.guestCountEstimate ? `~${wedding.guestCountEstimate} guests` : null,
  ].filter(Boolean);

  return (
    <Screen
      bottomInset={spacing.xl}
      footer={
        <Button
          label="Open my dashboard"
          iconRight="arrowRight"
          onPress={() => router.replace(Routes.home)}
        />
      }
    >
      <Stack gap="xl">
        <Companion
          size="lg"
          mood="celebrate"
          message={name ? `${name}, your plan is ready!` : 'Your plan is ready!'}
        />

        {/* --- Countdown ----------------------------------------------------- */}
        <Card tone="brand">
          <Stack gap="xs" style={{ alignItems: 'center' }}>
            {days !== null ? (
              <Row gap="xs" align="baseline">
                <Text variant="displayMd">{days}</Text>
                <Text variant="h3" color="muted">
                  {days === 1 ? 'day to go' : 'days to go'}
                </Text>
              </Row>
            ) : (
              <Text variant="h2" align="center">
                About {planningHorizonMonths(wedding)} months to plan
              </Text>
            )}
            <Text variant="bodySm" color="muted" align="center">
              {wedding.date
                ? exact
                  ? formatLongDate(wedding.date)
                  : `Around ${formatMonthYear(wedding.date)}`
                : 'Add a date whenever you have one'}
            </Text>
            <Row gap="xs" wrap justify="center" style={{ marginTop: spacing.xs }}>
              {stats.map((label) => (
                <Badge key={label} label={label} tone="neutral" />
              ))}
            </Row>
          </Stack>
        </Card>

        {/* --- First three ---------------------------------------------------- */}
        <Stack gap="sm">
          <Text variant="eyebrow" color="accent">
            Start with these
          </Text>

          {firstThree.map((task, position) => (
            <Card key={task.id} tone="raised">
              <Row gap="sm">
                <Badge label={String(position + 1)} tone="brand" />
                <Stack gap="hair" style={{ flex: 1 }}>
                  <Text variant="h4">{task.title}</Text>
                  <Text variant="bodySm" color="muted">
                    {task.dueDate ? formatRelativeDay(task.dueDate) : 'Whenever suits'}
                  </Text>
                </Stack>
              </Row>
            </Card>
          ))}
        </Stack>

        {/* --- Venues near them ---------------------------------------------- */}
        {wedding.city ? <VenueRecommendations city={wedding.city} variant="carousel" source="plan" /> : null}
      </Stack>
    </Screen>
  );
}
