import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  ListRow,
  AnimatedNumber,
  ScreenHeader,
  SectionHeader,
  EmptyState,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useWeddingStore, usePlanningStore, selectWedding, selectAllTasks } from '@/store';
import {
  coupleDisplayName,
  hasExactDate,
  selectUpcomingDeadlines,
  planningHorizonMonths,
  CEREMONY_TYPE_META,
  PLANNING_STAGE_META,
} from '@/models';
import {
  daysUntil,
  breakDownDays,
  formatLongDate,
  formatMonthYear,
  formatRelativeDay,
} from '@/lib/date';

/**
 * Countdown detail (PRD s.6, "countdown detail").
 *
 * The same figure in days, weeks and months, because they answer different
 * questions. "Four months" is how you think about booking a vendor; "seventeen
 * weeks" is how you think about fittings; neither is obvious from a day count.
 */
export default function CountdownScreen() {
  const router = useRouter();
  const { spacing } = useTheme();

  const wedding = useWeddingStore(selectWedding);
  const tasks = usePlanningStore(selectAllTasks);

  const days = wedding?.date ? daysUntil(wedding.date) : null;
  const exact = hasExactDate(wedding);
  const parts = useMemo(() => breakDownDays(days ?? 0), [days]);

  const deadlines = useMemo(() => selectUpcomingDeadlines(tasks, 45).slice(0, 6), [tasks]);

  if (!wedding) {
    return (
      <Screen>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Home" title="Countdown" />
          <EmptyState
            icon="calendar"
            title="No wedding set up yet"
            message="Answer a few questions and the countdown starts from your own date."
            actionLabel="Set up my wedding"
            onAction={() => router.push(Routes.onboarding)}
          />
        </Stack>
      </Screen>
    );
  }

  const passed = days !== null && days < 0;

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <ScreenHeader eyebrow="Home" title="Countdown" />

        <Stack gap="xs">
          <Text variant="eyebrow" color="accent">
            {coupleDisplayName(wedding)}
          </Text>
          <Text variant="h1" heading>
            {passed
              ? 'Congratulations'
              : exact
                ? 'Counting down'
                : 'Roughly speaking'}
          </Text>
        </Stack>

        {/* --- The number --------------------------------------------------- */}
        <Card tone="brand">
          <Stack gap="md">
            {days !== null ? (
              <Row gap="xs" align="baseline">
                <AnimatedNumber value={Math.abs(days)} variant="displayLg" />
                <Text variant="h2" color="muted">
                  {passed
                    ? Math.abs(days) === 1
                      ? 'day ago'
                      : 'days ago'
                    : days === 1
                      ? 'day to go'
                      : 'days to go'}
                </Text>
              </Row>
            ) : (
              <Text variant="h2" heading>
                About {planningHorizonMonths(wedding)} months of planning
              </Text>
            )}

            <Text variant="body" color="muted">
              {wedding.date
                ? exact
                  ? formatLongDate(wedding.date)
                  : `Around ${formatMonthYear(wedding.date)} - we will sharpen this once you pin the day.`
                : 'No date yet. Your plan is paced by the stage you told us you are at.'}
            </Text>
          </Stack>
        </Card>

        {/* --- The same number, other units --------------------------------- */}
        {days !== null && !passed ? (
          <Row gap="xs">
            <Unit value={parts.weeks} label={parts.weeks === 1 ? 'week' : 'weeks'} />
            <Unit value={parts.months} label={parts.months === 1 ? 'month' : 'months'} />
          </Row>
        ) : null}

        {/* --- The facts ----------------------------------------------------- */}
        <Card padding="none">
          <ListRow
            icon="location"
            title="Where"
            showChevron={false}
            trailing={
              <Text variant="body" color={wedding.city ? 'muted' : 'subtle'}>
                {wedding.city || 'Not set'}
              </Text>
            }
          />
          <ListRow
            icon="rings"
            title="What kind"
            showChevron={false}
            trailing={
              <Text variant="body" color="muted">
                {CEREMONY_TYPE_META[wedding.ceremonyType]?.label ?? 'Still deciding'}
              </Text>
            }
          />
          <ListRow
            icon="checklist"
            title="Your stage"
            showChevron={false}
            trailing={
              <Text variant="body" color="muted">
                {PLANNING_STAGE_META[wedding.planningStage]?.label ?? 'Just engaged'}
              </Text>
            }
          />
          <ListRow
            icon="guests"
            title="Expected guests"
            showChevron={false}
            trailing={
              <Text variant="body" color={wedding.guestCountEstimate ? 'muted' : 'subtle'}>
                {wedding.guestCountEstimate ? `About ${wedding.guestCountEstimate}` : 'Not set'}
              </Text>
            }
          />
        </Card>

        {/* --- Upcoming deadlines -------------------------------------------- */}
        <Stack gap="xs">
          <SectionHeader
            eyebrow="Between now and then"
            title="Upcoming deadlines"
            actionLabel="All tasks"
            onActionPress={() => router.push(Routes.planning)}
          />

          {deadlines.length === 0 ? (
            <EmptyState
              compact
              icon="check"
              title="Nothing due in the next six weeks"
              message="Enjoy it. We will tell you when that changes."
            />
          ) : (
            <Card padding="none">
              {deadlines.map((task) => (
                <ListRow
                  key={task.id}
                  icon="checklist"
                  title={task.title}
                  trailing={
                    <Text
                      variant="caption"
                      color={daysUntil(task.dueDate) < 0 ? 'danger' : 'muted'}
                    >
                      {formatRelativeDay(task.dueDate)}
                    </Text>
                  }
                  onPress={() => router.push(Routes.taskDetail(task.id))}
                />
              ))}
            </Card>
          )}
        </Stack>
      </Stack>
    </Screen>
  );
}

/** One of the alternative units under the main countdown. */
function Unit({ value, label }) {
  return (
    <Card tone="muted" style={{ flex: 1 }}>
      <Stack gap="hair" align="center">
        <Text variant="numeric">{value}</Text>
        <Text variant="caption" color="subtle">
          {label}
        </Text>
      </Stack>
    </Card>
  );
}
