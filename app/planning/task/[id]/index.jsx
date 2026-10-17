import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Icon,
  Badge,
  Button,
  ListRow,
  Divider,
  ScreenHeader,
  ConfirmSheet,
  BottomSheet,
  EmptyState,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { usePlanningStore, selectTaskById, selectCategoryById } from '@/store';
import {
  TaskStatus,
  TASK_STATUS_META,
  TASK_PRIORITY_META,
  ASSIGNEE_META,
  isTaskOverdue,
  isSnoozeActive,
} from '@/models';
import { formatLongDate, formatRelativeDay } from '@/lib/date';

/** Snooze lengths offered on the sheet. Anything longer is really a new date. */
const SNOOZE_OPTIONS = [
  { days: 1, label: 'Tomorrow' },
  { days: 3, label: 'In 3 days' },
  { days: 7, label: 'Next week' },
  { days: 14, label: 'In 2 weeks' },
  { days: 30, label: 'In a month' },
];

/**
 * Task detail (PRD s.7).
 *
 * Every state the task can be in is reachable from here - done, reopened,
 * snoozed, reassigned, edited, deleted - because this is the screen a couple
 * lands on when a task turns out to be more complicated than a checkbox.
 */
export default function TaskDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const { id } = useLocalSearchParams();

  const task = usePlanningStore(selectTaskById(String(id)));
  const category = usePlanningStore(selectCategoryById(task?.categoryId ?? ''));

  const toggleTask = usePlanningStore((state) => state.toggleTask);
  const snoozeTask = usePlanningStore((state) => state.snoozeTask);
  const unsnoozeTask = usePlanningStore((state) => state.unsnoozeTask);
  const deleteTask = usePlanningStore((state) => state.deleteTask);

  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // A task can be deleted from under this screen (from the list behind it, or
  // by a confirm sheet that then navigates). Render the gone-state rather than
  // crashing on a null.
  if (!task) {
    return (
      <Screen>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Planning" title="Task" />
          <EmptyState
            icon="checklist"
            title="This task is gone"
            message="It was deleted, or the link is out of date."
            actionLabel="Back to the checklist"
            onAction={() => router.replace(Routes.planning)}
          />
        </Stack>
      </Screen>
    );
  }

  const done = task.status === TaskStatus.DONE;
  const overdue = isTaskOverdue(task);
  const snoozed = isSnoozeActive(task);
  const statusMeta = TASK_STATUS_META[task.status] ?? TASK_STATUS_META.todo;

  const handleToggle = () => {
    const updated = toggleTask(task.id);
    toast.success(updated?.status === TaskStatus.DONE ? 'Done. Nicely handled.' : 'Reopened');
  };

  const handleSnooze = (days) => {
    snoozeTask(task.id, days);
    setSnoozeOpen(false);
    toast.info(`Snoozed. We will bring it back ${days === 1 ? 'tomorrow' : `in ${days} days`}.`);
  };

  const handleDelete = () => {
    deleteTask(task.id);
    setConfirmDelete(false);
    toast.info('Task deleted');
    router.back();
  };

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        <Stack gap="xs">
          <Button
            label={done ? 'Mark as not done' : 'Mark as done'}
            iconLeft={done ? 'refresh' : 'check'}
            variant={done ? 'secondary' : 'primary'}
            onPress={handleToggle}
          />
          {!done ? (
            <Row gap="xs">
              <Button
                label={snoozed ? 'Un-snooze' : 'Snooze'}
                iconLeft="snooze"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => {
                  if (snoozed) {
                    unsnoozeTask(task.id);
                    toast.info('Back on the list');
                  } else {
                    setSnoozeOpen(true);
                  }
                }}
              />
              <Button
                label="Edit"
                iconLeft="edit"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => router.push(Routes.taskEdit(task.id))}
              />
            </Row>
          ) : null}
        </Stack>
      }
    >
      <Stack gap="lg">
        <ScreenHeader
          eyebrow={category?.name ?? 'Planning'}
          title="Task"
          actionIcon="edit"
          actionLabel="Edit this task"
          onActionPress={() => router.push(Routes.taskEdit(task.id))}
        />

        {/* --- Title and status -------------------------------------------- */}
        <Stack gap="sm">
          <Text variant="h1" heading>
            {task.title}
          </Text>

          <Row gap="xs" wrap>
            <Badge label={statusMeta.label} tone={statusMeta.tone} />
            {overdue ? <Badge label="Overdue" tone="danger" /> : null}
            {task.isSystemGenerated ? <Badge label="From your plan" tone="neutral" /> : null}
          </Row>

          {task.description ? (
            <Text variant="body" color="muted">
              {task.description}
            </Text>
          ) : null}
        </Stack>

        {/* --- Facts -------------------------------------------------------- */}
        <Card padding="none">
          <ListRow
            icon="calendar"
            title="Due"
            showChevron={false}
            trailing={
              <Text variant="body" color={overdue ? 'danger' : 'muted'}>
                {task.dueDate ? formatRelativeDay(task.dueDate) : 'No date'}
              </Text>
            }
          />
          {task.dueDate ? (
            <ListRow
              icon="clock"
              title="On"
              showChevron={false}
              trailing={
                <Text variant="body" color="muted">
                  {formatLongDate(task.dueDate)}
                </Text>
              }
            />
          ) : null}
          {snoozed ? (
            <ListRow
              icon="snooze"
              title="Snoozed until"
              showChevron={false}
              trailing={
                <Text variant="body" color="muted">
                  {formatLongDate(task.snoozedUntil)}
                </Text>
              }
            />
          ) : null}
          <ListRow
            icon="alert"
            title="Priority"
            showChevron={false}
            trailing={
              <Text variant="body" color="muted">
                {(TASK_PRIORITY_META[task.priority] ?? {}).label ?? 'Normal'}
              </Text>
            }
          />
          <ListRow
            icon="user"
            title="Assigned to"
            showChevron={false}
            trailing={
              <Text variant="body" color="muted">
                {(ASSIGNEE_META[task.assignee] ?? {}).label ?? 'Unassigned'}
              </Text>
            }
          />
          {category ? (
            <ListRow
              icon={category.icon ?? 'checklist'}
              title="Category"
              trailing={
                <Text variant="body" color="muted">
                  {category.name}
                </Text>
              }
              onPress={() => router.push(Routes.taskCategory(category.id))}
            />
          ) : null}
        </Card>

        {/* --- Notes -------------------------------------------------------- */}
        <Stack gap="xs">
          <Row justify="space-between" align="baseline">
            <Text variant="eyebrow" color="subtle">
              Notes
            </Text>
            <Text
              variant="actionSm"
              color="brand"
              onPress={() => router.push(Routes.taskEdit(task.id))}
            >
              Edit
            </Text>
          </Row>

          {task.notes ? (
            <Card tone="muted">
              <Text variant="body" color="muted">
                {task.notes}
              </Text>
            </Card>
          ) : (
            <Card tone="outline">
              <Row gap="sm">
                <Icon name="note" size="md" color="inkSubtle" />
                <Text variant="bodySm" color="subtle" style={{ flex: 1 }}>
                  Quotes, phone numbers, what you decided and why - it all ends up
                  mattering later.
                </Text>
              </Row>
            </Card>
          )}
        </Stack>

        <Divider />

        <Button
          label="Delete this task"
          variant="ghost"
          iconLeft="trash"
          onPress={() => setConfirmDelete(true)}
        />
      </Stack>

      {/* --- Snooze ------------------------------------------------------- */}
      <BottomSheet
        visible={snoozeOpen}
        onClose={() => setSnoozeOpen(false)}
        title="Snooze this task"
        subtitle="It keeps its real due date. We just stop putting it in front of you."
      >
        <Stack gap="none">
          {SNOOZE_OPTIONS.map((option) => (
            <ListRow
              key={option.days}
              inset={false}
              icon="snooze"
              title={option.label}
              onPress={() => handleSnooze(option.days)}
            />
          ))}
        </Stack>
      </BottomSheet>

      {/* --- Delete ------------------------------------------------------- */}
      <ConfirmSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this task?"
        message={`"${task.title}" will be removed from your checklist. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        icon="trash"
      />
    </Screen>
  );
}
