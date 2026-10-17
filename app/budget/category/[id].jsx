import React, { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Button,
  ListRow,
  ProgressBar,
  ScreenHeader,
  SectionHeader,
  BottomSheet,
  EmptyState,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  useBudgetStore,
  useWeddingStore,
  selectAllExpenses,
  selectBudget,
  selectWedding,
} from '@/store';
import { summariseCategory, PAYMENT_STATUS_META } from '@/models';
import { formatMoney, formatMoneyCompact } from '@/lib/currency';
import { formatMediumDate } from '@/lib/date';
import { MoneyField } from '@/features/shared/MoneyField';

/**
 * One budget category (PRD s.8, "category drill-down").
 *
 * Over-allocation is called out rather than clamped. A category that has gone
 * past its share is information the couple needs, not an error to prevent -
 * the venue running over is usually a decision, and the right response is to
 * see it and move money, not to be blocked from recording what happened.
 */
export default function BudgetCategoryScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const { id } = useLocalSearchParams();

  const categoryId = String(id);
  const category = useBudgetStore((state) => state.categories.byId[categoryId] ?? null);
  const expenses = useBudgetStore(selectAllExpenses);
  const budget = useBudgetStore(selectBudget);
  const updateCategory = useBudgetStore((state) => state.updateCategory);
  const wedding = useWeddingStore(selectWedding);

  const [editOpen, setEditOpen] = useState(false);
  const [draftAllocation, setDraftAllocation] = useState(null);

  const currency = budget?.currency ?? wedding?.currency;

  const mine = useMemo(
    () =>
      expenses
        .filter((expense) => expense.budgetCategoryId === categoryId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [expenses, categoryId]
  );

  const summary = useMemo(
    () => (category ? summariseCategory(category, expenses) : null),
    [category, expenses]
  );

  if (!category || !summary) {
    return (
      <Screen>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Budget" title="Category" />
          <EmptyState
            icon="budget"
            title="This category is gone"
            message="It was removed, or the link is out of date."
            actionLabel="Back to the budget"
            onAction={() => router.replace(Routes.budget)}
          />
        </Stack>
      </Screen>
    );
  }

  const saveAllocation = () => {
    if (draftAllocation === null) return;
    updateCategory(category.id, { allocated: draftAllocation });
    setEditOpen(false);
    toast.success('Allocation updated');
  };

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        <Button
          label="Add an expense here"
          iconLeft="plus"
          onPress={() =>
            router.push({ pathname: Routes.expenseAdd, params: { categoryId } })
          }
        />
      }
    >
      <Stack gap="lg">
        <ScreenHeader
          eyebrow="Budget"
          title={category.name}
          actionIcon="edit"
          actionLabel="Change the allocation"
          onActionPress={() => {
            setDraftAllocation(category.allocated ?? 0);
            setEditOpen(true);
          }}
        />

        <Text variant="h1" heading>
          {category.name}
        </Text>

        {/* --- Rollup ------------------------------------------------------- */}
        <Card tone="raised">
          <Stack gap="md">
            <Row justify="space-between" align="baseline">
              <Stack gap="hair">
                <Text variant="caption" color="subtle">
                  Allocated here
                </Text>
                <Text variant="numeric">{formatMoney(summary.allocated, currency)}</Text>
              </Stack>

              <Stack gap="hair" align="flex-end">
                <Text variant="caption" color="subtle">
                  Budget for this
                </Text>
                <Text variant="numeric" color="muted">
                  {formatMoney(summary.total, currency)}
                </Text>
              </Stack>
            </Row>

            <ProgressBar
              segments={[
                {
                  key: 'spent',
                  value: summary.spent / (summary.total || 1),
                  color: 'brand',
                },
                {
                  key: 'committed',
                  value: summary.committed / (summary.total || 1),
                  color: 'accent',
                },
              ]}
              height={10}
            />

            {summary.isOverAllocated ? (
              <Row gap="xs">
                <Badge label="Over allocation" tone="danger" />
                <Text variant="bodySm" color="muted" style={{ flex: 1 }}>
                  {formatMoneyCompact(summary.allocated - summary.total, currency)} more than
                  this category was given.
                </Text>
              </Row>
            ) : (
              <Text variant="bodySm" color="muted">
                {formatMoneyCompact(Math.max(0, summary.remaining), currency)} still free here.
              </Text>
            )}
          </Stack>
        </Card>

        {/* --- Expenses ----------------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader
            eyebrow="What is in it"
            title={`${mine.length} ${mine.length === 1 ? 'expense' : 'expenses'}`}
          />

          {mine.length === 0 ? (
            <EmptyState
              compact
              icon="budget"
              title="Nothing recorded here"
              message="Quotes count too - record one as an estimate and it will inform the plan without eating your remaining budget."
              actionLabel="Add an expense"
              onAction={() =>
                router.push({ pathname: Routes.expenseAdd, params: { categoryId } })
              }
            />
          ) : (
            <Card padding="none">
              {mine.map((expense) => {
                const meta = PAYMENT_STATUS_META[expense.paymentStatus] ?? {};
                return (
                  <ListRow
                    key={expense.id}
                    title={expense.title}
                    subtitle={
                      expense.vendorName ||
                      (expense.dueDate ? `Due ${formatMediumDate(expense.dueDate)}` : 'No date')
                    }
                    trailing={
                      <Stack gap="hair" align="flex-end">
                        <Text variant="bodyStrong">
                          {formatMoneyCompact(expense.amount, currency)}
                        </Text>
                        <Badge label={meta.label ?? 'Unpaid'} tone={meta.tone ?? 'neutral'} />
                      </Stack>
                    }
                    onPress={() => router.push(Routes.expenseDetail(expense.id))}
                  />
                );
              })}
            </Card>
          )}
        </Stack>
      </Stack>

      {/* --- Change allocation -------------------------------------------- */}
      <BottomSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Budget for ${category.name}`}
        subtitle="Moving money here does not change your overall total."
        footer={<Button label="Save allocation" onPress={saveAllocation} />}
      >
        <MoneyField
          label="Allocated"
          value={draftAllocation}
          onChange={setDraftAllocation}
          currency={currency}
          helper={`Currently ${formatMoney(category.allocated ?? 0, currency)}.`}
        />
      </BottomSheet>
    </Screen>
  );
}
