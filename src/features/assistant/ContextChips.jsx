import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';

import { Text, Row, Icon, Stack } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import {
  useWeddingStore,
  usePlanningStore,
  useBudgetStore,
  useGuestStore,
  selectWedding,
  selectAllTasks,
  selectAllExpenses,
  selectBudgetTotal,
  selectAllGuests,
} from '@/store';
import { buildWeddingContext, contextChips } from '@/models';

/**
 * "WeddingGPT can see" - the context chips from PRD s.12.
 *
 * Shows exactly which facts about the wedding travel with each question, so
 * the couple knows why an answer mentions their budget - and, by omission,
 * that guest names and contact details do not.
 */
export function ContextChips() {
  const { colors, spacing, radii } = useTheme();
  const wedding = useWeddingStore(selectWedding);
  const tasks = usePlanningStore(selectAllTasks);
  const expenses = useBudgetStore(selectAllExpenses);
  const budgetTotal = useBudgetStore(selectBudgetTotal);
  const guests = useGuestStore(selectAllGuests);

  const chips = useMemo(
    () => contextChips(buildWeddingContext({ wedding, tasks, expenses, budgetTotal, guests })),
    [wedding, tasks, expenses, budgetTotal, guests]
  );

  if (chips.length === 0) return null;

  return (
    <Stack gap="xxs">
      <Text variant="eyebrow" color="subtle">
        WeddingGPT can see
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
        {chips.map((chip) => (
          <Row
            key={chip.key}
            gap="xxs"
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xxs + 2,
              borderRadius: radii.pill,
              backgroundColor: colors.surfaceMuted,
            }}
          >
            <Icon name={chip.icon} size="xs" color="inkMuted" />
            <Text variant="caption" color="muted">
              {chip.label}
            </Text>
          </Row>
        ))}
      </ScrollView>
    </Stack>
  );
}

export default ContextChips;
