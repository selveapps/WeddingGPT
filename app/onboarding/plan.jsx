import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  LoadingState,
  SectionHeader,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  useWeddingStore,
  usePlanningStore,
  useBudgetStore,
  selectWedding,
  selectAllCategories,
} from '@/store';
import { analytics, AnalyticsEvents } from '@/services/analytics';
import {
  generatePersonalisedPlan,
  firstRecommendedActions,
  planningHorizonMonths,
  coupleDisplayName,
  hasExactDate,
  DEFAULT_TASK_CATEGORIES,
} from '@/models';
import { daysUntil, formatLongDate, formatMonthYear, formatRelativeDay } from '@/lib/date';
import { formatMoneyCompact } from '@/lib/currency';

/**
 * The value reveal (PRD s.4.4).
 *
 * This is the payoff for eleven questions, and the screen that has to earn the
 * paywall later: the couple should see a countdown, a real checklist, a budget
 * structure and a first move before they are asked for anything.
 *
 * Generation happens here rather than in `completeOnboarding` so the store stays
 * a store. It runs exactly once, guarded by a ref as well as by the persisted
 * `planGeneratedAt` - a double render or a fast back-and-forward must not seed
 * a second checklist on top of the first.
 */
export default function PlanScreen() {
  const router = useRouter();
  const { spacing, colors } = useTheme();

  const wedding = useWeddingStore(selectWedding);
  const planGeneratedAt = useWeddingStore((state) => state.planGeneratedAt);
  const markPlanGenerated = useWeddingStore((state) => state.markPlanGenerated);

  const seedCategories = usePlanningStore((state) => state.seedCategories);
  const addTasks = usePlanningStore((state) => state.addTasks);
  const categories = usePlanningStore(selectAllCategories);

  const initialiseBudget = useBudgetStore((state) => state.initialiseBudget);

  const generated = useRef(false);
  const [ready, setReady] = useState(Boolean(planGeneratedAt));
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (!wedding || generated.current) return;
    generated.current = true;

    // Categories must exist before tasks, so each task can carry a real
    // category id rather than being filed as loose.
    seedCategories(wedding.id);

    const seeded = usePlanningStore.getState();
    const seededCategories = DEFAULT_TASK_CATEGORIES.map((entry) =>
      Object.values(seeded.categories.byId).find((category) => category.key === entry.key)
    ).filter(Boolean);

    const result = generatePersonalisedPlan({ wedding, categories: seededCategories });

    // A re-entry (plan already generated, tasks already saved) still needs
    // something to render, but must not write anything.
    if (!planGeneratedAt) {
      addTasks(result.tasks);

      if (wedding.budgetTotal) {
        initialiseBudget({
          weddingId: wedding.id,
          total: wedding.budgetTotal,
          currency: wedding.currency,
        });
      }

      markPlanGenerated();
      analytics.track(AnalyticsEvents.PLAN_GENERATED, {
        taskCount: result.tasks.length,
        horizonMonths: result.horizonMonths,
        hasBudget: Boolean(wedding.budgetTotal),
      });
    }

    setPlan(result);
    setReady(true);
  }, [
    wedding,
    planGeneratedAt,
    seedCategories,
    addTasks,
    initialiseBudget,
    markPlanGenerated,
  ]);

  const days = wedding?.date ? daysUntil(wedding.date) : null;
  const exact = hasExactDate(wedding);
  const horizon = useMemo(
    () => (wedding ? planningHorizonMonths(wedding) : 0),
    [wedding]
  );
  const firstThree = useMemo(
    () => firstRecommendedActions(plan?.tasks ?? []),
    [plan]
  );

  if (!wedding || !ready) {
    return (
      <Screen>
        <Stack gap="lg" style={{ flex: 1, justifyContent: 'center' }}>
          <LoadingState message="Building your plan..." />
        </Stack>
      </Screen>
    );
  }

  const guestTarget = wedding.guestCountEstimate;

  return (
    <Screen
      bottomInset={spacing.xl}
      footer={
        <Button
          label="Open my workspace"
          iconRight="arrowRight"
          onPress={() => router.replace(Routes.home)}
        />
      }
    >
      <Stack gap="xl">
        {/* --- The welcome ------------------------------------------------- */}
        <Stack gap="sm">
          <Icon name="sparkle" size={44} color="brand" />
          <Text variant="displaySm" heading>
            {coupleDisplayName(wedding)}
          </Text>
          <Text variant="bodyLg" color="muted">
            {personalWelcome(wedding, days, horizon)}
          </Text>
        </Stack>

        {/* --- Countdown --------------------------------------------------- */}
        <Card tone="brand">
          <Stack gap="xs">
            <Text variant="eyebrow" color="brandSoftInk">
              {exact ? 'Counting down' : 'Your horizon'}
            </Text>

            {days !== null ? (
              <Row gap="xs" align="baseline">
                <Text variant="displayMd" heading>
                  {days}
                </Text>
                <Text variant="h3" color="muted">
                  {days === 1 ? 'day' : 'days'}
                </Text>
              </Row>
            ) : (
              <Text variant="h2">About {horizon} months of planning</Text>
            )}

            <Text variant="bodySm" color="muted">
              {wedding.date
                ? exact
                  ? formatLongDate(wedding.date)
                  : `Around ${formatMonthYear(wedding.date)}`
                : 'No date yet - we have planned by stage instead.'}
              {wedding.city ? ` · ${wedding.city}` : ''}
            </Text>
          </Stack>
        </Card>

        {/* --- What we built ----------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader eyebrow="Ready for you" title="What we set up" />

          <Card>
            <Stack gap="md">
              <Row gap="sm">
                <Icon name="checklist" size="lg" color="brand" />
                <Stack gap="hair" style={{ flex: 1 }}>
                  <Text variant="h4">{plan?.tasks?.length ?? 0} tasks, already dated</Text>
                  <Text variant="bodySm" color="muted">
                    Spread across {categories.length} categories and paced to your day.
                  </Text>
                </Stack>
              </Row>

              {wedding.budgetTotal ? (
                <Row gap="sm">
                  <Icon name="budget" size="lg" color="brand" />
                  <Stack gap="hair" style={{ flex: 1 }}>
                    <Text variant="h4">
                      {formatMoneyCompact(wedding.budgetTotal, wedding.currency)} split up
                    </Text>
                    <Text variant="bodySm" color="muted">
                      A starting allocation across every category. Change any of it.
                    </Text>
                  </Stack>
                </Row>
              ) : null}

              <Row gap="sm">
                <Icon name="guests" size="lg" color="brand" />
                <Stack gap="hair" style={{ flex: 1 }}>
                  <Text variant="h4">
                    {guestTarget ? `Room for about ${guestTarget}` : 'Your guest list'}
                  </Text>
                  <Text variant="bodySm" color="muted">
                    Add the people you are certain about first. RSVPs track themselves
                    from there.
                  </Text>
                </Stack>
              </Row>
            </Stack>
          </Card>
        </Stack>

        {/* --- First three actions ----------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader
            eyebrow="Start here"
            title="Your first three steps"
            subtitle="Everything else can wait until these are done."
          />

          {firstThree.map((task, position) => (
            <Card key={task.id} tone="raised">
              <Row gap="sm">
                <Badge label={String(position + 1)} tone="brand" />
                <Stack gap="hair" style={{ flex: 1 }}>
                  <Text variant="h4">{task.title}</Text>
                  <Text variant="bodySm" color="muted">
                    {task.dueDate ? formatRelativeDay(task.dueDate) : 'No deadline yet'}
                  </Text>
                </Stack>
              </Row>
            </Card>
          ))}
        </Stack>

        {/* --- Assistant ---------------------------------------------------- */}
        <Card tone="accent">
          <Row gap="sm">
            <Icon name="sparkle" size="lg" color={colors.accentSoftInk} />
            <Text variant="bodySm" color="muted" style={{ flex: 1 }}>
              WeddingGPT already knows all of this. Ask it anything and it will answer
              in the context of your wedding, not a generic one.
            </Text>
          </Row>
        </Card>
      </Stack>
    </Screen>
  );
}

/**
 * A short personal note (PRD s.4.4), composed from what they told us.
 *
 * Written here rather than fetched: it has to be instant and it has to be
 * right, and there is nothing in it a language model would say better than a
 * few honest sentences keyed off the stressor they picked.
 */
function personalWelcome(wedding, days, horizon) {
  const stressor = wedding.stressors?.[0];

  const opening =
    days !== null && days > 0
      ? `You have ${days} days, and a plan that fits them.`
      : `You have about ${horizon} months of planning ahead, and a plan that fits it.`;

  const reassurance = {
    budget: 'We have split your budget so you can see where it goes before it goes.',
    family: 'The checklist keeps the decisions in order, so the conversations stay one at a time.',
    guests: 'Your guest list and RSVPs live together, so the number is never a guess.',
    time: 'You will only ever be shown the next thing, not all of it at once.',
    decisions: 'One decision at a time, in the order that actually matters.',
    vendors: 'Vendor tasks are dated from your day, so you contact people while they are still free.',
    logistics: 'The week-of list is already written. It will be waiting when you get there.',
    nothing: 'Nothing to fix yet, then. We will keep it that way for as long as we can.',
  }[stressor];

  return reassurance ? `${opening} ${reassurance}` : opening;
}
