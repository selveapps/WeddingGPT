import { useCallback } from 'react';

import { createId } from '@/lib/id';
import { useWeddingStore, selectWedding } from '@/store/weddingStore';

/**
 * Small workspace-backed collection primitive for the profile's personal
 * planning tools. Each caller supplies a fixed wedding field name.
 */
export function useProfileCollection(field) {
  const wedding = useWeddingStore(selectWedding);
  const updateWedding = useWeddingStore((state) => state.updateWedding);
  const weddingRecords = wedding?.[field];
  const records = Array.isArray(weddingRecords) ? weddingRecords : [];

  const addRecord = useCallback(
    (values) => {
      const currentWedding = useWeddingStore.getState().wedding;
      if (!currentWedding) return null;
      const current = Array.isArray(currentWedding[field]) ? currentWedding[field] : [];
      const now = new Date().toISOString();
      const record = {
        id: createId(field),
        createdAt: now,
        updatedAt: now,
        ...values,
      };
      updateWedding({ [field]: [...current, record] });
      return record;
    },
    [field, updateWedding]
  );

  const updateRecord = useCallback(
    (id, patch) => {
      const currentWedding = useWeddingStore.getState().wedding;
      if (!currentWedding) return null;
      const current = Array.isArray(currentWedding[field]) ? currentWedding[field] : [];
      const existing = current.find((record) => record.id === id);
      if (!existing) return null;
      const updated = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
      updateWedding({
        [field]: current.map((record) => (record.id === id ? updated : record)),
      });
      return updated;
    },
    [field, updateWedding]
  );

  const removeRecord = useCallback(
    (id) => {
      const currentWedding = useWeddingStore.getState().wedding;
      if (!currentWedding) return false;
      const current = Array.isArray(currentWedding[field]) ? currentWedding[field] : [];
      if (!current.some((record) => record.id === id)) return false;
      updateWedding({ [field]: current.filter((record) => record.id !== id) });
      return true;
    },
    [field, updateWedding]
  );

  return { records, addRecord, updateRecord, removeRecord };
}

export default useProfileCollection;
