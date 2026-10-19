import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Icon,
  Touchable,
  AnimatedNumber,
  LoadingState,
  ListRow,
  Button,
  SectionHeader,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  useWeddingStore,
  usePlanningStore,
  useBudgetStore,
  useGuestStore,
  useNotificationStore,
  selectWedding,
  selectCouple,
  selectAllTasks,
  selectAllExpenses,
  selectBudgetTotal,
  selectAllGuests,
  selectNotificationPromptDismissed,
} from '@/store';
import {
  calculateProgress,
  summariseBudget,
  summariseRsvps,
  coupleDisplayName,
  hasExactDate,
  recommendLocalPicks,
} from '@/models';
import { daysUntil, formatLongDate } from '@/lib/date';
import { formatMoneyCompact } from '@/lib/currency';
import { buildWorkspace } from '@/features/onboarding/buildWorkspace';
import { DateSheet } from '@/features/home/DateSheet';
import { InviteSheet } from '@/features/home/InviteSheet';
import { Mascot } from '@/features/mascot/Mascot';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { LocalPickRow } from '@/features/local/LocalPickRow';
import { VenueRecommendations } from '@/features/local/VenueRecommendations';
import { DailyChecklistCard } from '@/features/daily/DailyChecklistCard';
import { useNotificationPermission } from '@/features/notifications/useNotificationPermission';

