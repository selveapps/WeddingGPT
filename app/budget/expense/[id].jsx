import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Button,
  Divider,
  ProgressBar,
  ScreenHeader,
  ConfirmSheet,
  EmptyState,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  useBudgetStore,
  useWeddingStore,
  selectAllBudgetCategories,
  selectBudget,
  selectWedding,
} from '@/store';
import { PAYMENT_STATUS_META, ExpenseCommitment } from '@/models';
import { formatMoney } from '@/lib/currency';
import { ExpenseForm } from '@/features/budget/ExpenseForm';

/**
 * One expense: view, edit in place, or delete.
 *
 * Editing happens on this screen rather than on a pushed one. An expense is
 * small enough to hold in your head, and the usual reason for opening it is to
 * correct a figure - a navigation step between seeing the wrong number and
 * fixing it would be pure ceremony.
 */
export default function ExpenseDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const { id } = useLocalSearchParams();

  const expense = useBudgetStore((state) => state.expenses.byId[String(id)] ?? null);
  const categories = useBudgetStore(selectAllBudgetCategories);
  const budget = useBudgetStore(selectBudget);
  const updateExpense = useBudgetStore((state) => state.updateExpense);
  const deleteExpense = useBudgetStore((state) => state.deleteExpense);
  const wedding = useWeddingStore(selectWedding);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currency = budget?.currency ?? wedding?.currency;

  if (!expense) {
    return (
      <Screen>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Budget" title="Expense" />
          <EmptyState
            icon="budget"
            title="This expense is gone"
            message="It was deleted, or the link is out of date."
            actionLabel="Back to the budget"
            onAction={() => router.replace(Routes.budget)}
          />
        </Stack>
      </Screen>
    );
  }

  const category = categories.find((entry) => entry.id === expense.budgetCategoryId);
  const meta = PAYMENT_STATUS_META[expense.paymentStatus] ?? {};
  // Never display a negative balance if imported or older data is overpaid.
  const outstanding = Math.max(0, (expense.amount ?? 0) - (expense.paidAmount ?? 0));

  const handleSave = (values) => {
    updateExpense(expense.id, values);
    setEditing(false);
    toast.success('Saved');
  };

  const handleDelete = () => {
    deleteExpense(expense.id);
    setConfirmDelete(false);
    toast.info('Expense deleted');
    router.back();
  };

  if (editing) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Screen bottomInset={spacing.xxl}>
          <Stack gap="lg">
            <ScreenHeader
              eyebrow="Budget"
              title="Edit expense"
              onBack={() => setEditing(false)}
              backLabel="Stop editing"
            />

            <ExpenseForm
              initial={expense}
              categories={categories}
              currency={currency}
              submitLabel="Save changes"
              onSubmit={handleSave}
              onCancel={() => setEditing(false)}
            />
          </Stack>
        </Screen>
      </KeyboardAvoidingView>
    );
  }

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        <Stack gap="xs">
          {outstanding > 0 ? (
            <Button
              label={`Mark as fully paid (${formatMoney(outstanding, currency)} left)`}
              iconLeft="check"
              onPress={() => {
                // Reuse the store action so the paid amount and status stay in sync.
                useBudgetStore.getState().recordPayment(expense.id, expense.amount);
                toast.success('Marked as paid');
              }}
            />
          ) : null}
          <Button
            label="Edit"
            iconLeft="edit"
            variant={outstanding > 0 ? 'secondary' : 'primary'}
            onPress={() => setEditing(true)}
          />
        </Stack>
      }
    >
      <Stack gap="lg">
        <ScreenHeader
          eyebrow={category?.name ?? 'Budget'}
          title="Expense"
          actionIcon="edit"
          actionLabel="Edit this expense"
          onActionPress={() => setEditing(true)}
        />

        <Stack gap="sm">
          <Text variant="h1" heading>
            {expense.title}
          </Text>

          {expense.vendorName ? (
            <Text variant="body" color="muted">
              {expense.vendorName}
            </Text>
          ) : null}

          <Row gap="xs" wrap>
            <Badge label={meta.label ?? 'Unpaid'} tone={meta.tone ?? 'neutral'} />
            <Badge
              label={
                expense.commitment === ExpenseCommitment.COMMITTED ? 'Committed' : 'Estimated'
              }
              tone={expense.commitment === ExpenseCommitment.COMMITTED ? 'info' : 'neutral'}
            />
          </Row>
        </Stack>

        {/* --- Money -------------------------------------------------------- */}
        <Card tone="raised">
          <Stack gap="md">
            <Row justify="space-between" align="baseline">
              <Stack gap="hair">
                <Text variant="caption" color="subtle">
                  Total
                </Text>
                <Text variant="numeric">{formatMoney(expense.amount, currency)}</Text>
              </Stack>

              <Stack gap="hair" align="flex-end">
                <Text variant="caption" color="subtle">
                  Still owed
                </Text>
                <Text variant="numeric" color={outstanding > 0 ? 'warning' : 'success'}>
                  {formatMoney(outstanding, currency)}
                </Text>
              </Stack>
            </Row>

            <ProgressBar
              value={expense.amount > 0 ? (expense.paidAmount ?? 0) / expense.amount : 0}
              tone="success"
              label="Paid"
              valueLabel={`${formatMoney(expense.paidAmount ?? 0, currency)} of ${formatMoney(
                expense.amount,
                currency
              )}`}
            />
          </Stack>
        </Card>

        {expense.notes ? (
          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">
              Notes
            </Text>
            <Card tone="muted">
              <Text variant="body" color="muted">
                {expense.notes}
              </Text>
            </Card>
          </Stack>
        ) : null}

        <Divider />

        <Button
          label="Delete this expense"
          variant="ghost"
          iconLeft="trash"
          onPress={() => setConfirmDelete(true)}
        />
      </Stack>

      <ConfirmSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this expense?"
        message={`"${expense.title}" will be removed from your budget. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        icon="trash"
      />
    </Screen>
  );
}
