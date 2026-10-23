import { useMemo } from 'react';

import { useProfileCollection } from '../../hooks/useProfileCollection';
import { DOCUMENT_FIELD } from '../lib/documentConstants';
import { sortDocuments } from '../lib/documentHelpers';

export function useWeddingDocuments() {
  const collection = useProfileCollection(DOCUMENT_FIELD);
  const documents = useMemo(() => sortDocuments(collection.records), [collection.records]);
  const toggleComplete = (id, completed) => collection.updateRecord(id, { completed });
  return { ...collection, documents, toggleComplete };
}

export default useWeddingDocuments;
