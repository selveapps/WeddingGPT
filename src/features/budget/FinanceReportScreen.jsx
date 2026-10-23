import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListRow,
  Row,
  Screen,
  ScreenHeader,
  SectionHeader,
  SegmentedControl,
  Stack,
  Text,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  useBudgetStore,
  useEventStore,
  useWeddingStore,
  selectAllBudgetCategories,
  selectAllExpenses,
  selectBudget,
  selectEvents,
  selectWedding,
} from '@/store';
import {
  categoryReport,
  eventReport,
  financeReportCsv,
  heaviestMonth,
  paymentsDueByMonth,
  reportTotals,
  stillToPay,
} from '@/models';
import { formatMoney, formatMoneyCompact } from '@/lib/currency';
import { formatMediumDate } from '@/lib/date';
import { datedFilename, exportTextFile } from '@/services/files';

const VIEWS = [
  { value: 'category', label: 'Categories' },
  { value: 'event', label: 'Events' },
  { value: 'due', label: 'Payments due' },
];

/**
 * Budget reports (slice C4): where the money stands against the plan, by
 * category and by event, and what has to be paid when over the next year.
 * The CSV is for whoever else is helping with the money.
 */
export function FinanceReportScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const budget = useBudgetStore(selectBudget);
  const categories = useBudgetStore(selectAllBudgetCategories);
  const expenses = useBudgetStore(selectAllExpenses);
  const events = useEventStore(selectEvents);
  const wedding = useWeddingStore(selectWedding);
  const [view, setView] = useState('category');
  const [openMonth, setOpenMonth] = useState(null);

  const currency = budget?.currency ?? wedding?.currency;
  const total = budget?.total ?? 0;
  const money = (minor) => formatMoney(minor, currency);
  const compact = (minor) => formatMoneyCompact(minor, currency);

  const byCategory = useMemo(() => categoryReport(categories, expenses), [categories, expenses]);
  const totals = useMemo(() => reportTotals(total, categories, expenses), [total, categories, expenses]);
  const byEvent = useMemo(() => eventReport(events, expenses), [events, expenses]);
  const due = useMemo(() => paymentsDueByMonth(expenses), [expenses]);
  const busiest = heaviestMonth(due);
  const overspent = byCategory.filter((row) => row.overBy > 0);

  const exportCsv = async () => {
    const result = await exportTextFile({
      filename: datedFilename('budget-report'),
      text: financeReportCsv({ total, categories, expenses, events, currency }),
      title: 'Budget report',
    });
    if (result === 'downloaded') toast.success('Budget report downloaded');
    else if (result === 'failed') toast.error('Could not export the report');
  };

  if (!budget) {
    return (
      <Screen>
        <Stack gap="xl">
          <ScreenHeader eyebrow="Budget" title="Reports" />
          <EmptyState
            icon="budget"
            title="No budget set"
            message="Set a total first, and the reports show how each category and event is doing against it."
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
      footer={<Button label="Export as CSV" iconLeft="send" variant="secondary" onPress={exportCsv} />}
    >
      <Stack gap="lg">
        <ScreenHeader eyebrow="Budget" title="Reports" />

        {/* --- The headline ---------------------------------------------- */}
        <Card tone={totals.overBy ? 'accent' : 'raised'}>
          <Stack gap="xs">
            <Text variant="h4">
              {totals.overBy
                ? `${money(totals.overBy)} over your total`
                : `${money(total - totals.carried)} of ${money(total)} still free`}
            </Text>
            <Text variant="bodySm" color="muted">
              {`${money(totals.paid)} paid · ${money(totals.committed)} committed · ${money(totals.estimated)} estimated`}
            </Text>
            {overspent.length ? (
              <Text variant="bodySm" color="danger">
                {`Over plan: ${overspent.map((row) => row.name).join(', ')}`}
              </Text>
            ) : null}
            {totals.unallocated < 0 ? (
              <Text variant="bodySm" color="muted">
                {`Your categories plan ${money(-totals.unallocated)} more than the total.`}
              </Text>
            ) : null}
          </Stack>
        </Card>

        <SegmentedControl options={VIEWS} value={view} onChange={setView} />

        {/* --- By category ------------------------------------------------ */}
        {view === 'category' ? (
          <Card padding="none">
            {byCategory.map((row) => (
              <ListRow
                key={row.id ?? 'none'}
                title={row.name}
                subtitle={`${compact(row.carried)} of ${compact(row.planned)} planned${
                  row.estimated ? ` · ${compact(row.estimated)} estimated` : ''
                }`}
                trailing={
                  row.overBy ? (
                    <Badge label={`Over by ${compact(row.overBy)}`} tone="danger" />
                  ) : row.projectedOverBy ? (
                    <Badge label="Estimates go over" tone="warning" />
                  ) : (
                    <Text variant="caption" color="subtle">
                      {`${compact(row.paid)} paid`}
                    </Text>
                  )
                }
                showChevron={Boolean(row.id)}
                onPress={row.id ? () => router.push(Routes.budgetCategory(row.id)) : undefined}
              />
            ))}
          </Card>
        ) : null}

        {/* --- By event --------------------------------------------------- */}
        {view === 'event' ? (
          events.length ? (
            <Card padding="none">
              {byEvent.map((row) => (
                <ListRow
                  key={row.id ?? 'wedding'}
                  title={row.name}
                  subtitle={`${compact(row.paid)} paid · ${compact(row.committed)} committed${
                    row.estimated ? ` · ${compact(row.estimated)} estimated` : ''
                  }`}
                  trailing={<Text variant="bodyStrong">{compact(row.carried + row.estimated)}</Text>}
                  showChevron={false}
                />
              ))}
            </Card>
          ) : (
            <EmptyState
              compact
              icon="calendar"
              title="No events yet"
              message="Add your events in Planning, then choose an event on each cost to see them split here."
              actionLabel="Go to events"
              onAction={() => router.push(Routes.events)}
            />
          )
        ) : null}

        {/* --- Payments due ----------------------------------------------- */}
        {view === 'due' ? (
          <Stack gap="sm">
            <SectionHeader
              title="The next twelve months"
              subtitle={
                busiest
                  ? `${money(due.total)} still to pay. The heaviest month is ${busiest.label} (${money(busiest.total)}).`
                  : 'Nothing with a due date is still to pay.'
              }
            />
            {due.overdue.count ? (
              <Card tone="accent">
                <Stack gap="xs">
                  <Row justify="space-between" align="center">
                    <Text variant="bodyStrong" color="danger">
                      {`Overdue (${due.overdue.count})`}
                    </Text>
                    <Text variant="bodyStrong" color="danger">
                      {money(due.overdue.total)}
                    </Text>
                  </Row>
                  {due.overdue.expenses.map((expense) => (
                    <DueExpense key={expense.id} expense={expense} money={money} router={router} />
                  ))}
                </Stack>
              </Card>
            ) : null}
            <Card padding="none">
              {due.months.map((month) => (
                <React.Fragment key={month.month}>
                  <ListRow
                    title={month.label}
                    subtitle={
                      month.count
                        ? `${month.count} ${month.count === 1 ? 'payment' : 'payments'}`
                        : 'Nothing due'
                    }
                    trailing={
                      <Text variant="bodyStrong" color={month.total ? 'default' : 'subtle'}>
                        {compact(month.total)}
                      </Text>
                    }
                    showChevron={false}
                    onPress={
                      month.count
                        ? () => setOpenMonth(openMonth === month.month ? null : month.month)
                        : undefined
                    }
                  />
                  {openMonth === month.month
                    ? month.expenses.map((expense) => (
                        <DueExpense key={expense.id} expense={expense} money={money} router={router} inset />
                      ))
                    : null}
                </React.Fragment>
              ))}
            </Card>
            {due.later.count || due.undated.count ? (
              <Text variant="bodySm" color="muted">
                {[
                  due.later.count ? `${money(due.later.total)} due after that` : null,
                  due.undated.count ? `${money(due.undated.total)} committed with no due date yet` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Screen>
  );
}

/** One payment inside a month: what, when, and how much is left. */
function DueExpense({ expense, money, router, inset = false }) {
  return (
    <ListRow
      inset={inset}
      title={expense.title}
      subtitle={[expense.vendorName, expense.dueDate ? formatMediumDate(expense.dueDate) : null]
        .filter(Boolean)
        .join(' · ')}
      trailing={<Text variant="body">{money(stillToPay(expense))}</Text>}
      onPress={() => router.push(Routes.expenseDetail(expense.id))}
    />
  );
}

export default FinanceReportScreen;
