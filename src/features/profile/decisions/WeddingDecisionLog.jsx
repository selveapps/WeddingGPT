import React from 'react';

import { Card, EmptyState, SectionHeader, Stack, Text, useToast } from '@/design-system/components';
import { DecisionCard, DecisionForm } from './components';
import { useDecisionLog } from './hooks/useDecisionLog';
import { summariseDecisions } from './lib/decisionHelpers';

export function WeddingDecisionLog() {
  const toast = useToast();
  const { decisions, addRecord, decide, reopen, removeDecision } = useDecisionLog();
  const summary = summariseDecisions(decisions);

  const save = (values) => {
    if (!addRecord(values)) {
      toast.error('Set up a wedding workspace before tracking decisions.');
      return false;
    }
    toast.success('Decision added.');
    return true;
  };

  const choose = (id, option) => {
    if (decide(id, option)) toast.success('Decision saved.');
  };

  const reopenItem = (id) => {
    if (reopen(id)) toast.info('Decision reopened.');
  };

  const remove = (id) => {
    if (removeDecision(id)) toast.info('Decision removed.');
  };

  return (
    <Stack gap="sm" testID="profile-decision-log">
      <SectionHeader
        eyebrow="One choice at a time"
        title="Decision log"
        subtitle={`${summary.open} open · ${summary.decided} decided`}
      />
      <Card>
        <DecisionForm onSave={save} />
      </Card>
      {decisions.length ? (
        <Stack gap="sm">
          {decisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              onDecide={choose}
              onReopen={reopenItem}
              onRemove={remove}
            />
          ))}
        </Stack>
      ) : (
        <EmptyState
          icon="check"
          compact
          title="Keep decisions from circling"
          message="Write down the question, compare options, and record the choice when you are ready."
        />
      )}
      <Text variant="caption" color="subtle">
        Decisions are stored with the current wedding workspace on this device.
      </Text>
    </Stack>
  );
}

export default WeddingDecisionLog;
