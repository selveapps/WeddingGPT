import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Button,
  ListRow,
  Badge,
  ProgressRing,
  ProgressBar,
  ScreenHeader,
  SectionHeader,
  EmptyState,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { usePlanningStore, selectAllTasks, selectAllCategories } from '@/store';
import { TaskStatus, calculateProgress, isTaskOverdue, isTaskOpen } from '@/models';

/**
 * Planning progress detail (PRD s.6, "planning progress detail").
 *
 * The per-category breakdown is the reason this screen exists. An overall
 * percentage tells a couple how they are doing; it does not tell them that
 * every remaining task is in Paperwork, which is the thing that changes what
 * they do next.
 */
export default function ProgressScreen() {
  const router = useRouter();
  const { spacing } = useTheme();

  const tasks = usePlanningStore(selectAllTasks);
  const categories = usePlanningStore(selectAllCategories);

  const overall = useMemo(() => calculateProgress(tasks), [tasks]);

  const stats = useMemo(() => {
    const done = tasks.filter((task) => task.status === TaskStatus.DONE).length;
    const open = tasks.filter(isTaskOpen).length;
    const overdue = tasks.filter((task) => isTaskOverdue(task)).length;
    return { done, open, overdue, total: tasks.length };
  }, [tasks]);

  const byCategory = useMemo(() => {
    const rows = categories.map((category) => {
      const mine = tasks.filter((task) => task.categoryId === category.id);
      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        total: mine.length,
        done: mine.filter((task) => task.status === TaskStatus.DONE).length,
        overdue: mine.filter((task) => isTaskOverdue(task)).length,
        progress: calculateProgress(mine),
      };
    });

    // Least finished first: this screen is for finding what is stuck, and a
    // completed category at the top is the least useful row on it.
    return rows.filter((row) => row.total > 0).sort((a, b) => a.progress - b.progress);
  }, [categories, tasks]);

  if (tasks.length === 0) {
    return (
      <Screen>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Home" title="Progress" />
          <EmptyState
            icon="checklist"
            title="Nothing to measure yet"
            message="Once you have a checklist, this is where you see how it is going."
            actionLabel="Go to planning"
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
          label="Open the checklist"
          iconRight="arrowRight"
          onPress={() => router.push(Routes.planning)}
        />
      }
    >
      <Stack gap="lg">
        <ScreenHeader eyebrow="Home" title="Progress" />

        <Text variant="h1" heading>
          How it is going
        </Text>

        {/* --- Overall ------------------------------------------------------ */}
        <Card tone="raised">
          <Row gap="lg" align="center">
            <ProgressRing value={overall} size={96}>
              <Text variant="h3">{Math.round(overall * 100)}%</Text>
            </ProgressRing>

            <Stack gap="xs" style={{ flex: 1 }}>
              <Text variant="h4">
                {stats.done} of {stats.total} done
              </Text>
              <Text variant="bodySm" color="muted">
                {stats.open} still open
                {stats.overdue > 0 ? `, ${stats.overdue} overdue` : ''}
              </Text>

              {stats.overdue > 0 ? (
                <Button
                  label="See what is late"
                  variant="soft"
                  size="sm"
                  fullWidth={false}
                  onPress={() => router.push(Routes.planning)}
                />
              ) : null}
            </Stack>
          </Row>
        </Card>

        {/* --- By category --------------------------------------------------- */}
        <Stack gap="xs">
          <SectionHeader
            eyebrow="Where the work is"
            title="By category"
            subtitle="Least finished first."
          />

          <Card padding="none">
            {byCategory.map((row) => (
              <ListRow
                key={row.id}
                icon={row.icon ?? 'checklist'}
                title={row.name}
                subtitle={`${row.done} of ${row.total} done`}
                trailing={
                  row.overdue > 0 ? (
                    <Badge label={`${row.overdue} late`} tone="danger" />
                  ) : (
                    <Text variant="caption" color="subtle">
                      {Math.round(row.progress * 100)}%
                    </Text>
                  )
                }
                onPress={() => router.push(Routes.taskCategory(row.id))}
              />
            ))}
          </Card>
        </Stack>

        {/* --- The bars ------------------------------------------------------ */}
        <Stack gap="sm">
          <SectionHeader eyebrow="At a glance" title="Category progress" />
          {byCategory.map((row) => (
            <Stack key={row.id} gap="hair">
              <Row justify="space-between" align="baseline">
                <Text variant="bodySm">{row.name}</Text>
                <Text variant="caption" color="subtle">
                  {Math.round(row.progress * 100)}%
                </Text>
              </Row>
              <ProgressBar
                value={row.progress}
                height={6}
                tone={row.overdue > 0 ? 'warning' : 'brand'}
                accessibilityLabel={`${row.name}, ${Math.round(row.progress * 100)} percent done`}
              />
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Screen>
  );
}
