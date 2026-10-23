import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  Row,
  Screen,
  ScreenHeader,
  Stack,
  Text,
  Touchable,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  useEventStore,
  selectEvents,
  useGuestStore,
  selectAllGuests,
  usePlanningStore,
  selectAllTasks,
  useBudgetStore,
  selectAllExpenses,
} from '@/store';
import {
  EVENT_KIND_META,
  EVENT_LIMITS,
  GuestScope,
  eventGuestSummary,
  eventName,
  eventWhen,
  sortEvents,
} from '@/models';
import { formatMediumDate } from '@/lib/date';

/**
 * The wedding's events (slice C1): the mehndi on Friday, the ceremony and
 * reception on Saturday. Listed by date and time; events at the same time can
 * be put in order by hand, which is the only order a couple ever changes.
 */
export function EventsScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const events = useEventStore(selectEvents);
  const guests = useGuestStore(selectAllGuests);
  const tasks = usePlanningStore(selectAllTasks);
  const expenses = useBudgetStore(selectAllExpenses);
  const moveEvent = useEventStore((state) => state.moveEvent);

  const sorted = useMemo(() => sortEvents(events), [events]);
  const counts = useMemo(() => {
    const byEvent = new Map();
    const bump = (id, key) => {
      if (!id) return;
      const entry = byEvent.get(id) ?? { tasks: 0, expenses: 0 };
      entry[key] += 1;
      byEvent.set(id, entry);
    };
    tasks.forEach((task) => bump(task.eventId, 'tasks'));
    expenses.forEach((expense) => bump(expense.eventId, 'expenses'));
    return byEvent;
  }, [tasks, expenses]);

  // Only neighbours at the same date and time can swap; the rest sort themselves.
  const sameSlot = (a, b) => Boolean(a && b) && a.date === b.date && a.startTime === b.startTime;
  const full = sorted.length >= EVENT_LIMITS.perWedding;

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        sorted.length ? (
          <Button
            label={full ? 'Twenty events is the limit' : 'Add an event'}
            iconLeft="plus"
            disabled={full}
            onPress={() => router.push(Routes.eventAdd)}
          />
        ) : null
      }
    >
      <Stack gap="xl">
        <ScreenHeader eyebrow="Planning" title="Events" />

        {sorted.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="One day, or a few?"
            message="If your wedding is more than one event - a mehndi, a rehearsal dinner, a brunch the morning after - add each one with its own time, place and guest list. Tasks and costs can then belong to an event."
            actionLabel="Add an event"
            onAction={() => router.push(Routes.eventAdd)}
          />
        ) : (
          <Stack gap="sm">
            {sorted.map((event, index) => {
              const meta = EVENT_KIND_META[event.kind] ?? EVENT_KIND_META.other;
              const summary = eventGuestSummary(event, guests);
              const linked = counts.get(event.id);
              const when = [event.date ? formatMediumDate(event.date) : 'No date yet', eventWhen(event)]
                .filter(Boolean)
                .join(' · ');
              const canUp = sameSlot(sorted[index - 1], event);
              const canDown = sameSlot(event, sorted[index + 1]);
              return (
                <Card
                  key={event.id}
                  onPress={() => router.push(Routes.eventDetail(event.id))}
                  accessibilityLabel={`Edit ${eventName(event)}`}
                >
                  <Row gap="sm" align="flex-start">
                    <Icon name={meta.icon} size="lg" color="brand" />
                    <Stack gap="xxs" style={{ flex: 1 }}>
                      <Text variant="h4">{eventName(event)}</Text>
                      <Text variant="bodySm" color="muted">
                        {when}
                      </Text>
                      {event.venueName ? (
                        <Text variant="bodySm" color="muted">
                          {event.venueName}
                        </Text>
                      ) : null}
                      <Row gap="xs" wrap align="flex-start">
                        <Badge
                          label={
                            event.guestScope === GuestScope.INVITED
                              ? `${summary.invited} invited`
                              : 'Everyone invited'
                          }
                        />
                        {summary.attending ? (
                          <Badge label={`${summary.attending} attending`} tone="success" />
                        ) : null}
                        {linked?.tasks ? (
                          <Badge label={`${linked.tasks} ${linked.tasks === 1 ? 'task' : 'tasks'}`} />
                        ) : null}
                        {linked?.expenses ? (
                          <Badge label={`${linked.expenses} ${linked.expenses === 1 ? 'cost' : 'costs'}`} />
                        ) : null}
                      </Row>
                    </Stack>
                    {canUp || canDown ? (
                      <Stack gap="xxs">
                        {canUp ? (
                          <Touchable
                            onPress={() => moveEvent(event.id, -1)}
                            accessibilityLabel={`Move ${eventName(event)} up`}
                          >
                            <Icon name="chevronUp" size="md" color="muted" />
                          </Touchable>
                        ) : null}
                        {canDown ? (
                          <Touchable
                            onPress={() => moveEvent(event.id, 1)}
                            accessibilityLabel={`Move ${eventName(event)} down`}
                          >
                            <Icon name="chevronDown" size="md" color="muted" />
                          </Touchable>
                        ) : null}
                      </Stack>
                    ) : null}
                  </Row>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Screen>
  );
}

export default EventsScreen;
