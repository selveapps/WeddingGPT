import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Screen, Stack, Text, ScreenHeader, useToast } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import {
  usePlanningStore,
  useWeddingStore,
  selectAllCategories,
  selectWeddingId,
} from '@/store';
import { TaskForm } from '@/features/planning/TaskForm';

/**
 * Add a task.
 *
 * Accepts an optional `categoryId` param so that adding from inside a category
 * pre-files the task there - the couple has already told us where it belongs by
 * being on that screen, and asking again is a small insult.
 */
export default function AddTaskScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const params = useLocalSearchParams();

  const categories = usePlanningStore(selectAllCategories);
  const addTask = usePlanningStore((state) => state.addTask);
  const weddingId = useWeddingStore(selectWeddingId);

  const handleSubmit = (values) => {
    addTask({ ...values, weddingId });
    toast.success('Task added');
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Planning" title="New task" />

          <Text variant="h1" heading>
            Add a task
          </Text>

          <TaskForm
            initial={params.categoryId ? { categoryId: String(params.categoryId) } : undefined}
            categories={categories}
            submitLabel="Add task"
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
        </Stack>
      </Screen>
    </KeyboardAvoidingView>
  );
}
