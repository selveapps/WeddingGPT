import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Text,
  ScreenHeader,
  EmptyState,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { usePlanningStore, selectTaskById, selectAllCategories } from '@/store';
import { TaskForm } from '@/features/planning/TaskForm';

/** Edit a task. Same form as Add, started from the saved values. */
export default function EditTaskScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const { id } = useLocalSearchParams();

  const task = usePlanningStore(selectTaskById(String(id)));
  const categories = usePlanningStore(selectAllCategories);
  const updateTask = usePlanningStore((state) => state.updateTask);

  if (!task) {
    return (
      <Screen>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Planning" title="Edit task" />
          <EmptyState
            icon="checklist"
            title="This task is gone"
            message="It was deleted while you were away from this screen."
            actionLabel="Back to the checklist"
            onAction={() => router.replace(Routes.planning)}
          />
        </Stack>
      </Screen>
    );
  }

  const handleSubmit = (values) => {
    updateTask(task.id, values);
    toast.success('Saved');
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Planning" title="Edit task" />

          <Text variant="h1" heading>
            Edit task
          </Text>

          <TaskForm
            initial={task}
            categories={categories}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
        </Stack>
      </Screen>
    </KeyboardAvoidingView>
  );
}
