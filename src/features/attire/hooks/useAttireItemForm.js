import { useCallback } from 'react';
import { useAttireStore } from '../../../store/attireStore';

export function useAttireItemForm(itemId) {
  const createItem = useAttireStore((s) => s.createItem);
  const updateItem = useAttireStore((s) => s.updateItem);
  const getItem = useAttireStore((s) => s.getItem);
  const existing = itemId ? getItem(itemId) : null;

  const save = useCallback((values) => {
    if (itemId) return updateItem(itemId, values);
    return createItem(values);
  }, [itemId, createItem, updateItem]);

  return { existing, save };
}
