import React from 'react';

import { Card, EmptyState, ProgressBar, Row, SectionHeader, Stack, Text } from '@/design-system/components';
import { formatMoney } from '@/lib/currency';
import { BudgetMetric } from './components/BudgetMetric';
import { useProfileBudgetSnapshot } from './hooks/useProfileBudgetSnapshot';
import { budgetStatusLabel, profileBudgetProgress } from './lib/budgetSnapshot';

export function ProfileBudgetSnapshot() {
  const { summary } = useProfileBudgetSnapshot();

  return (
    <Stack gap="sm" testID="profile-budget-snapshot">
      <SectionHeader
        eyebrow="A quick overview"
        title="Budget snapshot"
        subtitle={summary ? budgetStatusLabel(summary) : 'Your budget at a glance, alongside your profile.'}
      />
      {summary ? (
        <Card>
          <Stack gap="md">
            {!summary.isConfigured ? (
              <EmptyState
                icon="budget"
                compact
                title="Budget total not set"
                message="Add your total in the Budget area to see progress here."
              />
            ) : (
              <>
                <ProgressBar
                  value={profileBudgetProgress(summary)}
                  label="Spent and contractually committed"
                  valueLabel={`${Math.round(profileBudgetProgress(summary) * 100)}%`}
                />
                <Row gap="md" wrap>
                  <BudgetMetric label="Total" value={formatMoney(summary.total, summary.currency)} />
                  <BudgetMetric label="Paid" value={formatMoney(summary.spent, summary.currency)} />
                  <BudgetMetric label="Committed" value={formatMoney(summary.committed, summary.currency)} />
                  <BudgetMetric
                    label="Remaining"
                    value={formatMoney(summary.remaining, summary.currency)}
                    tone={summary.isOverBudget ? 'danger' : 'success'}
                  />
                </Row>
                {summary.estimated > 0 ? (
                  <Text variant="caption" color="muted">
                    {formatMoney(summary.estimated, summary.currency)} in estimates is not counted as
                    committed.
                  </Text>
                ) : null}
              </>
            )}
          </Stack>
        </Card>
      ) : (
        <EmptyState
          icon="budget"
          compact
          title="No budget started"
          message="Your budget figures will appear when you set up the Budget area."
        />
      )}
    </Stack>
  );
}

export default ProfileBudgetSnapshot;
