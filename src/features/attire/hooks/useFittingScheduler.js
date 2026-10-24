import { useMemo, useCallback } from 'react';
import { useAttireStore } from '../../../store/attireStore';

export function useFittingScheduler() {
  const fittings = useAttireStore((s) => s.listFittings());
  const items = useAttireStore((s) => s.listItems());
  const createFitting = useAttireStore((s) => s.createFitting);
  const updateFitting = useAttireStore((s) => s.updateFitting);
  const removeFitting = useAttireStore((s) => s.removeFitting);
  const next = useAttireStore((s) => s.nextFitting());

  const itemsById = useMemo(() => {
    const map = {};
    for (const i of items) map[i.id] = i;
    return map;
  }, [items]);

  const save = useCallback((values, id) => {
    if (id) return updateFitting(id, values);
    return createFitting(values);
  }, [createFitting, updateFitting]);

  return { fittings, items, itemsById, next, save, removeFitting };
}
