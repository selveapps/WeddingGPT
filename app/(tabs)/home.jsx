import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Icon,
  Button,
  Badge,
  ListRow,
  ProgressRing,
  ProgressBar,
  AnimatedNumber,
  SectionHeader,
  EmptyState,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  useWeddingStore,
  usePlanningStore,
  useBudgetStore,
  useGuestStore,
  selectWedding,
  selectAllTasks,
  selectAllExpenses,
  selectBudgetTotal,
  selectAllGuests,
} from '@/store';
import {
  calculateProgress,
  selectNextBestAction,
  selectUpcomingDeadlines,
  summariseBudget,
  summariseRsvps,
  coupleDisplayName,
  hasExactDate,
  TaskStatus,
} from '@/models';
import { daysUntil, formatLongDate, formatRelativeDay } from '@/lib/date';
import { formatMoneyCompact } from '@/lib/currency';

/**
 * Home dashboard.
 *
 * Answers "what should I do next?" above the fold, which PRD s.27 makes the
 * test every screen has to pass. Everything below the Next Best Action card is
 * reassurance: where the money is, who has replied, how far along the plan is.
 *
 * All figures are derived from the stores on render - there are no cached
 * counters to go stale, so a task completed on another screen is reflected here
 * the moment you come back.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { spacing, colors } = useTheme();

  const wedding = useWeddingStore(selectWedding);
  const tasks = usePlanningStore(selectAllTasks);
  const expenses = useBudgetStore(selectAllExpenses);
  const budgetTotal = useBudgetStore(selectBudgetTotal);
  const guests = useGuestStore(selectAllGuests);

  const progress = useMemo(() => calculateProgress(tasks), [tasks]);
  const nextAction = useMemo(() => selectNextBestAction(tasks), [tasks]);
  const budget = useMemo(() => summariseBudget(budgetTotal, expenses), [budgetTotal, expenses]);
  const rsvps = useMemo(() => summariseRsvps(guests), [guests]);
  const deadlines = useMemo(() => selectUpcomingDeadlines(tasks, 30).slice(0, 4), [tasks]);

  const days = wedding?.date ? daysUntil(wedding.date) : null;
  const exact = hasExactDate(wedding);

  if (!wedding) {
    return (
      <Screen bottomInset={spacing.xxl}>
        <EmptyState
          icon="rings"
          title="Let us set up your wedding"
          message="A few quick questions and we will build your plan, budget and checklist around them."
          actionLabel="Get started"
          onAction={() => router.push(Routes.onboarding)}
        />
      </Screen>
    );
  }

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="xl">
        {/* --- Greeting and countdown -------------------------------------- */}
        <Stack gap="xs">
          <Text variant="eyebrow" color="subtle">
            {greeting()}
          </Text>
          <Text variant="h1" heading>
            {coupleDisplayName(wedding)}
          </Text>
        </Stack>

        <Card tone="raised" onPress={() => router.push(Routes.countdown)}>
          <Stack gap="xs">
            <Text variant="eyebrow" color="accent">
              {exact ? 'Counting down' : 'Your horizon'}
            </Text>

            {days !== null ? (
              <Row gap="xs" align="baseline">
                <AnimatedNumber value={days} variant="displayMd" />
                <Text variant="h3" color="muted">
                  {days === 1 ? 'day to go' : 'days to go'}
                </Text>
              </Row>
            ) : (
              <Text variant="h2">Date still to come</Text>
            )}

            <Text variant="bodySm" color="muted">
              {wedding.date
                ? formatLongDate(wedding.date)
                : 'Set a date and we will build your timeline around it.'}
              {wedding.city ? ` · ${wedding.city}` : ''}
            </Text>
          </Stack>
        </Card>

        {/* --- Next best action -------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader eyebrow="Do this next" title="Your next step" />

          {nextAction ? (
            <Card
              tone="brand"
              onPress={() => router.push(Routes.taskDetail(nextAction.id))}
              accessibilityLabel={`Next step: ${nextAction.title}`}
            >
              <Row gap="sm">
                <Icon name="sparkle" size="xl" color={colors.brandSoftInk} />
                <Stack gap="hair" style={{ flex: 1 }}>
                  <Text variant="h3">{nextAction.title}</Text>
                  <Text variant="bodySm" color="muted">
                    {nextAction.dueDate
                      ? formatRelativeDay(nextAction.dueDate)
                      : 'No deadline yet'}
                  </Text>
                </Stack>
                <Icon name="chevronRight" color={colors.brandSoftInk} />
              </Row>
            </Card>
          ) : (
            <Card tone="muted">
              <Row gap="sm">
                <Icon name="check" size="xl" color="success" />
                <Stack gap="hair" style={{ flex: 1 }}>
                  <Text variant="h4">Nothing pressing</Text>
                  <Text variant="bodySm" color="muted">
                    You are clear for now. Add a task whenever something comes up.
                  </Text>
                </Stack>
              </Row>
            </Card>
          )}
        </Stack>

        {/* --- Upcoming deadlines ------------------------------------------ */}
        {deadlines.length > 0 ? (
          <Stack gap="sm">
            <SectionHeader
              eyebrow="Coming up"
              title="Next 30 days"
              actionLabel="All tasks"
              onActionPress={() => router.push(Routes.planning)}
            />

            <Card padding="none">
              {deadlines.map((task) => {
                const late = daysUntil(task.dueDate) < 0;
                return (
                  <ListRow
                    key={task.id}
                    icon="checklist"
                    title={task.title}
                    trailing={
                      late ? (
                        <Badge label={formatRelativeDay(task.dueDate)} tone="danger" />
                      ) : (
                        <Text variant="caption" color="muted">
                          {formatRelativeDay(task.dueDate)}
                        </Text>
                      )
                    }
                    onPress={() => router.push(Routes.taskDetail(task.id))}
                  />
                );
              })}
            </Card>
          </Stack>
        ) : null}

        {/* --- Planning progress ------------------------------------------- */}
        <Card onPress={() => router.push(Routes.planning)}>
          <Row gap="md">
            <ProgressRing value={progress} size={84}>
              <Text variant="h3">{Math.round(progress * 100)}%</Text>
            </ProgressRing>
            <Stack gap="xxs" style={{ flex: 1 }}>
              <Text variant="h4">Planning progress</Text>
              <Text variant="bodySm" color="muted">
                {tasks.filter((t) => t.status === TaskStatus.DONE).length} of {tasks.length}{' '}
                tasks done
              </Text>
            </Stack>
            <Icon name="chevronRight" color="inkSubtle" />
          </Row>
        </Card>

        {/* --- Budget snapshot --------------------------------------------- */}
        <Card onPress={() => router.push(Routes.budget)}>
          <Stack gap="sm">
            <Row justify="space-between">
              <Text variant="h4">Budget</Text>
              <Icon name="chevronRight" color="inkSubtle" />
            </Row>

            {budgetTotal > 0 ? (
              <>
                <Row justify="space-between" align="baseline">
                  <AnimatedNumber
                    value={budget.allocated}
                    variant="numeric"
                    format={(n) => formatMoneyCompact(n, wedding.currency)}
                  />
                  <Text variant="bodySm" color="muted">
                    of {formatMoneyCompact(budgetTotal, wedding.currency)}
                  </Text>
                </Row>
                <ProgressBar
                  segments={[
                    { key: 'spent', value: budget.spent / budgetTotal, color: 'brand' },
                    { key: 'committed', value: budget.committed / budgetTotal, color: 'accent' },
                  ]}
                />
                <Text
                  variant="caption"
                  color={budget.isOverBudget ? 'danger' : 'subtle'}
                >
                  {budget.isOverBudget
                    ? `${formatMoneyCompact(Math.abs(budget.remaining), wedding.currency)} over budget`
                    : `${formatMoneyCompact(budget.remaining, wedding.currency)} still free`}
                </Text>
              </>
            ) : (
              <Text variant="bodySm" color="muted">
                Set a total and we will suggest a starting split across categories.
              </Text>
            )}
          </Stack>
        </Card>

        {/* --- RSVP snapshot ----------------------------------------------- */}
        <Card onPress={() => router.push(Routes.guests)}>
          <Stack gap="sm">
            <Row justify="space-between">
              <Text variant="h4">Guests</Text>
              <Icon name="chevronRight" color="inkSubtle" />
            </Row>

            {rsvps.total > 0 ? (
              <>
                <Row gap="lg">
                  <Stack gap="hair">
                    <AnimatedNumber value={rsvps.attendingHeadcount} variant="numeric" />
                    <Text variant="caption" color="subtle">
                      attending
                    </Text>
                  </Stack>
                  <Stack gap="hair">
                    <AnimatedNumber value={rsvps.awaiting} variant="numeric" />
                    <Text variant="caption" color="subtle">
                      awaiting reply
                    </Text>
                  </Stack>
                  <Stack gap="hair">
                    <AnimatedNumber value={rsvps.declined} variant="numeric" />
                    <Text variant="caption" color="subtle">
                      declined
                    </Text>
                  </Stack>
                </Row>
                <ProgressBar value={rsvps.responseRate} tone="success" />
              </>
            ) : (
              <Text variant="bodySm" color="muted">
                Add your first households and we will track RSVPs from there.
              </Text>
            )}
          </Stack>
        </Card>

        {/* --- Assistant entry point --------------------------------------- */}
        <Card tone="accent" onPress={() => router.push(Routes.ai)}>
          <Row gap="sm">
            <Icon name="sparkle" size="xl" color={colors.accentSoftInk} />
            <Stack gap="hair" style={{ flex: 1 }}>
              <Text variant="h4">Ask WeddingGPT</Text>
              <Text variant="bodySm" color="muted">
                Timelines, etiquette, budgets, awkward messages - all of it.
              </Text>
            </Stack>
            <Icon name="chevronRight" color={colors.accentSoftInk} />
          </Row>
        </Card>

        {/* --- Quick actions ----------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader eyebrow="Quick actions" title="Add something" />
          <Row gap="xs">
            <Button
              label="Task"
              iconLeft="plus"
              variant="secondary"
              size="md"
              style={{ flex: 1 }}
              onPress={() => router.push(Routes.taskAdd)}
            />
            <Button
              label="Expense"
              iconLeft="plus"
              variant="secondary"
              size="md"
              style={{ flex: 1 }}
              onPress={() => router.push(Routes.expenseAdd)}
            />
            <Button
              label="Guest"
              iconLeft="plus"
              variant="secondary"
              size="md"
              style={{ flex: 1 }}
              onPress={() => router.push(Routes.guestAdd)}
            />
          </Row>
        </Stack>
      </Stack>
    </Screen>
  );
}

/** Time-of-day greeting. Small touch, but it is what makes it feel personal. */
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
