import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Chip,
  Button,
  Icon,
  Touchable,
  ProgressBar,
  EmptyState,
  BottomSheet,
  ListRow,
  useToast,
  PageHeader,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  usePlanningStore,
  useWeddingStore,
  selectAllTasks,
  selectAllCategories,
  selectWedding,
  useEventStore,
  selectEvents,
} from '@/store';
import { analytics, AnalyticsEvents } from '@/services/analytics';
import {
  TaskStatus,
  calculateProgress,
  isTaskOverdue,
  isTaskOpen,
  isSnoozeActive,
  eventName,
  sortEvents,
  openPrerequisites,
} from '@/models';
import { daysUntil } from '@/lib/date';
import { TaskRow } from '@/features/planning/TaskRow';
import { NotificationBell } from '@/features/notifications/NotificationBell';

/**
 * Planning tab - the checklist (PRD s.7).
 *
 * Grouped by time rather than by category by default. A couple does not open
 * this screen asking "what is left under Vendors", they open it asking "what do
 * I need to do now" - so the first group is always what is late or imminent,
 * and categories are a filter rather than the structure.
 */

const FILTERS = [
  { key: 'open', label: 'To do' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'soon', label: 'Next 30 days' },
  { key: 'done', label: 'Done' },
  { key: 'all', label: 'Everything' },
];

const SORTS = [
  { key: 'due', label: 'By due date', icon: 'calendar' },
  { key: 'priority', label: 'By priority', icon: 'alert' },
  { key: 'title', label: 'Alphabetically', icon: 'sort' },
];

/** Time buckets, in the order they are shown. */
const GROUPS = [
  { key: 'overdue', title: 'Overdue', tone: 'danger' },
  { key: 'week', title: 'This week' },
  { key: 'month', title: 'This month' },
  { key: 'later', title: 'Later' },
  { key: 'someday', title: 'No date yet' },
  { key: 'snoozed', title: 'Snoozed' },
  { key: 'done', title: 'Done' },
];

function bucketFor(task) {
  if (task.status === TaskStatus.DONE) return 'done';
  if (isSnoozeActive(task)) return 'snoozed';
  if (!task.dueDate) return 'someday';
  if (isTaskOverdue(task)) return 'overdue';

  const days = daysUntil(task.dueDate);
  if (days <= 7) return 'week';
  if (days <= 31) return 'month';
  return 'later';
}

