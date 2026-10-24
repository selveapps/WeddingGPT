import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Button,
  Card,
  Chip,
  ConfirmSheet,
  Row,
  Screen,
  ScreenHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import {
  selectAllCategories,
  selectTaskById,
  selectWedding,
  usePlanningStore,
  useWeddingStore,
} from '@/store';
import { TaskPriority } from '@/models';
import { fromISODate } from '@/lib/date';

const PRIORITIES = [
  { key: TaskPriority.NORMAL, label: 'Normal' },
  { key: TaskPriority.HIGH, label: 'High' },
  { key: TaskPriority.LOW, label: 'Low' },
];

export default function TaskEditor({ isNew = false }) {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams();
  const taskId = Array.isArray(id) ? id[0] : id;
  const task = usePlanningStore(selectTaskById(taskId));
  const categories = usePlanningStore(selectAllCategories);
  const wedding = useWeddingStore(selectWedding);
  const addTask = usePlanningStore((state) => state.addTask);
  const updateTask = usePlanningStore((state) => state.updateTask);
  const deleteTask = usePlanningStore((state) => state.deleteTask);

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? null);
  const [priority, setPriority] = useState(task?.priority ?? TaskPriority.NORMAL);
  const [error, setError] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);
  const unavailable = !isNew && !task;

  const save = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Add a title for this task.');
      return;
    }
    if (dueDate && !fromISODate(dueDate)) {
      setError('Enter a date as YYYY-MM-DD.');
      return;
    }
    if (!wedding?.id) {
      toast.error('Set up your wedding before adding planning tasks.');
      router.replace('/onboarding');
      return;
    }

    const fields = {
      title: trimmedTitle,
      description: description.trim(),
      dueDate: dueDate.trim() || null,
      categoryId,
      priority,
    };
    if (isNew) addTask({ ...fields, weddingId: wedding.id });
    else updateTask(task.id, fields);
    toast.success(isNew ? 'Task added.' : 'Task updated.');
    router.back();
  };

  const remove = () => {
    deleteTask(task.id);
    setConfirmDelete(false);
    toast.success('Task deleted.');
    router.back();
  };

  if (unavailable) {
    return (
      <Screen>
        <Stack gap="md">
          <ScreenHeader title="Task not found" />
          <Text color="muted">This task may have been removed.</Text>
          <Button label="Back to planning" onPress={() => router.replace('/(tabs)/planning')} />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack gap="lg">
        <ScreenHeader title={isNew ? 'Add a task' : 'Task details'} />
        <Card>
          <Stack gap="md">
            <TextField
              label="Task"
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                setError('');
              }}
              placeholder="What needs to get done?"
              required
              error={error && !title.trim() ? error : undefined}
              testID="planning-task-title"
            />
            <TextField
              label="Notes"
              value={description}
              onChangeText={setDescription}
              placeholder="Add any helpful details"
              multiline
              numberOfLines={3}
            />
            <TextField
              label="Due date"
              value={dueDate}
              onChangeText={(value) => {
                setDueDate(value);
                setError('');
              }}
              placeholder="YYYY-MM-DD"
              helper="Leave blank if there is no deadline."
              error={error && dueDate && !fromISODate(dueDate) ? error : undefined}
              testID="planning-task-due-date"
            />
          </Stack>
        </Card>

        {categories.length ? (
          <Stack gap="sm">
            <Text variant="labelStrong">Category</Text>
            <Row gap="xs" wrap>
              <Chip
                label="None"
                selected={!categoryId}
                onPress={() => setCategoryId(null)}
                size="sm"
              />
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  selected={categoryId === category.id}
                  onPress={() => setCategoryId(category.id)}
                  size="sm"
                />
              ))}
            </Row>
          </Stack>
        ) : null}

        <Stack gap="sm">
          <Text variant="labelStrong">Priority</Text>
          <Row gap="xs" wrap>
            {PRIORITIES.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                selected={priority === option.key}
                onPress={() => setPriority(option.key)}
                size="sm"
              />
            ))}
          </Row>
        </Stack>

        <Button label={isNew ? 'Add task' : 'Save changes'} onPress={save} />
        {!isNew ? (
          <Button label="Delete task" variant="danger" onPress={() => setConfirmDelete(true)} />
        ) : null}
      </Stack>
      <ConfirmSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title="Delete this task?"
        message="This cannot be undone."
        confirmLabel="Delete task"
        destructive
      />
    </Screen>
  );
}
