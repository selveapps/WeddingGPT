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
 * Summarizes the wedding information currently available to WeddingGPT.
 * Renders nothing when there is no context to show.
 */
export function ContextChips() {
  const { colors, spacing, radii } = useTheme();
  const wedding = useWeddingStore(selectWedding);
  const tasks = usePlanningStore(selectAllTasks);
  const expenses = useBudgetStore(selectAllExpenses);
  const budgetTotal = useBudgetStore(selectBudgetTotal);
  const guests = useGuestStore(selectAllGuests);

  // Compute the context chips based on the wedding data, tasks, expenses, budget total, and guests.
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
      {/* Context chips showing the information available to WeddingGPT */}
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