/**
 * Home dashboard.
 *
 * Answers "what should I do next?" above the fold, which PRD s.27 makes the
 * test every screen has to pass. The screen is kept deliberately quiet: the
 * countdown, one next step, a single at-a-glance strip (plan, budget, guests),
 * a way to invite a partner and find local vendors, and a gentle way into the
 * assistant. Cards are simply there on first paint - nothing staggers, slides
 * or bounces in. Full lists live on their own tabs - the dashboard points at
 * them rather than repeating them.
 *
 * All figures are derived from the stores on render - there are no cached
 * counters to go stale, so a task completed on another screen is reflected here
 * the moment you come back.
 *
 * There is always a dashboard. A couple who skipped onboarding (or arrived by
 * deep link before it ran) gets one built from whatever they told us, and
 * anything missing - the date, the budget, the guests - is a soft invitation to
 * add it rather than a screen that blocks them until they do.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { spacing, colors } = useTheme();
  const toast = useToast();

  const wedding = useWeddingStore(selectWedding);
  const couple = useWeddingStore(selectCouple);
  const tasks = usePlanningStore(selectAllTasks);
  const expenses = useBudgetStore(selectAllExpenses);
  const budgetTotal = useBudgetStore(selectBudgetTotal);
  const guests = useGuestStore(selectAllGuests);
  const updateWedding = useWeddingStore((state) => state.updateWedding);
  const updateCouple = useWeddingStore((state) => state.updateCouple);
  const promptDismissed = useNotificationStore(selectNotificationPromptDismissed);
  const dismissPrompt = useNotificationStore((state) => state.dismissPrompt);
  const reminders = useNotificationPermission();

  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!wedding) buildWorkspace();
  }, [wedding]);

  const progress = useMemo(() => calculateProgress(tasks), [tasks]);
  const budget = useMemo(() => summariseBudget(budgetTotal, expenses), [budgetTotal, expenses]);
  const rsvps = useMemo(() => summariseRsvps(guests), [guests]);
  const localPicks = useMemo(
    () =>
      recommendLocalPicks({ weddingDate: wedding?.date ?? null, tasks })
        .filter((pick) => pick.urgency !== 'booked')
        .slice(0, 3),
    [wedding?.date, tasks]
  );

  const days = wedding?.date ? daysUntil(wedding.date) : null;
  const exact = hasExactDate(wedding);

  if (!wedding) {
    return (
      <Screen bottomInset={spacing.xxl}>
        <Stack style={{ flex: 1, justifyContent: 'center' }}>
          <LoadingState message="Setting up your dashboard..." />
        </Stack>
      </Screen>
    );
  }

  const hasBudget = budgetTotal > 0;
  const hasGuests = rsvps.total > 0;

  const partnerName = wedding.partnerName?.trim() || couple?.partnerName?.trim() || '';
  const invited = Boolean(couple?.partnerInviteSentAt);
  const city = wedding.city?.trim() ?? '';
  const showReminderPrompt = reminders.supported && !reminders.granted && !promptDismissed;

  const turnOnReminders = async () => {
    const ok = await reminders.enable();
    if (ok) toast.success("Reminders on. I'll nudge you before things are due.");
  };

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="xl">
        {/* --- Greeting ---------------------------------------------------- */}
        <Row gap="sm">
          <Mascot size={52} mood={progress >= 1 ? 'celebrate' : 'happy'} />
          <Stack gap="xxs" style={{ flex: 1 }}>
            <Text variant="accent" color="muted">
              {greeting()}
            </Text>
            <Text variant="h1" heading numberOfLines={2}>
              {capitalise(coupleDisplayName(wedding))}
            </Text>
          </Stack>
          <NotificationBell />
        </Row>

        {/* --- Reminders prompt -------------------------------------------- */}
        {showReminderPrompt ? (
          <Card tone="accent">
            <Stack gap="sm">
              <Row gap="sm">
                <Mascot size={44} mood="wave" still />
                <Stack gap="hair" style={{ flex: 1 }}>
                  <Text variant="bodyStrong">Want a daily nudge?</Text>
                  <Text variant="caption" color="muted">
                    A short checklist each morning, plus deadlines and payments. Never spammy.
                  </Text>
                </Stack>
              </Row>
              <Row gap="xs">
                <Button
                  label="Turn on reminders"
                  size="sm"
                  iconLeft="bell"
                  fullWidth={false}
                  onPress={turnOnReminders}
                />
                <Button label="Not now" size="sm" variant="ghost" fullWidth={false} onPress={dismissPrompt} />
              </Row>
            </Stack>
          </Card>
        ) : null}

        {/* --- Countdown --------------------------------------------------- */}
        <Card
          tone="brand"
          padding="lg"
          radius="xl"
          onPress={() => (wedding.date ? router.push(Routes.countdown) : setDateSheetOpen(true))}
          accessibilityHint={wedding.date ? 'Opens the countdown' : 'Set your wedding date'}
        >
          {days !== null ? (
            <Stack gap="xxs">
              <Row gap="xs" align="baseline">
                <AnimatedNumber value={days} variant="displayMd" color="brandSoftInk" />
                <Text variant="accentLg" color="brandSoftInk">
                  {days === 1 ? 'day to go' : 'days to go'}
                </Text>
              </Row>
              <Text variant="bodySm" color="muted">
                {exact ? formatLongDate(wedding.date) : `Around ${formatLongDate(wedding.date)}`}
                {wedding.city ? ` · ${wedding.city}` : ''}
              </Text>
            </Stack>
          ) : (
            <Row gap="sm">
              <Icon name="heart" size="lg" color="brand" />
              <Stack gap="hair" style={{ flex: 1 }}>
                <Text variant="h4">Add your wedding date</Text>
                <Text variant="bodySm" color="muted">
                  Even a rough month starts the countdown.
                </Text>
              </Stack>
              <Icon name="chevronRight" color={colors.brandSoftInk} />
            </Row>
          )}
        </Card>

        {/* --- Today's checklist ------------------------------------------ */}
        <DailyChecklistCard />

        {/* --- At a glance ------------------------------------------------- */}
        <Stack gap="sm">
          <Text variant="labelStrong" color="muted">
            At a glance
          </Text>
          <Card padding="none">
            <Row gap="none" align="stretch">
              <Glance
                icon="checklist"
                tint="brand"
                value={`${Math.round(progress * 100)}%`}
                label="planned"
                onPress={() => router.push(Routes.planning)}
              />
              <GlanceDivider />
              <Glance
                icon="budget"
                tint="accent"
                value={
                  hasBudget ? formatMoneyCompact(Math.abs(budget.remaining), wedding.currency) : null
                }
                label={hasBudget ? (budget.isOverBudget ? 'over budget' : 'left') : 'Set budget'}
                labelColor={hasBudget && budget.isOverBudget ? 'danger' : undefined}
                onPress={() => router.push(Routes.budget)}
              />
              <GlanceDivider />
              <Glance
                icon="guests"
                tint="success"
                value={hasGuests ? String(rsvps.attendingHeadcount) : null}
                label={hasGuests ? 'coming' : 'Add guests'}
                onPress={() => router.push(Routes.guests)}
              />
            </Row>
          </Card>
        </Stack>

        {/* --- Famous venues nearby ---------------------------------------- */}
        {city ? (
          <VenueRecommendations
            city={city}
            variant="carousel"
            source="home"
            onSeeAll={() => router.push(Routes.local)}
          />
        ) : null}

        {/* --- Local picks ------------------------------------------------- */}
        {city ? (
          <Stack gap="sm">
            <SectionHeader
              eyebrow="Vendors to book next"
              title="Local picks for you"
              actionLabel="See all"
              onActionPress={() => router.push(Routes.local)}
            />
            <Card padding="none">
              {localPicks.map((pick) => (
                <LocalPickRow key={pick.key} pick={pick} city={city} source="home" />
              ))}
            </Card>
          </Stack>
        ) : null}

        {/* --- Together and nearby ----------------------------------------- */}
        <Card padding="none">
          <ListRow
            icon="userPlus"
            title={invited ? `Invited ${partnerName || 'your partner'}` : 'Invite your partner'}
            subtitle={invited ? 'Send the invite again' : 'Plan the wedding together'}
            onPress={() => setInviteOpen(true)}
          />
          {city ? null : (
            <ListRow
              icon="location"
              title="Find venues near you"
              subtitle="Add your city for famous venues and local vendors"
              onPress={() => router.push(Routes.local)}
            />
          )}
        </Card>

        {/* --- Assistant --------------------------------------------------- */}
        <Card tone="accent" onPress={() => router.push(Routes.ai)}>
          <Row gap="sm">
            <Icon name="sparkle" size="lg" color={colors.accentSoftInk} />
            <Stack gap="hair" style={{ flex: 1 }}>
              <Text variant="bodyStrong">Need a hand?</Text>
              <Text variant="caption" color="muted">
                Ask WeddingGPT anything, big or small.
              </Text>
            </Stack>
            <Icon name="chevronRight" color={colors.accentSoftInk} />
          </Row>
        </Card>
      </Stack>

      <DateSheet
        visible={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        wedding={wedding}
        onSave={(patch) => {
          updateWedding(patch);
          setDateSheetOpen(false);
          toast.success(patch.date ? 'Countdown started!' : 'Saved. Add it whenever you know.');
        }}
      />

      <InviteSheet
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        ownerName={wedding.ownerName}
        partnerName={partnerName}
        onSent={({ partnerName: name }) => {
          const sentAt = new Date().toISOString();
          updateCouple(name ? { partnerName: name, partnerInviteSentAt: sentAt } : { partnerInviteSentAt: sentAt });
          // The greeting reads "Sam and Alex" once we know the partner's name.
          if (name) updateWedding({ partnerName: name });
          setInviteOpen(false);
          toast.success(name ? `Invite sent to ${name}` : 'Invite sent');
        }}
      />
    </Screen>
  );
}

/**
 * One column of the at-a-glance strip: a soft tinted icon, one figure, one word.
 * With no figure yet, the label doubles as the invitation ("Set budget").
 */
function Glance({ icon, tint, value, label, labelColor, onPress }) {
  const { colors, spacing } = useTheme();
  return (
    <Touchable
      onPress={onPress}
      scaleOnPress={false}
      accessibilityRole="button"
      accessibilityLabel={value ? `${value} ${label}` : label}
      style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors[`${tint}Soft`],
        }}
      >
        <Icon name={icon} size="sm" color={colors[`${tint}SoftInk`]} />
      </View>
      {value ? (
        <Text variant="h4" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <Text variant="caption" color={labelColor ?? (value ? 'muted' : 'brand')} numberOfLines={1}>
        {label}
      </Text>
    </Touchable>
  );
}

function GlanceDivider() {
  const { colors, spacing } = useTheme();
  return <View style={{ width: 1, marginVertical: spacing.md, backgroundColor: colors.border }} />;
}

/** "your wedding" -> "Your wedding" for the heading; names are left as typed. */
function capitalise(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** Time-of-day greeting. Small touch, but it is what makes it feel personal. */
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
