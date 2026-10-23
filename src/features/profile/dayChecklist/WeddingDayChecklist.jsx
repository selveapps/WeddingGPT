import React, { useMemo, useState } from 'react';

import {
  BottomSheet,
  Button,
  Card,
  Chip,
  ConfirmSheet,
  EmptyState,
  ProgressRing,
  Row,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';

import { DayChecklistTaskForm, DayChecklistTaskRow } from './components';
import { useDayChecklist } from './hooks';
import {
  DAY_CHECKLIST_CATEGORIES,
  DAY_CHECKLIST_COPY,
  DAY_CHECKLIST_FILTERS,
  EMPTY_DAY_CHECKLIST_TASK,
} from './lib/dayChecklistConstants';
import {
  filterDayChecklistTasks,
  summariseDayChecklist,
  validateDayChecklistTask,
} from './lib/dayChecklistHelpers';

export function WeddingDayChecklist() {
  const toast = useToast();
  const { tasks, addTask, updateTask, toggleTask, removeTask, addStarterChecklist, clearCompleted } =
    useDayChecklist();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [values, setValues] = useState(EMPTY_DAY_CHECKLIST_TASK);
  const [errors, setErrors] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [removingTask, setRemovingTask] = useState(null);
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const summary = useMemo(() => summariseDayChecklist(tasks), [tasks]);
  const visibleTasks = useMemo(
    () => filterDayChecklistTasks(tasks, { status, category, query }),
    [tasks, status, category, query]
  );

  const openNewTask = () => {
    setValues(EMPTY_DAY_CHECKLIST_TASK);
    setErrors({});
    setEditingTask(null);
    setSheetOpen(true);
  };

  const openEditTask = (task) => {
    setValues({
      title: task.title,
      category: task.category,
      time: task.time ?? '',
      owner: task.owner ?? '',
      priority: task.priority ?? 'normal',
      note: task.note ?? '',
    });
    setErrors({});
    setEditingTask(task);
    setSheetOpen(true);
  };

  const saveTask = () => {
    const result = validateDayChecklistTask(values);
    setErrors(result.errors);
    if (!result.isValid) return;
    const saved = editingTask ? updateTask(editingTask.id, values) : addTask(values);
    if (!saved) {
      toast.error('Could not save this checklist task.');
      return;
    }
    setSheetOpen(false);
    toast.success(editingTask ? 'Checklist task updated.' : 'Checklist task added.');
  };

  const removeSelectedTask = () => {
    if (!removingTask) return;
    const removed = removeTask(removingTask.id);
    setRemovingTask(null);
    if (removed) toast.success('Checklist task removed.');
    else toast.error('Could not remove this checklist task.');
  };

  const loadStarterChecklist = () => {
    if (addStarterChecklist()) {
      toast.success('Starter checklist added. Make it yours by editing tasks.');
    } else {
      toast.error('Could not add the starter checklist.');
    }
  };

  const removeCompleted = () => {
    if (clearCompleted()) toast.success('Completed tasks cleared.');
    else toast.info('There are no completed tasks to clear.');
  };

  return (
    <Stack gap="md" testID="wedding-day-checklist">
      <Stack gap="xxs">
        <Text variant="eyebrow" color="subtle">
          {DAY_CHECKLIST_COPY.title}
        </Text>
        <Text variant="bodySm" color="muted">
          {DAY_CHECKLIST_COPY.subtitle}
        </Text>
      </Stack>

      <Card tone="plain">
        <Row gap="md" align="center">
          <ProgressRing
            value={summary.completionPercent / 100}
            size={68}
            thickness={7}
            tone={summary.total ? 'brand' : 'neutral'}
            accessibilityLabel={`${summary.completionPercent}% of checklist tasks complete`}
          >
            <Text variant="labelStrong">{summary.completionPercent}%</Text>
          </ProgressRing>
          <Stack gap="xxs" style={{ flex: 1 }}>
            <Text variant="labelStrong">
              {summary.total ? `${summary.completed} of ${summary.total} tasks done` : 'Your day, your way'}
            </Text>
            <Text variant="caption" color="muted">
              {summary.total
                ? `${summary.remaining} to do · ${DAY_CHECKLIST_COPY.completedCount(summary.completed)}`
                : 'Build a list everyone can help with.'}
            </Text>
          </Stack>
          {summary.completed > 0 ? (
            <Button label="Clear done" size="sm" variant="secondary" onPress={removeCompleted} />
          ) : null}
        </Row>
      </Card>

      <Card tone="plain">
        <Stack gap="sm">
          <Row justify="space-between" align="center" wrap gap="sm">
            <Stack gap="xxs">
              <Text variant="labelStrong">Day-of tasks</Text>
              <Text variant="caption" color="muted">
                {summary.total ? DAY_CHECKLIST_COPY.taskCount(summary.total) : 'Nothing on the list yet'}
              </Text>
            </Stack>
            <Button
              label={DAY_CHECKLIST_COPY.addTask}
              size="sm"
              variant="soft"
              iconLeft="plus"
              onPress={openNewTask}
              testID="day-checklist-add-task"
            />
          </Row>

          {tasks.length ? (
            <Stack gap="sm">
              <TextField
                label="Search tasks"
                value={query}
                onChangeText={setQuery}
                placeholder="Search tasks, owners or notes"
                accessibilityLabel="Search checklist tasks"
                testID="day-checklist-search"
              />
              <Row gap="xs" wrap>
                {DAY_CHECKLIST_FILTERS.map((filter) => (
                  <Chip
                    key={filter.value}
                    label={filter.label}
                    selected={status === filter.value}
                    onPress={() => setStatus(filter.value)}
                    size="sm"
                  />
                ))}
              </Row>
              <Row gap="xs" wrap>
                <Chip
                  label="Every area"
                  selected={category === 'all'}
                  onPress={() => setCategory('all')}
                  size="sm"
                />
                {DAY_CHECKLIST_CATEGORIES.map((item) => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    icon={item.icon}
                    selected={category === item.value}
                    onPress={() => setCategory(item.value)}
                    size="sm"
                  />
                ))}
              </Row>
            </Stack>
          ) : null}

          {visibleTasks.length ? (
            <Stack gap="none">
              {visibleTasks.map((task) => (
                <DayChecklistTaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onEdit={() => openEditTask(task)}
                  onRemove={() => setRemovingTask(task)}
                />
              ))}
            </Stack>
          ) : tasks.length ? (
            <EmptyState
              icon="search"
              compact
              title="No matching tasks"
              message="Try another search or filter, or add a new task."
            />
          ) : (
            <Stack gap="sm">
              <EmptyState
                icon="checklist"
                compact
                title={DAY_CHECKLIST_COPY.emptyTitle}
                message={DAY_CHECKLIST_COPY.emptyMessage}
              />
              <Button
                label={DAY_CHECKLIST_COPY.sampleButton}
                variant="secondary"
                iconLeft="sparkle"
                onPress={loadStarterChecklist}
                testID="day-checklist-add-starter"
              />
            </Stack>
          )}
        </Stack>
      </Card>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingTask ? DAY_CHECKLIST_COPY.editTask : 'New checklist task'}
        subtitle="Add a task, choose when it belongs, and decide who will take care of it."
        footer={
          <Row gap="sm">
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => setSheetOpen(false)}
              style={{ flex: 1 }}
            />
            <Button
              label={DAY_CHECKLIST_COPY.saveTask}
              onPress={saveTask}
              style={{ flex: 1 }}
              testID="day-checklist-save-task"
            />
          </Row>
        }
      >
        <DayChecklistTaskForm values={values} errors={errors} onChange={setValues} />
      </BottomSheet>

      <ConfirmSheet
        visible={Boolean(removingTask)}
        onClose={() => setRemovingTask(null)}
        onConfirm={removeSelectedTask}
        title="Remove this task?"
        message={removingTask ? `“${removingTask.title}” will be removed from your checklist.` : ''}
        confirmLabel="Remove task"
        cancelLabel="Keep task"
        destructive
        icon="trash"
      />
    </Stack>
  );
}

export default WeddingDayChecklist;
