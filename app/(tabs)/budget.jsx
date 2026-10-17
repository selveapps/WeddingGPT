import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Icon,
  Button,
  Badge,
  ListRow,
  ProgressBar,
  AnimatedNumber,
  SectionHeader,
  EmptyState,
  PageHeader,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  useBudgetStore,
  useWeddingStore,
  selectBudget,
  selectAllExpenses,
  selectAllBudgetCategories,
  selectHasBudget,
  selectWedding,
} from '@/store';
import { summariseBudget, summariseCategory, PAYMENT_STATUS_META } from '@/models';
import { formatMoney, formatMoneyCompact, percentOf } from '@/lib/currency';
import { formatMediumDate } from '@/lib/date';
import { NotificationBell } from '@/features/notifications/NotificationBell';

/**
 * Budget tab (PRD s.8).
 *
 * The three figures at the top are deliberately separate: spent, committed and
 * remaining mean different things, and a budget tool that collapses them into
 * one "used" number is the kind that stops being trusted around month four.
 * `summariseBudget` owns the arithmetic; this screen only presents it.
 */
export default function BudgetScreen() {
  const router = useRouter();
  const { spacing } = useTheme();

  const hasBudget = useBudgetStore(selectHasBudget);
  const budget = useBudgetStore(selectBudget);
  const expenses = useBudgetStore(selectAllExpenses);
  const categories = useBudgetStore(selectAllBudgetCategories);
  const wedding = useWeddingStore(selectWedding);

  const currency = budget?.currency ?? wedding?.currency;
  const total = budget?.total ?? 0;

  const summary = useMemo(() => summariseBudget(total, expenses), [total, expenses]);

  const categorySummaries = useMemo(
    () => categories.map((category) => summariseCategory(category, expenses)),
    [categories, expenses]
  );

  const recent = useMemo(
    () =>
      [...expenses]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 5),
    [expenses]
  );

  // --- No budget yet --------------------------------------------------------
  if (!hasBudget) {
    return (
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="xl">
          <PageHeader eyebrow="Budget" title="Where the money goes" trailing={<NotificationBell />} />

          <EmptyState
            icon="budget"
            title="No budget set"
            message="Tell us a total and we will suggest a starting split across venue, catering, photography and the rest. Every figure stays yours to change."
            actionLabel="Set a budget"
            onAction={() => router.push(Routes.budgetSetup)}
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
          label="Add an expense"
          iconLeft="plus"
          onPress={() => router.push(Routes.expenseAdd)}
        />
      }
    >
      <Stack gap="xl">
        <PageHeader
          eyebrow="Budget"
          title="Where the money goes"
          trailing={<NotificationBell />}
          actionLabel="Edit total"
          actionIcon="edit"
          onActionPress={() => router.push(Routes.budgetSetup)}
        />

        {/* --- Over budget warning ----------------------------------------- */}
        {summary.isOverBudget ? (
          <Card tone="accent">
            <Row gap="sm">
              <Icon name="alert" size="lg" color="warning" />
              <Stack gap="hair" style={{ flex: 1 }}>
                <Text variant="h4">
                  {formatMoney(Math.abs(summary.remaining), currency)} over budget
                </Text>
                <Text variant="bodySm" color="muted">
                  Committed and spent together are past your total. Raise the total, or
                  look at the largest categories below.
                </Text>
              </Stack>
            </Row>
          </Card>
        ) : null}

        {/* --- Headline ----------------------------------------------------- */}
        <Card tone="raised">
          <Stack gap="md">
            <Stack gap="xxs">
              <Text variant="eyebrow" color="subtle">
                Still free to allocate
              </Text>
              <AnimatedNumber
                value={summary.remaining}
                variant="numericLg"
                color={summary.isOverBudget ? 'danger' : 'default'}
                format={(n) => formatMoney(n, currency)}
              />
              <Text variant="bodySm" color="muted">
                of {formatMoney(total, currency)} total
              </Text>
            </Stack>

            {/* Use a nonzero divisor when the budget is not set yet. */}
            <ProgressBar
              segments={[
                { key: 'spent', value: summary.spent / (total || 1), color: 'brand' },
                { key: 'committed', value: summary.committed / (total || 1), color: 'accent' },
              ]}
              height={10}
            />

            <Row gap="lg">
              <Figure label="Spent" value={summary.spent} currency={currency} tone="brand" />
              <Figure
                label="Committed"
                value={summary.committed}
                currency={currency}
                tone="accent"
              />
              <Figure
                label="Estimated"
                value={summary.estimated}
                currency={currency}
                tone="subtle"
              />
            </Row>
          </Stack>
        </Card>

        {/* --- Categories --------------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader
            eyebrow="The split"
            title="By category"
            subtitle="Tap any category to see what is in it."
          />

          <Card padding="none">
            {categorySummaries.map((entry) => (
              <ListRow
                key={entry.categoryId}
                title={entry.name}
                subtitle={`${formatMoneyCompact(entry.allocated, currency)} of ${formatMoneyCompact(
                  entry.total,
                  currency
                )}`}
                trailing={
                  entry.isOverAllocated ? (
                    <Badge label="Over" tone="danger" />
                  ) : (
                    <Text variant="caption" color="subtle">
                      {Math.round(percentOf(entry.allocated, entry.total))}%
                    </Text>
                  )
                }
                onPress={() => router.push(Routes.budgetCategory(entry.categoryId))}
              />
            ))}
          </Card>
        </Stack>

        {/* --- Recent expenses ---------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader eyebrow="Latest" title="Recent expenses" />

          {recent.length === 0 ? (
            <EmptyState
              compact
              icon="budget"
              title="Nothing recorded yet"
              message="Add the first payment or quote and the figures above start meaning something."
              actionLabel="Add an expense"
              onAction={() => router.push(Routes.expenseAdd)}
            />
          ) : (
            <Card padding="none">
              {recent.map((expense) => {
                const meta = PAYMENT_STATUS_META[expense.paymentStatus] ?? {};
                return (
                  <ListRow
                    key={expense.id}
                    title={expense.title}
                    subtitle={
                      expense.vendorName ||
                      (expense.date ? formatMediumDate(expense.date) : 'No date')
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
    </Screen>
  );
}

/** One of the three figures under the progress bar. */
function Figure({ label, value, currency, tone }) {
  return (
    <Stack gap="hair">
      <Text variant="caption" color="subtle">
        {label}
      </Text>
      <Text variant="bodyStrong" color={tone === 'subtle' ? 'muted' : tone}>
        {formatMoneyCompact(value, currency)}
      </Text>
    </Stack>
  );
}
