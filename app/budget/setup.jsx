import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Button,
  ListRow,
  ScreenHeader,
  SectionHeader,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  useBudgetStore,
  useWeddingStore,
  selectBudget,
  selectHasBudget,
  selectWedding,
} from '@/store';
import { DEFAULT_BUDGET_ALLOCATION, budgetOptionsFor } from '@/models';
import { formatMoney, formatMoneyCompact, DEFAULT_CURRENCY } from '@/lib/currency';
import { MoneyField } from '@/features/shared/MoneyField';

/**
 * Budget setup, and later the place to change the total (PRD s.8).
 *
 * The preview below the field is the point of the screen: a number on its own
 * means nothing, but "thirty percent of this goes to the venue" is a decision
 * you can react to. Changing an existing total rescales every category rather
 * than leaving allocations summing to the old figure - see `setTotal`.
 */
export default function BudgetSetupScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();

  const hasBudget = useBudgetStore(selectHasBudget);
  const budget = useBudgetStore(selectBudget);
  const initialiseBudget = useBudgetStore((state) => state.initialiseBudget);
  const setTotal = useBudgetStore((state) => state.setTotal);
  const setBudgetCurrency = useBudgetStore((state) => state.setCurrency);

  const wedding = useWeddingStore(selectWedding);
  const updateWedding = useWeddingStore((state) => state.updateWedding);

  // US launch: every budget is in dollars. Saving also moves any older
  // workspace that was created in another currency onto USD.
  const currency = DEFAULT_CURRENCY;
  const [total, setTotalInput] = useState(budget?.total ?? wedding?.budgetTotal ?? null);

  // Only meaningful for a new budget. Once categories exist the couple may have
  // tuned them, and showing them the default split again would misrepresent
  // what pressing Update actually does (which is rescale, not reset).
  const preview = useMemo(() => {
    if (!total || hasBudget) return [];
    return DEFAULT_BUDGET_ALLOCATION.map((entry) => ({
      ...entry,
      amount: Math.round(total * entry.share),
    }));
  }, [total, hasBudget]);

  const save = () => {
    if (!total || total <= 0) return;

    if (hasBudget) {
      setTotal(total);
      setBudgetCurrency(currency);
    } else {
      initialiseBudget({ weddingId: wedding?.id, total, currency });
    }

    // Keep the wedding's own copy in step, so the plan screen and any future
    // export agree with the budget store.
    if (wedding) updateWedding({ budgetTotal: total, currency });

    toast.success(hasBudget ? 'Budget updated' : 'Budget created');
    router.replace(Routes.budget);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        bottomInset={spacing.xxl}
        footer={
          <Button
            label={hasBudget ? 'Update budget' : 'Create my budget'}
            disabled={!total || total <= 0}
            onPress={save}
          />
        }
      >
        <Stack gap="lg">
          <ScreenHeader eyebrow="Budget" title={hasBudget ? 'Edit total' : 'Set a budget'} />

          <Stack gap="sm">
            <Text variant="h1" heading>
              {hasBudget ? 'Change your total' : 'What are you working with?'}
            </Text>
            <Text variant="body" color="muted">
              {hasBudget
                ? 'Every category allocation is rescaled by the same proportion, so the split you have tuned stays intact.'
                : 'We will split it across every category to give you a starting point. Nothing here is fixed.'}
            </Text>
          </Stack>

          <MoneyField
            label="Total budget"
            value={total}
            onChange={setTotalInput}
            currency={currency}
            helper="Everything you expect to spend, from all sources."
            autoFocus={!hasBudget}
          />

          {/* --- Quick bands ------------------------------------------------ */}
          {!hasBudget ? (
            <Stack gap="xs">
              <Text variant="eyebrow" color="subtle">
                Or pick a band
              </Text>
              <Row gap="xs" wrap align="flex-start">
                {budgetOptionsFor(currency).filter((option) => option.value !== null).map((option) => (
                  <Button
                    key={option.label}
                    label={option.label}
                    variant={total === option.value ? 'soft' : 'secondary'}
                    size="sm"
                    fullWidth={false}
                    onPress={() => setTotalInput(option.value)}
                  />
                ))}
              </Row>
            </Stack>
          ) : null}

          {/* --- Preview ----------------------------------------------------- */}
          {preview.length > 0 ? (
            <Stack gap="sm">
              <SectionHeader
                eyebrow="What that looks like"
                title="Your starting split"
                subtitle={`${formatMoney(total, currency)} across ${preview.length} categories.`}
              />

              <Card padding="none">
                {preview.map((entry) => (
                  <ListRow
                    key={entry.key}
                    icon={entry.icon}
                    title={entry.name}
                    showChevron={false}
                    trailing={
                      <Stack gap="hair" align="flex-end">
                        <Text variant="bodyStrong">
                          {formatMoneyCompact(entry.amount, currency)}
                        </Text>
                        <Text variant="caption" color="subtle">
                          {Math.round(entry.share * 100)}%
                        </Text>
                      </Stack>
                    }
                  />
                ))}
              </Card>
            </Stack>
          ) : null}
        </Stack>
      </Screen>
    </KeyboardAvoidingView>
  );
}
