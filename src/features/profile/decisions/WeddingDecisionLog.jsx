import React from 'react';

import {
  Card,
  Chip,
  EmptyState,
  Row,
  SectionHeader,
  Stack,
  Text,
  useToast,
} from '@/design-system/components';
import { DecisionCard, DecisionForm } from './components';
import { useDecisionLog } from './hooks/useDecisionLog';
import { filterDecisions, summariseDecisions } from './lib/decisionHelpers';
import { DECISION_STATUSES } from './lib/decisionConstants';

const DECISION_FILTERS = [
  { value: 'all', label: 'All decisions' },
  { value: DECISION_STATUSES.OPEN, label: 'Open' },
  { value: DECISION_STATUSES.DECIDED, label: 'Decided' },
];

export function WeddingDecisionLog() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = React.useState('all');
  const { decisions, addRecord, decide, reopen, removeDecision } = useDecisionLog();
  const summary = summariseDecisions(decisions);
  const visibleDecisions = filterDecisions(decisions, statusFilter);

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
        <Row gap="xs" wrap>
          {DECISION_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              label={filter.label}
              selected={statusFilter === filter.value}
              onPress={() => setStatusFilter(filter.value)}
            />
          ))}
        </Row>
      ) : null}
      {decisions.length ? (
        <Stack gap="sm">
          {visibleDecisions.map((decision) => (
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
      {decisions.length > 0 && visibleDecisions.length === 0 ? (
        <EmptyState
          icon="check"
          compact
          title={`No ${statusFilter} decisions`}
          message="Choose another filter to review the rest of your decision log."
          actionLabel="Show all"
          onAction={() => setStatusFilter('all')}
        />
      ) : null}
      <Text variant="caption" color="subtle">
        Decisions are stored with the current wedding workspace on this device.
      </Text>
    </Stack>
  );
}

export default WeddingDecisionLog;