export default function PlanningScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const toast = useToast();

  const tasks = usePlanningStore(selectAllTasks);
  const categories = usePlanningStore(selectAllCategories);
  const toggleTask = usePlanningStore((state) => state.toggleTask);
  const wedding = useWeddingStore(selectWedding);
  const events = useEventStore(selectEvents);
  const sortedEvents = useMemo(() => sortEvents(events), [events]);

  const [filter, setFilter] = useState('open');
  const [categoryId, setCategoryId] = useState(null);
  const [eventId, setEventId] = useState(null);
  // A filter on an event deleted elsewhere falls back to all events.
  const activeEventId = sortedEvents.some((event) => event.id === eventId) ? eventId : null;
  const [sort, setSort] = useState('due');
  const [sortOpen, setSortOpen] = useState(false);

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  const tasksById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);

  const progress = useMemo(() => calculateProgress(tasks), [tasks]);
  const openCount = useMemo(() => tasks.filter(isTaskOpen).length, [tasks]);
  const overdueCount = useMemo(() => tasks.filter((t) => isTaskOverdue(t)).length, [tasks]);

  const visible = useMemo(() => {
    let list = tasks;

    if (categoryId) list = list.filter((task) => task.categoryId === categoryId);
    if (activeEventId) list = list.filter((task) => task.eventId === activeEventId);

    switch (filter) {
      case 'overdue':
        list = list.filter((task) => isTaskOverdue(task));
        break;
      case 'soon':
        list = list.filter(
          (task) => isTaskOpen(task) && task.dueDate && daysUntil(task.dueDate) <= 30
        );
        break;
      case 'done':
        list = list.filter((task) => task.status === TaskStatus.DONE);
        break;
      case 'all':
        break;
      case 'open':
      default:
        list = list.filter(isTaskOpen);
    }

    const byDue = (a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
    };

    const rank = { high: 0, normal: 1, low: 2 };
    const comparator =
      sort === 'priority'
        ? (a, b) => (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1) || byDue(a, b)
        : sort === 'title'
          ? (a, b) => a.title.localeCompare(b.title)
          : byDue;

    return [...list].sort(comparator);
  }, [tasks, filter, categoryId, activeEventId, sort]);

  const grouped = useMemo(() => {
    const buckets = new Map(GROUPS.map((group) => [group.key, []]));
    for (const task of visible) buckets.get(bucketFor(task))?.push(task);
    return GROUPS.map((group) => ({ ...group, tasks: buckets.get(group.key) ?? [] })).filter(
      (group) => group.tasks.length > 0
    );
  }, [visible]);

  const handleToggle = (task) => {
    const updated = toggleTask(task.id);
    if (updated?.status === TaskStatus.DONE) {
      // Undo matters here: the checkbox is small and the list moves underneath
      // it as the task jumps to the Done group.
      toast.success(`${task.title} - done`, {
        actionLabel: 'Undo',
        onAction: () => toggleTask(task.id),
      });
    }
  };

  const handleFilter = (key) => {
    setFilter(key);
    analytics.track(AnalyticsEvents.TASKS_FILTERED, { filter: key, categoryId });
  };

  // --- Empty: no plan has been generated yet -------------------------------
  if (tasks.length === 0) {
    return (
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="xl">
          <Header overdueCount={0} />
          <EmptyState
            icon="checklist"
            title="No tasks yet"
            message={
              wedding
                ? 'Add your first task, or let us rebuild a checklist shaped around your date.'
                : 'Finish setting up your wedding and we will build a checklist shaped around your date and your stage.'
            }
            actionLabel={wedding ? 'Add a task' : 'Set up my wedding'}
            onAction={() => router.push(wedding ? Routes.taskAdd : Routes.onboarding)}
          />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        <Button label="Add a task" iconLeft="plus" onPress={() => router.push(Routes.taskAdd)} />
      }
    >
      <Stack gap="xl">
        <Header overdueCount={overdueCount} onSortPress={() => setSortOpen(true)} />

        {/* --- Progress ---------------------------------------------------- */}
        <Card tone="muted" onPress={() => router.push(Routes.progress)}>
          <Stack gap="xs">
            <Row justify="space-between" align="baseline">
              <Text variant="h4">{Math.round(progress * 100)}% done</Text>
              <Text variant="bodySm" color="muted">
                {openCount} still to do
              </Text>
            </Row>
            <ProgressBar value={progress} />
          </Stack>
        </Card>

        <Card padding="none">
          <ListRow
            icon="calendar"
            title="Events"
            subtitle={
              sortedEvents.length
                ? sortedEvents.map(eventName).join(', ')
                : 'More than one day? Add the mehndi, the brunch, the rest.'
            }
            subtitleLines={1}
            onPress={() => router.push(Routes.events)}
          />
          <ListRow
            icon="clock"
            title="Run of show"
            subtitle="What happens when on the day, minute by minute"
            subtitleLines={1}
            onPress={() => router.push(Routes.runOfShow())}
          />
          <ListRow
            icon="checklist"
            title="Packing lists"
            subtitle="Emergency kit, getting-ready bag, the venue box, the honeymoon"
            subtitleLines={1}
            onPress={() => router.push(Routes.packing)}
          />
          <ListRow
            icon="vision"
            title="Your style"
            subtitle="A five-tap style quiz, your palette, and a brief for vendors"
            subtitleLines={1}
            onPress={() => router.push(Routes.style)}
          />
        </Card>

        {/* --- Filters ----------------------------------------------------- */}
        <Stack gap="xs">
          <Row gap="xs" wrap align="flex-start">
            {FILTERS.map((entry) => (
              <Chip
                key={entry.key}
                label={entry.label}
                selected={filter === entry.key}
                onPress={() => handleFilter(entry.key)}
              />
            ))}
          </Row>

          <Row gap="xs" wrap align="flex-start">
            <Chip
              label="All categories"
              selected={categoryId === null}
              onPress={() => setCategoryId(null)}
              size="sm"
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                size="sm"
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </Row>

          {sortedEvents.length ? (
            <Row gap="xs" wrap align="flex-start">
              <Chip
                label="All events"
                selected={activeEventId === null}
                onPress={() => setEventId(null)}
                size="sm"
              />
              {sortedEvents.map((event) => (
                <Chip
                  key={event.id}
                  label={eventName(event)}
                  size="sm"
                  selected={activeEventId === event.id}
                  onPress={() => setEventId(event.id)}
                />
              ))}
            </Row>
          ) : null}
        </Stack>

        {/* --- The list ---------------------------------------------------- */}
        {visible.length === 0 ? (
          <EmptyState
            compact
            icon="check"
            title="Nothing here"
            message="No tasks match this filter. That is usually good news."
            actionLabel="Show everything"
            onAction={() => {
              setFilter('all');
              setCategoryId(null);
              setEventId(null);
            }}
          />
        ) : (
          <Stack gap="lg">
            {grouped.map((group) => (
              <Stack key={group.key} gap="none">
                <Row justify="space-between" align="baseline">
                  <Text variant="eyebrow" color={group.tone ?? 'subtle'}>
                    {group.title}
                  </Text>
                  <Text variant="caption" color="subtle">
                    {group.tasks.length}
                  </Text>
                </Row>

                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    categoryName={categoryNameById.get(task.categoryId)}
                    waitingFor={openPrerequisites(task, tasksById).length}
                    onToggle={handleToggle}
                    onPress={() => router.push(Routes.taskDetail(task.id))}
                  />
                ))}
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>

      {/* --- Sort sheet ---------------------------------------------------- */}
      <BottomSheet visible={sortOpen} onClose={() => setSortOpen(false)} title="Sort tasks">
        <Stack gap="none">
          {SORTS.map((entry) => (
            <ListRow
              key={entry.key}
              inset={false}
              icon={entry.icon}
              title={entry.label}
              trailing={sort === entry.key ? <Icon name="check" size="md" color="brand" /> : null}
              showChevron={false}
              onPress={() => {
                setSort(entry.key);
                setSortOpen(false);
              }}
            />
          ))}
        </Stack>
      </BottomSheet>
    </Screen>
  );
}

/**
 * The tab's own title block. A plain function rather than a component defined
 * inside `PlanningScreen`: a nested definition gets a fresh identity on every
 * render, which would remount the header each time a filter chip is tapped.
 */
function Header({ overdueCount, onSortPress }) {
  return (
    <PageHeader
      eyebrow="Planning"
      title="Your checklist"
      subtitle={
        overdueCount > 0
          ? `${overdueCount} ${overdueCount === 1 ? 'task is' : 'tasks are'} overdue`
          : undefined
      }
      subtitleColor="danger"
      trailing={<NotificationBell />}
      actionLabel={onSortPress ? 'Sort' : undefined}
      actionIcon="sort"
      onActionPress={onSortPress}
    />
  );
}
