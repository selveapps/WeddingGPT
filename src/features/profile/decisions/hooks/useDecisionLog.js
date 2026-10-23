import { useMemo } from 'react';

import { useProfileCollection } from '../../hooks/useProfileCollection';
import { DECISION_FIELD, DECISION_STATUSES } from '../lib/decisionConstants';
import { sortDecisions } from '../lib/decisionHelpers';

export function useDecisionLog() {
  const collection = useProfileCollection(DECISION_FIELD);
  const decisions = useMemo(() => sortDecisions(collection.records), [collection.records]);

  const setDecisionStatus = (id, status, selectedOption = '') =>
    collection.updateRecord(id, { status, selectedOption });

  const removeDecision = (id) => collection.removeRecord(id);

  return {
    ...collection,
    decisions,
    setDecisionStatus,
    decide: (id, selectedOption) => setDecisionStatus(id, DECISION_STATUSES.DECIDED, selectedOption),
    reopen: (id) => setDecisionStatus(id, DECISION_STATUSES.OPEN, ''),
    removeDecision,
  };
}

export default useDecisionLog;
