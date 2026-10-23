import React from 'react';

import { Card, EmptyState, SectionHeader, Stack, useToast } from '@/design-system/components';
import { useMilestones } from './hooks/useMilestones';
import { MilestoneCard, MilestoneForm, NextAnniversary } from './components';
import { summariseMilestones } from './lib/milestoneHelpers';

export function RelationshipMilestones() {
  const toast = useToast();
  const { milestones, addRecord, removeRecord, toggleComplete } = useMilestones();
  const summary = summariseMilestones(milestones);

  const saveMilestone = (values) => {
    if (!addRecord(values)) {
      toast.error('Set up a wedding workspace before adding milestones.');
      return false;
    }
    toast.success('Milestone added.');
    return true;
  };

  const removeMilestone = (id) => {
    if (removeRecord(id)) toast.info('Milestone removed.');
  };

  return (
    <Stack gap="sm" testID="profile-milestones">
      <SectionHeader
        eyebrow="Your story so far"
        title="Relationship milestones"
        subtitle={`${summary.upcoming} to look forward to · ${summary.completed} celebrated`}
      />
      <Card>
        <MilestoneForm onSave={saveMilestone} />
      </Card>
      <NextAnniversary milestones={milestones} />
      {milestones.length ? (
        <Stack gap="sm">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onToggle={toggleComplete}
              onRemove={removeMilestone}
            />
          ))}
        </Stack>
      ) : (
        <EmptyState
          icon="calendar"
          compact
          title="Mark a moment in your story"
          message="Add a date you want to celebrate, from your first date to a planning win."
        />
      )}
    </Stack>
  );
}

export default RelationshipMilestones;
