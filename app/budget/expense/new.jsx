import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, Stack, Text, ScreenHeader, useToast } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import {
  useBudgetStore,
  useWeddingStore,
  selectAllBudgetCategories,
  selectBudget,
  selectWeddingId,
  selectWedding,
} from '@/store';
import { ExpenseForm } from '@/features/budget/ExpenseForm';

/** Add an expense. Pre-files into a category when opened from one. */
export default function AddExpenseScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const params = useLocalSearchParams();

  const categories = useBudgetStore(selectAllBudgetCategories);
  const budget = useBudgetStore(selectBudget);
  const addExpense = useBudgetStore((state) => state.addExpense);
  const weddingId = useWeddingStore(selectWeddingId);
  const wedding = useWeddingStore(selectWedding);

  const currency = budget?.currency ?? wedding?.currency;

  const handleSubmit = (values) => {
    addExpense({ ...values, weddingId });
    toast.success('Expense added');
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Budget" title="New expense" />

          <Text variant="h1" heading>
            Add an expense
          </Text>

          <ExpenseForm
            initial={
              params.categoryId ? { budgetCategoryId: String(params.categoryId) } : undefined
            }
            categories={categories}
            currency={currency}
            submitLabel="Add expense"
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
        </Stack>
      </Screen>
    </KeyboardAvoidingView>
  );
}
