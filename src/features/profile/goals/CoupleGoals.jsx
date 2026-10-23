import React from 'react';

import {
  Card,
  EmptyState,
  ProgressBar,
  SectionHeader,
  Stack,
  Text,
  useToast,
} from '@/design-system/components';
import { useCoupleGoals } from './hooks/useCoupleGoals';
import { GoalCard, GoalForm } from './components';
import { summariseGoals } from './lib/goalHelpers';

export function CoupleGoals() {
  const toast = useToast();
  const { goals, addRecord, removeRecord, setComplete } = useCoupleGoals();
  const summary = summariseGoals(goals);

  const saveGoal = (values) => {
    if (!addRecord(values)) {
      toast.error('Set up a wedding workspace before saving a shared goal.');
      return false;
    }
    toast.success('Shared goal added.');
    return true;
  };

  const removeGoal = (id) => {
    if (removeRecord(id)) toast.info('Shared goal removed.');
  };

  return (
    <Stack gap="sm" testID="profile-couple-goals">
      <SectionHeader
        eyebrow="Little wins together"
        title="Couple goals"
        subtitle={
          summary.total
            ? `${summary.completed} of ${summary.total} goals complete`
            : 'Choose a small shared intention for your planning season.'
        }
      />
      <Card>
        <GoalForm onSave={saveGoal} />
      </Card>
      {goals.length ? (
        <Stack gap="sm">
          <ProgressBar value={summary.completionPercent} />
          <Text variant="caption" color="muted">
            {summary.completionPercent}% complete
          </Text>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onComplete={setComplete} onRemove={removeGoal} />
          ))}
        </Stack>
      ) : (
        <EmptyState
          icon="heart"
          compact
          title="Start with one shared intention"
          message="Goals are small agreements and moments to make time for, not more tasks to stress over."
        />
      )}
    </Stack>
  );
}

export default CoupleGoals;
