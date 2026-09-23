import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Button,
  ProgressBar,
  ScreenHeader,
  EmptyState,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { usePlanningStore, selectAllTasks, selectCategoryById } from '@/store';
import { TaskStatus, calculateProgress, isTaskOpen } from '@/models';
import { TaskRow } from '@/features/planning/TaskRow';

/**
 * One task category (PRD s.7, "task category list").
 *
 * Open tasks first, done ones collected at the bottom: the finished work is
 * worth seeing - it is the evidence of progress - but it should never be the
 * first thing between you and what is left.
 */
export default function TaskCategoryScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const { id } = useLocalSearchParams();

  const categoryId = String(id);
  const category = usePlanningStore(selectCategoryById(categoryId));
  const allTasks = usePlanningStore(selectAllTasks);
  const toggleTask = usePlanningStore((state) => state.toggleTask);

  const { open, done, progress } = useMemo(() => {
    const mine = allTasks.filter((task) => task.categoryId === categoryId);
    const byDue = (a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
    };
    return {
      open: mine.filter(isTaskOpen).sort(byDue),
      done: mine.filter((task) => task.status === TaskStatus.DONE).sort(byDue),
      progress: calculateProgress(mine),
    };
  }, [allTasks, categoryId]);

  const handleToggle = (task) => {
    const updated = toggleTask(task.id);
    if (updated?.status === TaskStatus.DONE) {
      toast.success(`${task.title} - done`, {
        actionLabel: 'Undo',
        onAction: () => toggleTask(task.id),
      });
    }
  };

  if (!category) {
    return (
      <Screen>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Planning" title="Category" />
          <EmptyState
            icon="checklist"
            title="This category is gone"
            message="It was removed, or the link is out of date."
            actionLabel="Back to the checklist"
            onAction={() => router.replace(Routes.planning)}
          />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        <Button
          label="Add a task here"
          iconLeft="plus"
          onPress={() => router.push({ pathname: Routes.taskAdd, params: { categoryId } })}
        />
      }
    >
      <Stack gap="lg">
        <ScreenHeader eyebrow="Planning" title={category.name} />

        <Stack gap="sm">
          <Text variant="h1" heading>
            {category.name}
          </Text>

          <Card tone="muted">
            <Stack gap="xs">
              <Row justify="space-between" align="baseline">
                <Text variant="h4">{Math.round(progress * 100)}% done</Text>
                <Text variant="bodySm" color="muted">
                  {open.length} left of {open.length + done.length}
                </Text>
              </Row>
              <ProgressBar value={progress} />
            </Stack>
          </Card>
        </Stack>

        {open.length === 0 && done.length === 0 ? (
          <EmptyState
            compact
            icon="checklist"
            title="Nothing here yet"
            message="Add the first task for this part of the plan."
            actionLabel="Add a task"
            onAction={() => router.push({ pathname: Routes.taskAdd, params: { categoryId } })}
          />
        ) : null}

        {open.length > 0 ? (
          <Stack gap="none">
            <Text variant="eyebrow" color="subtle">
              To do
            </Text>
            {open.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onPress={() => router.push(Routes.taskDetail(task.id))}
              />
            ))}
          </Stack>
        ) : null}

        {done.length > 0 ? (
          <Stack gap="none">
            <Text variant="eyebrow" color="subtle">
              Done
            </Text>
            {done.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onPress={() => router.push(Routes.taskDetail(task.id))}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Screen>
  );
}
