import { useMemo } from 'react';

import { useProfileCollection } from '../../hooks/useProfileCollection';
import { JOURNAL_FIELD } from '../lib/journalConstants';
import { sortJournalEntries } from '../lib/journalHelpers';

export function useCoupleJournal() {
  const collection = useProfileCollection(JOURNAL_FIELD);
  const entries = useMemo(() => sortJournalEntries(collection.records), [collection.records]);
  return { ...collection, entries };
}

export default useCoupleJournal;
