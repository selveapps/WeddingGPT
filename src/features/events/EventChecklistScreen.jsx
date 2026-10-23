import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ListRow,
  Row,
  Screen,
  ScreenHeader,
  Stack,
  Text,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useEventStore, usePlanningStore, selectAllTasks, selectAllCategories } from '@/store';
import { buildEventTasks, eventChecklistFor, eventName } from '@/models';
import { formatMediumDate } from '@/lib/date';

/**
 * The suggested checklist for one event (slice C3): what a mehndi or a
 * rehearsal dinner usually needs, dated back from the event. Everything starts
 * ticked; the couple unticks what does not apply, and nothing is added until
 * they press Add.
 */
export function EventChecklistScreen({ eventId }) {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const event = useEventStore((state) => state.events.byId[eventId] ?? null);
  const tasks = usePlanningStore(selectAllTasks);
  const categories = usePlanningStore(selectAllCategories);

  // Computed once on open: ticking boxes should not reshuffle the list.
  const [entries] = useState(() => (event ? eventChecklistFor(event, tasks) : []));
  const offered = useMemo(() => entries.filter((entry) => !entry.added), [entries]);
  const [chosen, setChosen] = useState(() => new Set(offered.map((entry) => entry.key)));

  const toggle = (key) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (!event) {
    return (
      <Screen>
        <Stack gap="xl">
          <ScreenHeader eyebrow="Planning" title="Checklist" />
          <EmptyState
            icon="calendar"
            title="This event is gone"
            message="It may have been deleted on another device."
            actionLabel="Back to events"
            onAction={() => router.replace(Routes.events)}
          />
        </Stack>
      </Screen>
    );
  }

  const add = () => {
    const made = buildEventTasks({ event, keys: [...chosen], categories, tasks });
    usePlanningStore.getState().addTasks(made);
    toast.success(`${made.length} ${made.length === 1 ? 'task' : 'tasks'} added for ${eventName(event)}`);
    router.back();
  };

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        offered.length ? (
          <Stack gap="xs">
            <Button
              label={
                chosen.size
                  ? `Add ${chosen.size} ${chosen.size === 1 ? 'task' : 'tasks'}`
                  : 'Choose tasks to add'
              }
              disabled={!chosen.size}
              onPress={add}
            />
            <Button label="Not now" variant="ghost" onPress={() => router.back()} />
          </Stack>
        ) : null
      }
    >
      <Stack gap="lg">
        <ScreenHeader eyebrow={eventName(event)} title="Suggested tasks" />

        <Text variant="body" color="muted">
          {event.date
            ? `What a ${eventName(event).toLowerCase()} usually needs, dated back from ${formatMediumDate(event.date)}. Untick anything that does not apply.`
            : `What a ${eventName(event).toLowerCase()} usually needs. Give the event a date and these get due dates too.`}
        </Text>

        {entries.length === 0 ? (
          <EmptyState compact icon="checklist" title="No suggestions for this kind of event" />
        ) : (
          <Card padding="none">
            {entries.map((entry) => (
              <ListRow
                key={entry.key}
                title={entry.title}
                subtitle={entry.added ? 'Already on your checklist' : entry.description}
                leading={
                  entry.added ? null : (
                    <Checkbox
                      checked={chosen.has(entry.key)}
                      onChange={() => toggle(entry.key)}
                      round={false}
                    />
                  )
                }
                trailing={
                  entry.added ? (
                    <Badge label="Added" tone="success" />
                  ) : entry.dueDate ? (
                    <Text variant="caption" color="subtle">
                      {formatMediumDate(entry.dueDate)}
                    </Text>
                  ) : null
                }
                disabled={entry.added}
                showChevron={false}
                onPress={entry.added ? undefined : () => toggle(entry.key)}
              />
            ))}
          </Card>
        )}

        {offered.length === 0 && entries.length ? (
          <Row>
            <Button label="Back to the event" variant="secondary" onPress={() => router.back()} />
          </Row>
        ) : null}
      </Stack>
    </Screen>
  );
}

export default EventChecklistScreen;
