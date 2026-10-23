import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Badge,
  BottomSheet,
  Button,
  Card,
  Icon,
  ListRow,
  Row,
  SectionHeader,
  Stack,
  Text,
  TextField,
  Touchable,
  useToast,
} from '@/design-system/components';
import { Routes } from '@/navigation/routes';
import { usePlanningStore, selectAllTasks } from '@/store';
import {
  DEPENDENCY_LIMITS,
  TaskStatus,
  dependencyError,
  dependentsOf,
  isTaskOpen,
  openPrerequisites,
  prerequisitesOf,
} from '@/models';

const statusBadge = (task) =>
  task.status === TaskStatus.DONE ? (
    <Badge label="Done" tone="success" />
  ) : task.status === TaskStatus.SKIPPED ? (
    <Badge label="Skipped" />
  ) : (
    <Badge label="To do" tone="warning" />
  );

/**
 * What a task waits for, and what waits for it (slice C2). Waiting is advice:
 * the task can still be ticked off, it just stays off the daily checklist
 * until what it waits for is done.
 */
export function TaskDependencies({ task }) {
  const router = useRouter();
  const toast = useToast();
  const tasks = usePlanningStore(selectAllTasks);
  const { addPrerequisite, removePrerequisite } = usePlanningStore.getState();
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');

  const byId = useMemo(() => new Map(tasks.map((entry) => [entry.id, entry])), [tasks]);
  const prerequisites = prerequisitesOf(task, byId);
  const open = openPrerequisites(task, byId);
  const dependents = dependentsOf(task.id, tasks);
  const full = (task.waitsFor ?? []).length >= DEPENDENCY_LIMITS.perTask;

  // Only tasks it could wait for: not itself, not already linked, not a loop.
  const choices = useMemo(() => {
    if (!picking) return [];
    const needle = query.trim().toLowerCase();
    return tasks
      .filter((entry) => !dependencyError(task.id, entry.id, byId))
      .filter((entry) => !needle || entry.title.toLowerCase().includes(needle))
      .sort((a, b) => Number(!isTaskOpen(a)) - Number(!isTaskOpen(b)) || a.title.localeCompare(b.title));
  }, [picking, query, tasks, task.id, byId]);

  const choose = (prerequisite) => {
    const result = addPrerequisite(task.id, prerequisite.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPicking(false);
    setQuery('');
    toast.success(`Now waits for ${prerequisite.title}`);
  };

  return (
    <Stack gap="sm">
      <SectionHeader
        eyebrow="Order"
        title="Waits for"
        subtitle={
          prerequisites.length
            ? undefined
            : 'Tasks that need to happen first, like the guest list before invitations.'
        }
      />

      {open.length && isTaskOpen(task) ? (
        <Card tone="accent">
          <Row gap="sm" align="flex-start">
            <Icon name="clock" size="md" color="warning" />
            <Text variant="bodySm" style={{ flex: 1 }}>
              {`Waiting for ${open.length} ${open.length === 1 ? 'task' : 'tasks'}. It stays off your daily list until ${
                open.length === 1 ? 'that is' : 'they are'
              } done, but you can still tick it off.`}
            </Text>
          </Row>
        </Card>
      ) : null}

      {prerequisites.length ? (
        <Card padding="none">
          {prerequisites.map((prerequisite) => (
            <ListRow
              key={prerequisite.id}
              title={prerequisite.title}
              onPress={() => router.push(Routes.taskDetail(prerequisite.id))}
              trailing={
                <Row gap="xs" align="center">
                  {statusBadge(prerequisite)}
                  <Touchable
                    onPress={() => removePrerequisite(task.id, prerequisite.id)}
                    accessibilityLabel={`Stop waiting for ${prerequisite.title}`}
                  >
                    <Icon name="close" size="sm" color="muted" />
                  </Touchable>
                </Row>
              }
              showChevron={false}
            />
          ))}
        </Card>
      ) : null}

      <Button
        label={full ? `Waits for the most it can (${DEPENDENCY_LIMITS.perTask})` : 'Wait for another task'}
        variant="secondary"
        iconLeft="plus"
        disabled={full}
        onPress={() => setPicking(true)}
      />

      {dependents.length ? (
        <Stack gap="xs">
          <Text variant="eyebrow" color="subtle">
            Waiting for this
          </Text>
          <Card padding="none">
            {dependents.map((dependent) => (
              <ListRow
                key={dependent.id}
                title={dependent.title}
                trailing={statusBadge(dependent)}
                onPress={() => router.push(Routes.taskDetail(dependent.id))}
              />
            ))}
          </Card>
        </Stack>
      ) : null}

      <BottomSheet
        visible={picking}
        onClose={() => setPicking(false)}
        title="Wait for which task?"
        subtitle="Tasks that already wait for this one are left out, so the plan never goes round in a circle."
      >
        <Stack gap="sm">
          <TextField label="Search tasks" value={query} onChangeText={setQuery} placeholder="Guest list" />
          {choices.length ? (
            <Stack gap="none">
              {choices.map((choice) => (
                <ListRow
                  key={choice.id}
                  inset={false}
                  title={choice.title}
                  trailing={choice.status === TaskStatus.DONE ? <Badge label="Done" tone="success" /> : null}
                  showChevron={false}
                  onPress={() => choose(choice)}
                />
              ))}
            </Stack>
          ) : (
            <Text variant="bodySm" color="muted">
              No task matches.
            </Text>
          )}
        </Stack>
      </BottomSheet>
    </Stack>
  );
}

export default TaskDependencies;
